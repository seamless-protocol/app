/**
 * Planner for redeem operations.
 *
 * Builds the collateral->debt swap needed to repay debt during redemption, then
 * calculates the remaining collateral to return to the user with slippage protection.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi, parseUnits, zeroAddress } from 'viem'
import type { Config } from 'wagmi'
import { USD_DECIMALS } from '@/domain/shared/prices'
import type { Call } from '@/domain/shared/types'
import { BASE_WETH, ETH_SENTINEL, type SupportedChainId } from '@/lib/contracts/addresses'
import { readLeverageManagerV2PreviewRedeem } from '@/lib/contracts/generated'
import { fetchTokenUsdPrices } from '@/lib/prices/fetchUsdPrices'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling)
type TokenArg = Address
type SharesToRedeemArg = bigint

const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction redeem.
 *
 * Fields prefixed with "expected" are derived from LeverageManager.previewRedeem and
 * are used to size swaps and to provide UI expectations. "minCollateralForSender" is a
 * slippage-adjusted floor used for the on-chain redeem call.
 */
export type RedeemPlan = {
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
   * Encoded router calls (approve + swap) to be submitted to `redeem`.
   * The sequence includes the collateral->debt swap needed for debt repayment.
   */
  calls: Array<Call>
}

export async function planRedeem(params: {
  config: Config
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps: number
  quoteCollateralToDebt: QuoteFn
  /** Collateral asset address for the leverage token */
  collateralAsset: Address
  /** Debt asset address for the leverage token */
  debtAsset: Address
  /** Collateral asset decimals */
  collateralAssetDecimals: number
  /** Debt asset decimals */
  debtAssetDecimals: number
  /** Optional explicit output asset for user payout (defaults to collateral). */
  outputAsset?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
  /** Intent for collateral->debt quote */
  intent: 'exactOut' | 'exactIn'
  /** Optional block number to pin all on-chain previews for consistency */
  blockNumber?: bigint
}): Promise<RedeemPlan> {
  const {
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt: quoter,
    collateralAsset,
    debtAsset,
    collateralAssetDecimals,
    debtAssetDecimals,
    chainId,
    intent,
    blockNumber,
  } = params

  const {
    totalCollateralAvailable,
    debtToRepay,
    minCollateralForSender,
    collateralAvailableForSwap,
  } = await getSwapParamsForRedeem({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    collateralAsset,
    debtAsset,
    collateralAssetDecimals,
    debtAssetDecimals,
    chainId,
    blockNumber,
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
    calls: [...swapCalls] as Array<Call>,
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

  const usdPriceMap = await fetchTokenUsdPrices(chainId, [collateralAsset, debtAsset])
  const priceColl2 = parseUnits(
    String(usdPriceMap?.[collateralAsset.toLowerCase()] ?? 0),
    USD_DECIMALS,
  )
  const priceDebt2 = parseUnits(String(usdPriceMap?.[debtAsset.toLowerCase()] ?? 0), USD_DECIMALS)
  const collScale2 = 10n ** BigInt(collateralAssetDecimals)
  const debtScale2 = 10n ** BigInt(debtAssetDecimals)
  const expectedCollateralUsdScaled = (planDraft.expectedCollateral * priceColl2) / collScale2
  const expectedDebtPayoutUsdScaled = (planDraft.expectedDebtPayout * priceDebt2) / debtScale2
  const minCollateralForSenderUsdScaled =
    (planDraft.minCollateralForSender * priceColl2) / collScale2

  // Slippage is wrt the coingecko usd prices of the received collateral and debt
  if (minCollateralForSenderUsdScaled > expectedCollateralUsdScaled + expectedDebtPayoutUsdScaled) {
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
  collateralAsset: Address
  debtAsset: Address
  collateralAssetDecimals: number
  debtAssetDecimals: number
  chainId: number
  blockNumber: bigint | undefined
}): Promise<{
  totalCollateralAvailable: bigint
  debtToRepay: bigint
  minCollateralForSender: bigint
  collateralAvailableForSwap: bigint
}> {
  const {
    config,
    token,
    sharesToRedeem,
    slippageBps,
    collateralAsset,
    debtAsset,
    collateralAssetDecimals,
    debtAssetDecimals,
    chainId,
    blockNumber,
  } = args
  const preview = await readLeverageManagerV2PreviewRedeem(config, {
    args: [token, sharesToRedeem],
    chainId: chainId as SupportedChainId,
    blockNumber,
  })

  const totalCollateralAvailable = preview.collateral
  const debtToRepay = preview.debt

  const usdPriceMap = await fetchTokenUsdPrices(chainId, [collateralAsset, debtAsset])
  const priceColl = parseUnits(
    String(usdPriceMap?.[collateralAsset.toLowerCase()] ?? 0),
    USD_DECIMALS,
  )
  const priceDebt = parseUnits(String(usdPriceMap?.[debtAsset.toLowerCase()] ?? 0), USD_DECIMALS)
  const collScale = 10n ** BigInt(collateralAssetDecimals)
  const debtScale = 10n ** BigInt(debtAssetDecimals)

  const totalCollateralUsdScaled = (totalCollateralAvailable * priceColl) / collScale
  const debtToRepayUsdScaled = (debtToRepay * priceDebt) / debtScale
  const zeroSlippageCollateralForSenderUsdScaled =
    totalCollateralUsdScaled > debtToRepayUsdScaled
      ? totalCollateralUsdScaled - debtToRepayUsdScaled
      : 0n

  const zeroSlipCollateralForSenderRaw =
    priceColl > 0n ? (zeroSlippageCollateralForSenderUsdScaled * collScale) / priceColl : 0n
  const minCollateralForSender =
    (zeroSlipCollateralForSenderRaw * (10000n - BigInt(slippageBps))) / 10000n
  const collateralAvailableForSwap = totalCollateralAvailable - minCollateralForSender

  return {
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

  if (requiredDebt <= 0n) return { out: 0n, approvalTarget: zeroAddress, calls: [] }

  // Build type-safe quote request based on intent
  const quote = await quoter(
    intent === 'exactOut'
      ? {
          inToken: inTokenForQuote,
          outToken: debtAsset,
          intent: 'exactOut',
          amountOut: requiredDebt,
          // amountIn is optional for exactOut (used as reference if needed)
        }
      : {
          inToken: inTokenForQuote,
          outToken: debtAsset,
          intent: 'exactIn',
          amountIn: collateralAvailableForSwap,
          amountOut: requiredDebt, // Optional, used for validation below
        },
  )

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
}): Promise<{ calls: Array<Call> }> {
  const { collateralAsset, collateralAmount, useNativeCollateralPath, quote } = args

  if (collateralAmount <= 0n) {
    return { calls: [] }
  }

  const calls: Array<Call> = []

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
    if (quote.calls[0]) {
      calls.push({
        target: quote.calls[0]?.target,
        data: quote.calls[0]?.data,
        value: collateralAmount,
      })
      quote.calls.splice(0, 1)
    }
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

  calls.push(...quote.calls)

  return { calls }
}

/**
 * Validate a redeem plan to ensure it's safe to execute.
 */
export function validateRedeemPlan(plan: RedeemPlan): boolean {
  if (plan.sharesToRedeem <= 0n) return false
  if (plan.expectedCollateral < 0n) return false
  if (plan.minCollateralForSender < 0n) return false
  if (plan.expectedDebtPayout < 0n) return false
  if (plan.payoutAmount < 0n) return false
  if (plan.slippageBps < 0 || plan.slippageBps > 10000) return false
  if (plan.minCollateralForSender > plan.expectedCollateral) return false
  return true
}
