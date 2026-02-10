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
  quoteCollateralToDebt: QuoteFn
}

export async function planRedeem({
  publicClient,
  leverageTokenConfig,
  sharesToRedeem,
  collateralSlippageBps,
  swapSlippageBps,
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

  if (isRedeemWithVelora(leverageTokenConfig?.swaps?.collateralToDebt)) {
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
        previewRedeem: preview,
        previewEquity,
        minCollateralForSender,
        collateralToDebtQuote,
      })
      throw new Error(
        `Collateral slippage tolerance is too low. Try increasing your collateral slippage tolerance`,
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
      calls,
      quoteSourceName: collateralToDebtQuote.quoteSourceName,
      quoteSourceId: collateralToDebtQuote.quoteSourceId,
    }
  } else {
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
        previewRedeem: preview,
        previewEquity,
        minCollateralForSender,
        collateralToDebtQuote,
      })
      throw new Error(
        `Collateral slippage tolerance is too low. Try increasing your collateral slippage tolerance`,
      )
    }

    const approvalCall: Call | undefined =
      collateralToDebtQuote.out > 0n
        ? {
            target: collateralAsset,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [collateralToDebtQuote.approvalTarget, collateralToDebtQuote.maxIn],
            }),
            value: 0n,
          }
        : undefined

    const calls: Array<Call> = []
    if (approvalCall) calls.push(approvalCall)
    calls.push(...collateralToDebtQuote.calls)

    const previewExcessDebt = collateralToDebtQuote.out - preview.debt

    return {
      collateralToSwap: collateralToDebtQuote.maxIn,
      collateralToDebtQuoteAmount: collateralToDebtQuote.out,
      minCollateralForSender,
      minExcessDebt: 0n,
      previewCollateralForSender: expectedCollateralForSender,
      previewExcessDebt,
      sharesToRedeem,
      calls,
      quoteSourceName: collateralToDebtQuote.quoteSourceName,
      quoteSourceId: collateralToDebtQuote.quoteSourceId,
    }
  }
}

function isRedeemWithVelora(swap?: CollateralToDebtSwapConfig): boolean {
  return (
    swap?.type === 'velora' ||
    (swap?.type === 'balmy' &&
      Array.isArray(swap.sourceWhitelist) &&
      swap.sourceWhitelist.length === 1 &&
      swap.sourceWhitelist[0] === 'paraswap')
  )
}
