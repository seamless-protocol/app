/**
 * Planner for V2 redeem operations.
 *
 * Builds the collateral->debt swap needed to repay debt during redemption, then
 * calculates the remaining collateral to return to the user with slippage protection.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi, zeroAddress } from 'viem'
import type { Config } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'
import { lendingAdapterAbi } from '@/lib/contracts/abis/lendingAdapter'
import { BASE_WETH, ETH_SENTINEL, type SupportedChainId } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2GetLeverageTokenLendingAdapter,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'
import { fetchCoingeckoTokenUsdPrices } from '@/lib/prices/coingecko'
import { calculateMinCollateralForSender } from '../utils/slippage'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling)
type TokenArg = Address
type SharesToRedeemArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>

const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction redeem.
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
  /** Quote used for collateral-to-debt swap. */
  collateralToDebtQuote: Quote
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
  /** Optional explicit output asset for user payout (defaults to collateral). */
  outputAsset?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
  /** Intent for collateral->debt quote */
  intent: 'exactOut' | 'exactIn'
}): Promise<RedeemPlanV2> {
  const {
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt: quoter,
    chainId,
    intent,
  } = params

  const {
    collateralAsset,
    debtAsset,
    totalCollateralAvailable,
    debtToRepay,
    minCollateralForSender,
    collateralAvailableForSwap,
  } = await getSwapParamsForRedeem({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    chainId,
  })

  const useNativeCollateralPath = getAddress(collateralAsset) === getAddress(BASE_WETH)
  const inTokenForQuote = useNativeCollateralPath ? ETH_SENTINEL : collateralAsset

  const quote = await getCollateralToDebtQuote({
    debtAsset,
    requiredDebt: debtToRepay,
    quoter,
    collateralAvailableForSwap,
    inTokenForQuote,
    intent,
  })

  const collateralRequiredForSwap = quote.maxIn ?? 0n
  if (collateralAvailableForSwap < collateralRequiredForSwap) {
    throw new Error(
      'Try increasing slippage: the transaction will likely revert due to unmet minimum collateral received',
    )
  }

  const { calls: swapCalls } = await buildCollateralToDebtSwapCalls({
    collateralAsset,
    collateralAmount: collateralRequiredForSwap,
    useNativeCollateralPath,
    quote,
  })

  const collateralAddr = getAddress(collateralAsset)
  const debtAddr = getAddress(debtAsset)
  const payoutOverride = params.outputAsset ? getAddress(params.outputAsset) : undefined
  const wantsDebtOutput = payoutOverride ? payoutOverride === debtAddr : false

  let remainingCollateral = totalCollateralAvailable - collateralRequiredForSwap
  const planDraft = {
    minCollateralForSender,
    expectedCollateral: remainingCollateral,
    expectedDebtPayout: quote.out - debtToRepay,
    payoutAsset: wantsDebtOutput ? debtAddr : collateralAddr,
    payoutAmount: remainingCollateral,
    calls: [...swapCalls] as V2Calls,
  }

  if (wantsDebtOutput) {
    planDraft.minCollateralForSender = 0n
    planDraft.expectedCollateral = 0n

    if (remainingCollateral > 0n) {
      const quoteWithFullDebtOutput = await getCollateralToDebtQuote({
        debtAsset,
        requiredDebt: debtToRepay,
        quoter,
        collateralAvailableForSwap: totalCollateralAvailable,
        inTokenForQuote,
        intent: 'exactIn',
      })
      const { calls: payoutCalls } = await buildCollateralToDebtSwapCalls({
        collateralAsset,
        collateralAmount: totalCollateralAvailable,
        useNativeCollateralPath,
        quote: quoteWithFullDebtOutput,
      })

      const remainingDebt = quoteWithFullDebtOutput.out - debtToRepay

      planDraft.calls.push(...payoutCalls)
      planDraft.expectedDebtPayout = remainingDebt
      planDraft.payoutAmount = remainingDebt

      remainingCollateral = 0n
    } else {
      planDraft.payoutAmount = 0n
    }
  }

  const publicClient = getPublicClient(config)
  if (!publicClient) {
    throw new Error('Public client unavailable for mint plan')
  }
  // TODO: Multicall these / pass in
  const collateralAssetDecimals = await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  const debtAssetDecimals = await publicClient.readContract({
    address: debtAsset,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  const usdPriceMap = await fetchCoingeckoTokenUsdPrices(chainId, [collateralAsset, debtAsset])
  const expectedCollateralInUsd =
    (usdPriceMap?.[collateralAsset.toLowerCase()] ?? 0) *
    (Number(planDraft.expectedCollateral) / 10 ** Number(collateralAssetDecimals))
  const expectedDebtPayoutInUsd =
    (usdPriceMap?.[debtAsset.toLowerCase()] ?? 0) *
    (Number(planDraft.expectedDebtPayout) / 10 ** Number(debtAssetDecimals))
  const minCollateralForSenderInUsd =
    (usdPriceMap?.[collateralAsset.toLowerCase()] ?? 0) *
    (Number(planDraft.minCollateralForSender) / 10 ** Number(collateralAssetDecimals))

  // Slippage is wrt the coingecko usd prices of the received collateral and debt
  if (minCollateralForSenderInUsd > expectedCollateralInUsd + expectedDebtPayoutInUsd) {
    throw new Error('Try increasing slippage: the transaction will likely revert due to slippage')
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
    collateralToDebtQuote: quote,
    expectedTotalCollateral: totalCollateralAvailable,
    expectedExcessCollateral: remainingCollateral,
    expectedDebtPayout: planDraft.expectedDebtPayout,
    payoutAsset: planDraft.payoutAsset,
    payoutAmount: planDraft.payoutAmount,
    calls: planDraft.calls,
  }
}

// Helper functions

async function getSwapParamsForRedeem(args: {
  config: Config
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps: number
  chainId: number
}): Promise<{
  collateralAsset: Address
  debtAsset: Address
  totalCollateralAvailable: bigint
  debtToRepay: bigint
  minCollateralForSender: bigint
  collateralAvailableForSwap: bigint
}> {
  const { config, token, sharesToRedeem, slippageBps, chainId } = args

  // TODO: Multicall these
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
  })
  const preview = await readLeverageManagerV2PreviewRedeem(config, {
    args: [token, sharesToRedeem],
    chainId: chainId as SupportedChainId,
  })
  const lendingAdapter = await readLeverageManagerV2GetLeverageTokenLendingAdapter(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
  })

  const totalCollateralAvailable = preview.collateral
  const debtToRepay = preview.debt

  const publicClient = getPublicClient(config)
  if (!publicClient) {
    throw new Error('Public client unavailable for redeem plan')
  }

  // Determine the amount of collateral the user would receive if there is 0 slippage on the swap from collateral -> debt wrt
  // the market's underlying oracle price
  const debtInCollateralAsset = await publicClient.readContract({
    address: lendingAdapter,
    abi: lendingAdapterAbi,
    functionName: 'convertDebtToCollateralAsset',
    args: [debtToRepay],
  })
  const zeroSlippageCollateralForSender = totalCollateralAvailable - debtInCollateralAsset

  // Apply slippage to the amount of collateral the user would receive if there is 0 slippage on the swap from collateral -> debt wrt
  const minCollateralForSender = calculateMinCollateralForSender(
    zeroSlippageCollateralForSender,
    slippageBps,
  )

  // We simply use the full amount at our disposal for the swap, considering allowed slippage
  const collateralAvailableForSwap = totalCollateralAvailable - minCollateralForSender

  return {
    collateralAsset,
    debtAsset,
    totalCollateralAvailable,
    debtToRepay,
    minCollateralForSender,
    collateralAvailableForSwap,
  }
}

async function getCollateralToDebtQuote(args: {
  debtAsset: Address
  requiredDebt: bigint
  quoter: QuoteFn
  collateralAvailableForSwap: bigint
  inTokenForQuote: Address
  intent: 'exactOut' | 'exactIn'
}): Promise<Quote> {
  const { debtAsset, requiredDebt, quoter, collateralAvailableForSwap, inTokenForQuote, intent } =
    args

  if (requiredDebt <= 0n) return { out: 0n, approvalTarget: zeroAddress, calldata: '0x' }

  const quote = await quoter({
    inToken: inTokenForQuote,
    outToken: debtAsset,
    amountIn: intent === 'exactOut' ? 0n : collateralAvailableForSwap,
    amountOut: requiredDebt,
    intent,
  })

  if (quote.out < requiredDebt) {
    throw new Error(
      'Try increasing slippage: swap of collateral to repay debt for the leveraged position is below the required debt.',
    )
  }

  return quote
}

async function buildCollateralToDebtSwapCalls(args: {
  collateralAsset: Address
  collateralAmount: bigint
  useNativeCollateralPath: boolean
  quote: Quote
}): Promise<{ calls: V2Calls }> {
  const { collateralAsset, collateralAmount, useNativeCollateralPath, quote } = args

  if (collateralAmount <= 0n) {
    return { calls: [] }
  }

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

  return { calls }
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
