/**
 * Planner for V2 redeem operations.
 *
 * Builds the collateral->debt swap needed to repay debt during redemption, then
 * calculates the remaining collateral to return to the user with slippage protection.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import { BASE_WETH, ETH_SENTINEL } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'
import { calculateMinCollateralForSender } from '../utils/slippage'
import type { QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling)
type TokenArg = Address
type SharesToRedeemArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>

const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction redeem via the V2 router.
 *
 * Fields prefixed with "expected" are derived from LeverageManager.previewRedeem and
 * are used to size swaps and to provide UI expectations. "minCollateralForSender" is a
 * slippage-adjusted floor used for the on-chain redeem call.
 */
export type RedeemPlanV2 = {
  /** Leverage token being redeemed. */
  token: Address
  /** Number of leverage token shares to redeem. */
  sharesToRedeem: SharesToRedeemArg
  /** Token's collateral asset as reported by the manager. */
  collateralAsset: Address
  /** Token's debt asset as reported by the manager. */
  debtAsset: Address
  /** Slippage tolerance in basis points used for this plan. */
  slippageBps: number
  /** Minimum acceptable collateral after applying `slippageBps` against expected collateral. */
  minCollateralForSender: bigint
  /** Collateral expected to be returned to user after debt repayment (before optional conversions). */
  expectedCollateral: bigint
  /** Debt expected to be repaid during redemption. */
  expectedDebt: bigint
  /** Total collateral available before debt repayment. */
  expectedTotalCollateral: bigint
  /** Excess collateral (if more collateral is available than needed for debt repayment). */
  expectedExcessCollateral: bigint
  /** Debt amount expected to be returned to the user (non-zero only when converting collateral to debt). */
  expectedDebtPayout: bigint
  /** Asset address the user will receive after all swaps (collateral or alternate). */
  payoutAsset: Address
  /** Final expected amount of `payoutAsset` returned to the user. */
  payoutAmount: bigint
  /**
   * Encoded router calls (approve + swap) to be submitted to V2 `redeem`.
   * The sequence includes the collateral->debt swap needed for debt repayment.
   */
  calls: V2Calls
}

export async function planRedeemV2(params: {
  config: Config
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps: number
  quoteCollateralToDebt: QuoteFn
  /** Optional explicit LeverageManagerV2 address (for VNet/custom) */
  managerAddress?: Address
  /** Optional explicit output asset for user payout (defaults to collateral). */
  outputAsset?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<RedeemPlanV2> {
  const {
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    managerAddress,
    chainId,
  } = params

  const { collateralAsset, debtAsset } = await getManagerAssets({
    config,
    token,
    chainId,
    ...(managerAddress ? { managerAddress } : {}),
  })

  // Initial preview to understand the redemption
  const initialPreview = await readLeverageManagerV2PreviewRedeem(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token, sharesToRedeem],
    chainId,
  })

  const totalCollateralAvailable = initialPreview.collateral
  const debtToRepay = initialPreview.debt

  // If no debt to repay, return all collateral directly
  if (debtToRepay <= 0n) {
    const minCollateralForSender = calculateMinCollateralForSender(
      totalCollateralAvailable,
      slippageBps,
    )
    return {
      token,
      sharesToRedeem,
      collateralAsset,
      debtAsset,
      slippageBps,
      minCollateralForSender,
      expectedCollateral: totalCollateralAvailable,
      expectedDebt: 0n,
      expectedTotalCollateral: totalCollateralAvailable,
      expectedExcessCollateral: totalCollateralAvailable,
      expectedDebtPayout: 0n,
      payoutAsset: collateralAsset,
      payoutAmount: totalCollateralAvailable,
      calls: [], // No swaps needed
    }
  }

  // Calculate how much collateral we need to swap to repay the debt
  const useNativeCollateralPath = getAddress(collateralAsset) === getAddress(BASE_WETH)
  const inTokenForQuote = useNativeCollateralPath ? ETH_SENTINEL : collateralAsset

  const collateralNeededForDebt = await calculateCollateralNeededForDebt({
    debtAsset,
    debtToRepay,
    quoteCollateralToDebt,
    maxCollateralAvailable: totalCollateralAvailable,
    inTokenForQuote,
  })

  // Ensure we have enough collateral to repay the debt
  if (collateralNeededForDebt > totalCollateralAvailable) {
    throw new Error('Insufficient collateral to repay debt')
  }

  // Pad the swap input slightly so rounding/flooring during execution does not leave us
  // a few wei short when repaying debt (e.g. Uniswap V2 floors amountsOut). Single wei
  // padding keeps amountOutMin effectively unchanged but gives Morpho pulls a cushion.
  const padding =
    collateralNeededForDebt > 0n && totalCollateralAvailable > collateralNeededForDebt ? 1n : 0n
  const paddedCollateralForDebt = collateralNeededForDebt + padding
  const remainingCollateral = totalCollateralAvailable - paddedCollateralForDebt
  // Build the collateral->debt swap calls
  const { calls: swapCalls } = await buildCollateralToDebtSwapCalls({
    collateralAsset,
    debtAsset,
    collateralAmount: paddedCollateralForDebt,
    quoteCollateralToDebt,
    inTokenForQuote,
    useNativeCollateralPath,
  })

  const collateralAddr = getAddress(collateralAsset)
  const debtAddr = getAddress(debtAsset)
  const payoutOverride = params.outputAsset ? getAddress(params.outputAsset) : undefined
  const wantsDebtOutput = payoutOverride ? payoutOverride === debtAddr : false

  const planDraft = {
    minCollateralForSender: calculateMinCollateralForSender(remainingCollateral, slippageBps),
    expectedCollateral: remainingCollateral,
    expectedDebtPayout: 0n,
    payoutAsset: wantsDebtOutput ? debtAddr : collateralAddr,
    payoutAmount: remainingCollateral,
    calls: [...swapCalls] as V2Calls,
  }

  if (wantsDebtOutput) {
    planDraft.minCollateralForSender = 0n
    planDraft.expectedCollateral = 0n

    if (remainingCollateral > 0n) {
      const { calls: payoutCalls, expectedDebtOut } = await buildCollateralToDebtSwapCalls({
        collateralAsset,
        debtAsset,
        collateralAmount: remainingCollateral,
        quoteCollateralToDebt,
        inTokenForQuote,
        useNativeCollateralPath,
      })
      planDraft.calls.push(...payoutCalls)
      planDraft.expectedDebtPayout = expectedDebtOut
      planDraft.payoutAmount = expectedDebtOut
    } else {
      planDraft.payoutAmount = 0n
    }
  }

  return {
    token,
    sharesToRedeem,
    collateralAsset,
    debtAsset,
    slippageBps,
    minCollateralForSender: planDraft.minCollateralForSender,
    expectedCollateral: planDraft.expectedCollateral,
    expectedDebt: debtToRepay,
    expectedTotalCollateral: totalCollateralAvailable,
    expectedExcessCollateral: remainingCollateral,
    expectedDebtPayout: planDraft.expectedDebtPayout,
    payoutAsset: planDraft.payoutAsset,
    payoutAmount: planDraft.payoutAmount,
    calls: planDraft.calls,
  }
}

// Helper functions

async function getManagerAssets(args: {
  config: Config
  token: TokenArg
  managerAddress?: Address
  chainId: number
}) {
  const { config, token, managerAddress, chainId } = args
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token],
    chainId,
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token],
    chainId,
  })
  return { collateralAsset, debtAsset }
}

async function calculateCollateralNeededForDebt(args: {
  debtAsset: Address
  debtToRepay: bigint
  quoteCollateralToDebt: QuoteFn
  maxCollateralAvailable: bigint
  inTokenForQuote: Address
}): Promise<bigint> {
  const { debtAsset, debtToRepay, quoteCollateralToDebt, maxCollateralAvailable, inTokenForQuote } =
    args

  if (debtToRepay <= 0n) return 0n
  if (maxCollateralAvailable <= 0n) {
    throw new Error('No collateral available to repay debt')
  }

  const upperBound = maxCollateralAvailable
  let attempt = debtToRepay > upperBound ? upperBound : debtToRepay
  if (attempt <= 0n) {
    attempt = upperBound
  }

  let previous: bigint | undefined
  for (let i = 0; i < 12; i++) {
    if (attempt <= 0n) {
      attempt = 1n
    }

    const quote = await quoteCollateralToDebt({
      inToken: inTokenForQuote,
      outToken: debtAsset,
      amountIn: attempt,
    })

    if (quote.out <= 0n) {
      throw new Error('Quote returned zero output while sizing collateral swap')
    }

    if (quote.out < debtToRepay && attempt === upperBound) {
      throw new Error('Insufficient collateral to repay debt')
    }

    const required = mulDivCeil(debtToRepay, attempt, quote.out)
    if (required > upperBound) {
      throw new Error('Insufficient collateral to repay debt')
    }

    if (required === attempt || (typeof previous !== 'undefined' && required === previous)) {
      return applyRequiredBuffer({ required, maxCollateralAvailable: upperBound })
    }

    previous = attempt
    attempt = required
  }

  throw new Error('Collateral sizing did not converge within iteration limit')
}

const BPS_DENOMINATOR_BIGINT = 10_000n
const REPAY_BUFFER_BPS = 1n
const MIN_BUFFER_WEI = 1n

function applyRequiredBuffer(args: { required: bigint; maxCollateralAvailable: bigint }): bigint {
  const { required, maxCollateralAvailable } = args
  if (required >= maxCollateralAvailable) return required

  const proportionalComponent =
    required === 0n
      ? 0n
      : (required * REPAY_BUFFER_BPS + (BPS_DENOMINATOR_BIGINT - 1n)) / BPS_DENOMINATOR_BIGINT
  const buffer = proportionalComponent > MIN_BUFFER_WEI ? proportionalComponent : MIN_BUFFER_WEI
  const buffered = required + buffer

  return buffered > maxCollateralAvailable ? maxCollateralAvailable : buffered
}

async function buildCollateralToDebtSwapCalls(args: {
  collateralAsset: Address
  debtAsset: Address
  collateralAmount: bigint
  quoteCollateralToDebt: QuoteFn
  inTokenForQuote: Address
  useNativeCollateralPath: boolean
}): Promise<{ calls: V2Calls; expectedDebtOut: bigint }> {
  const {
    collateralAsset,
    debtAsset,
    collateralAmount,
    quoteCollateralToDebt,
    inTokenForQuote,
    useNativeCollateralPath,
  } = args

  if (collateralAmount <= 0n) {
    return { calls: [], expectedDebtOut: 0n }
  }

  const quote = await quoteCollateralToDebt({
    inToken: inTokenForQuote,
    outToken: debtAsset,
    amountIn: collateralAmount,
  })

  const calls: V2Calls = []

  if (useNativeCollateralPath) {
    calls.push({
      target: getAddress(collateralAsset),
      data: encodeFunctionData({
        abi: WETH_WITHDRAW_ABI,
        functionName: 'withdraw',
        args: [collateralAmount],
      }),
      value: 0n,
    })
  } else {
    calls.push({
      target: getAddress(collateralAsset),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [getAddress(quote.approvalTarget), collateralAmount],
      }),
      value: 0n,
    })
  }

  calls.push({
    target: getAddress(quote.approvalTarget),
    data: quote.calldata,
    value: useNativeCollateralPath ? collateralAmount : 0n,
  })

  return { calls, expectedDebtOut: quote.out }
}

function mulDivCeil(a: bigint, b: bigint, d: bigint): bigint {
  if (d === 0n) throw new Error('Division by zero in mulDivCeil')
  const numerator = a * b
  return numerator === 0n ? 0n : (numerator + (d - 1n)) / d
}

/**
 * Validate a redeem plan to ensure it's safe to execute.
 */
export function validateRedeemPlan(plan: RedeemPlanV2): boolean {
  if (plan.sharesToRedeem <= 0n) return false
  if (plan.expectedCollateral < 0n) return false
  if (plan.minCollateralForSender < 0n) return false
  if (plan.expectedDebtPayout < 0n) return false
  if (plan.payoutAmount < 0n) return false
  if (plan.slippageBps < 0 || plan.slippageBps > 10000) return false
  if (plan.minCollateralForSender > plan.expectedCollateral) return false
  return true
}
