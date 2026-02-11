/**
 * Planner for redeem operations.
 *
 * Mirrors the mint planner structure: validate inputs, preview on-chain state,
 * quote the swap required to repay debt, build approval + swap calls, and
 * return preview/min bounds for the UI and executor.
 */
import { type Address, encodeFunctionData, erc20Abi, type PublicClient } from 'viem'
import { applySlippageFloor } from '@/domain/mint/planner/math'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Call } from '@/domain/shared/types'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import { leverageManagerV2Abi } from '@/lib/contracts/generated'
import { captureRedeemPlanError } from '@/lib/observability/sentry'

export interface RedeemPlan {
  collateralToSwap: bigint
  collateralToDebtQuoteAmount: bigint
  minCollateralForSender: bigint
  minExcessDebt: bigint
  previewCollateralForSender: bigint
  previewExcessDebt: bigint
  sharesToRedeem: bigint
  routerMethod: 'redeem' | 'redeemWithVelora'
  calls: Array<Call>
  quoteSourceName: string | undefined
  quoteSourceId: string | undefined
}

export interface PlanRedeemParams {
  publicClient: PublicClient
  leverageTokenConfig: LeverageTokenConfig
  sharesToRedeem: bigint
  collateralSlippageBps: number
  swapSlippageBps: number
  collateralSwapAdjustmentBps: number
  quoteCollateralToDebt: QuoteFn
}

export async function planRedeem({
  publicClient,
  leverageTokenConfig,
  sharesToRedeem,
  collateralSlippageBps,
  swapSlippageBps,
  collateralSwapAdjustmentBps,
  quoteCollateralToDebt,
}: PlanRedeemParams): Promise<RedeemPlan> {
  if (sharesToRedeem <= 0n) {
    throw new Error('sharesToRedeem must be positive')
  }

  if (collateralSlippageBps < 0) {
    throw new Error('Collateral slippage cannot be less than 0')
  }

  if (swapSlippageBps < 1) {
    throw new Error('Swap slippage cannot be less than 0.01%')
  }

  console.debug(`planRedeem collateralSlippageBps: ${collateralSlippageBps}`)
  console.debug(`planRedeem swapSlippageBps: ${swapSlippageBps}`)
  console.debug(`planRedeem collateralSwapAdjustmentBps: ${collateralSwapAdjustmentBps}`)

  const chainId = leverageTokenConfig.chainId as SupportedChainId
  const token = leverageTokenConfig.address as Address
  const collateralAsset = leverageTokenConfig.collateralAsset.address as Address
  const debtAsset = leverageTokenConfig.debtAsset.address as Address

  const preview = await publicClient.readContract({
    address: getContractAddresses(chainId).leverageManagerV2 as Address,
    abi: leverageManagerV2Abi,
    functionName: 'previewRedeem',
    args: [token, sharesToRedeem],
  })

  const netShares = preview.shares - preview.treasuryFee - preview.tokenFee

  const previewEquity = await publicClient.readContract({
    address: getContractAddresses(chainId).leverageManagerV2 as Address,
    abi: leverageManagerV2Abi,
    functionName: 'convertToAssets',
    args: [token, netShares],
  })

  const ctx: RedeemPlanContext = {
    preview,
    previewEquity,
    collateralAsset,
    debtAsset,
    collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
    debtDecimals: leverageTokenConfig.debtAsset.decimals,
    sharesToRedeem,
    collateralSlippageBps,
    swapSlippageBps,
    collateralSwapAdjustmentBps,
    quoteCollateralToDebt,
  }

  if (isRedeemWithVeloraExactOut(leverageTokenConfig?.swaps?.collateralToDebt)) {
    return planRedeemVeloraExactOut(ctx)
  }
  return planRedeemExactIn(ctx)
}

interface RedeemPlanContext {
  preview: Awaited<ReturnType<PublicClient['readContract']>> & {
    collateral: bigint
    debt: bigint
    shares: bigint
    tokenFee: bigint
    treasuryFee: bigint
  }
  previewEquity: bigint
  collateralAsset: Address
  debtAsset: Address
  collateralDecimals: number
  debtDecimals: number
  sharesToRedeem: bigint
  collateralSlippageBps: number
  swapSlippageBps: number
  collateralSwapAdjustmentBps: number
  quoteCollateralToDebt: QuoteFn
}

async function planRedeemVeloraExactOut(ctx: RedeemPlanContext): Promise<RedeemPlan> {
  const {
    preview,
    previewEquity,
    collateralAsset,
    debtAsset,
    sharesToRedeem,
    collateralSlippageBps,
    swapSlippageBps,
    collateralSwapAdjustmentBps,
    quoteCollateralToDebt,
  } = ctx

  const collateralToDebtQuote = await quoteCollateralToDebt({
    intent: 'exactOut',
    inToken: collateralAsset,
    outToken: debtAsset,
    amountOut: preview.debt,
    slippageBps: swapSlippageBps,
  })

  const expectedCollateralForSender = preview.collateral - collateralToDebtQuote.in
  const minCollateralForSender = applySlippageFloor(
    expectedCollateralForSender,
    collateralSlippageBps,
  )

  if (preview.collateral - collateralToDebtQuote.maxIn < minCollateralForSender) {
    captureRedeemPlanError({
      errorString: `Preview collateral ${preview.collateral} minus max input ${collateralToDebtQuote.maxIn} is less than min collateral for sender ${minCollateralForSender}`,
      collateralSlippageBps,
      swapSlippageBps,
      collateralSwapAdjustmentBps,
      previewRedeem: preview,
      previewEquity,
      minCollateralForSender,
      collateralToDebtQuote,
    })
    throw new Error(
      `Redeem preview resulted in less collateral than the allowed slippage tolerance. Try decreasing the swap slippage tolerance, or increasing the collateral slippage tolerance.`,
    )
  }

  const calls: Array<Call> = []
  calls.push(...collateralToDebtQuote.calls)

  return {
    collateralToSwap: collateralToDebtQuote.in,
    collateralToDebtQuoteAmount: collateralToDebtQuote.out,
    minCollateralForSender,
    minExcessDebt: 0n,
    previewCollateralForSender: expectedCollateralForSender,
    previewExcessDebt: 0n,
    sharesToRedeem,
    routerMethod: 'redeemWithVelora',
    calls,
    quoteSourceName: collateralToDebtQuote.quoteSourceName,
    quoteSourceId: collateralToDebtQuote.quoteSourceId,
  }
}

async function planRedeemExactIn(ctx: RedeemPlanContext): Promise<RedeemPlan> {
  const {
    preview,
    previewEquity,
    collateralAsset,
    debtAsset,
    collateralDecimals,
    debtDecimals,
    sharesToRedeem,
    collateralSlippageBps,
    swapSlippageBps,
    collateralSwapAdjustmentBps,
    quoteCollateralToDebt,
  } = ctx

  const collateralToSpendInitial = preview.collateral - previewEquity
  const collateralToDebtQuoteInitial = await quoteCollateralToDebt({
    intent: 'exactIn',
    inToken: collateralAsset,
    outToken: debtAsset,
    amountIn: collateralToSpendInitial,
    slippageBps: swapSlippageBps,
  })

  const exchangeRateScale = 10n ** BigInt(Math.max(collateralDecimals, debtDecimals))
  const exchangeRate =
    (collateralToDebtQuoteInitial.out * exchangeRateScale) / collateralToSpendInitial

  const minCollateralToSpend = (preview.debt * exchangeRateScale) / exchangeRate

  if (preview.collateral - minCollateralToSpend <= 0) {
    captureRedeemPlanError({
      errorString: `Insufficient DEX liquidity to redeem ${sharesToRedeem} shares`,
      collateralSlippageBps,
      swapSlippageBps,
      collateralSwapAdjustmentBps,
      previewRedeem: preview,
      previewEquity,
    })
    throw new Error(
      `Insufficient DEX liquidity to redeem ${sharesToRedeem} Leverage Tokens. Try redeeming a smaller amount of Leverage Tokens.`,
    )
  }

  const collateralToSpend = applySlippageFloor(minCollateralToSpend, -collateralSwapAdjustmentBps)

  const minCollateralForSender = applySlippageFloor(
    preview.collateral - collateralToSpend,
    collateralSlippageBps,
  )

  if (minCollateralForSender < 0) {
    captureRedeemPlanError({
      errorString: `Min collateral for sender ${minCollateralForSender} is less than 0`,
      collateralSlippageBps,
      swapSlippageBps,
      collateralSwapAdjustmentBps,
      previewRedeem: preview,
      previewEquity,
      minCollateralForSender,
      collateralToSpend,
    })
    throw new Error(
      'Insufficient collateral returned from preview. Try decreasing the collateral swap adjustment parameter.',
    )
  }

  const collateralToDebtQuote = await quoteCollateralToDebt({
    intent: 'exactIn',
    inToken: collateralAsset,
    outToken: debtAsset,
    amountIn: collateralToSpend,
    slippageBps: swapSlippageBps,
  })

  if (collateralToDebtQuote.out < preview.debt) {
    captureRedeemPlanError({
      errorString: `Collateral to debt quote output ${collateralToDebtQuote.out} is less than preview debt ${preview.debt}`,
      collateralSlippageBps,
      swapSlippageBps,
      collateralSwapAdjustmentBps,
      previewRedeem: preview,
      previewEquity,
      minCollateralForSender,
      collateralToSpend,
      collateralToDebtQuote,
    })
    throw new Error(
      'Collateral swapped to debt to repay flash loan is too low. Try increasing the collateral swap adjustment parameter.',
    )
  }

  if (collateralToDebtQuote.minOut < preview.debt) {
    captureRedeemPlanError({
      errorString: `Collateral to debt quote minimum output ${collateralToDebtQuote.minOut} is less than preview debt ${preview.debt}`,
      collateralSlippageBps,
      swapSlippageBps,
      collateralSwapAdjustmentBps,
      previewRedeem: preview,
      previewEquity,
      minCollateralForSender,
      collateralToSpend,
      collateralToDebtQuote,
    })
    throw new Error(
      `Debt received from the swap of collateral to debt is too low. Try decreasing the swap slippage tolerance. If you cannot further decrease it, try increasing the collateral swap adjustment parameter.`,
    )
  }

  const previewExcessDebt = collateralToDebtQuote.out - preview.debt
  const minExcessDebt = collateralToDebtQuote.minOut - preview.debt

  const approvalCall: Call | undefined =
    collateralToDebtQuote.out > 0n
      ? {
          target: collateralAsset,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [collateralToDebtQuote.approvalTarget, collateralToSpend],
          }),
          value: 0n,
        }
      : undefined

  const calls: Array<Call> = []
  if (approvalCall) calls.push(approvalCall)
  calls.push(...collateralToDebtQuote.calls)

  return {
    collateralToSwap: collateralToSpend,
    collateralToDebtQuoteAmount: collateralToDebtQuote.out,
    minCollateralForSender,
    minExcessDebt,
    previewCollateralForSender: preview.collateral - collateralToSpend,
    previewExcessDebt,
    sharesToRedeem,
    routerMethod: 'redeem',
    calls,
    quoteSourceName: collateralToDebtQuote.quoteSourceName,
    quoteSourceId: collateralToDebtQuote.quoteSourceId,
  }
}

function isRedeemWithVeloraExactOut(swap?: CollateralToDebtSwapConfig): boolean {
  return (
    (swap?.type === 'balmy' &&
      Array.isArray(swap.sourceWhitelist) &&
      swap.sourceWhitelist.length === 1 &&
      swap.sourceWhitelist[0] === 'paraswap' &&
      swap.sourceConfig?.custom?.paraswap?.includeContractMethods?.includes(
        'swapExactAmountOut',
      )) ||
    false
  )
}
