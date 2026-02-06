/**
 * Planner for redeem operations.
 *
 * Mirrors the mint planner structure: validate inputs, preview on-chain state,
 * quote the swap required to repay debt, build approval + swap calls, and
 * return preview/min bounds for the UI and executor.
 */
import type { Address, PublicClient } from 'viem'
import { encodeFunctionData, erc20Abi } from 'viem'
import { applySlippageFloor } from '@/domain/mint/planner/math'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Call } from '@/domain/shared/types'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import { leverageManagerV2Abi } from '@/lib/contracts/generated'

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
  collateralAdjustmentBps: number
  swapSlippageBps: number
  quoteCollateralToDebt: QuoteFn
}

export async function planRedeem({
  publicClient,
  leverageTokenConfig,
  sharesToRedeem,
  collateralAdjustmentBps,
  swapSlippageBps,
  quoteCollateralToDebt,
}: PlanRedeemParams): Promise<RedeemPlan> {
  if (sharesToRedeem <= 0n) {
    throw new Error('sharesToRedeem must be positive')
  }

  if (collateralAdjustmentBps < 1) {
    throw new Error('Collateral adjustment cannot be less than 0.01%')
  }

  if (swapSlippageBps < 1) {
    throw new Error('Swap slippage cannot be less than 0.01%')
  }

  console.debug(`planRedeem collateralAdjustmentBps: ${collateralAdjustmentBps}`)
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

  const minCollateralForSender = applySlippageFloor(previewEquity, collateralAdjustmentBps)

  // Leverage-adjusted slippage for the swap: scale by previewed leverage.
  const quoteSlippageBps = swapSlippageBps

  const collateralToSpend = preview.collateral - minCollateralForSender
  const collateralToDebtQuote = await quoteCollateralToDebt({
    intent: 'exactIn',
    inToken: collateralAsset,
    outToken: debtAsset,
    amountIn: collateralToSpend,
    slippageBps: quoteSlippageBps,
  })

  if (collateralToDebtQuote.out < preview.debt) {
    throw new Error(
      `Collateral to debt quote output ${collateralToDebtQuote.out} is less than preview debt ${preview.debt}. Try increasing your collateral adjustment`,
    )
  }

  if (collateralToDebtQuote.minOut < preview.debt) {
    throw new Error(
      `Collateral to debt quote minimum output ${collateralToDebtQuote.minOut} is less than preview debt ${preview.debt}. Try decreasing your swap slippage tolerance. If you cannot further decrease it, try increasing your collateral adjustment`,
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
    calls,
    quoteSourceName: collateralToDebtQuote.quoteSourceName,
    quoteSourceId: collateralToDebtQuote.quoteSourceId,
  }
}
