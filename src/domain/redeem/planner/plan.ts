/**
 * Planner for redeem operations.
 *
 * Mirrors the mint planner structure: validate inputs, preview on-chain state,
 * quote the swap required to repay debt, build approval + swap calls, and
 * return preview/min bounds for the UI and executor.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, formatUnits } from 'viem'
import type { Config } from 'wagmi'
import { applySlippageFloor } from '@/domain/mint/planner/math'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Call } from '@/domain/shared/types'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { collateralRatioToLeverage } from '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2ConvertToAssets,
  readLeverageManagerV2GetLeverageTokenState,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'

export interface RedeemPlan {
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
  wagmiConfig: Config
  blockNumber: bigint
  leverageTokenConfig: LeverageTokenConfig
  sharesToRedeem: bigint
  slippageBps: number
  quoteCollateralToDebt: QuoteFn
}

export async function planRedeem({
  wagmiConfig,
  blockNumber,
  leverageTokenConfig,
  sharesToRedeem,
  slippageBps,
  quoteCollateralToDebt,
}: PlanRedeemParams): Promise<RedeemPlan> {
  if (sharesToRedeem <= 0n) {
    throw new Error('sharesToRedeem must be positive')
  }

  if (slippageBps < 0) {
    throw new Error('slippageBps cannot be negative')
  }

  const chainId = leverageTokenConfig.chainId as SupportedChainId
  const token = leverageTokenConfig.address as Address
  const collateralAsset = leverageTokenConfig.collateralAsset.address as Address
  const debtAsset = leverageTokenConfig.debtAsset.address as Address

  const { collateralRatio } = await readLeverageManagerV2GetLeverageTokenState(wagmiConfig, {
    args: [token],
    chainId,
    blockNumber,
  })

  const preview = await readLeverageManagerV2PreviewRedeem(wagmiConfig, {
    args: [token, sharesToRedeem],
    chainId,
    blockNumber,
  })

  const netShares = preview.shares - preview.treasuryFee - preview.tokenFee

  const previewEquity = await readLeverageManagerV2ConvertToAssets(wagmiConfig, {
    args: [token, netShares],
    chainId,
    blockNumber,
  })

  const minCollateralForSender = applySlippageFloor(previewEquity, slippageBps)

  const currentLeverage = collateralRatioToLeverage(collateralRatio)

  // Leverage-adjusted slippage for the swap: scale by previewed leverage.
  const quoteSlippageBps = Math.max(
    1,
    Math.floor((slippageBps * 0.5) / (Number(formatUnits(currentLeverage, 18)) - 1)),
  )

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
      `Collateral to debt quote output ${collateralToDebtQuote.out} is less than preview debt ${preview.debt}. Try increasing your slippage tolerance`,
    )
  }

  if (collateralToDebtQuote.minOut < preview.debt) {
    throw new Error(
      `Collateral to debt quote minimum output ${collateralToDebtQuote.minOut} is less than preview debt ${preview.debt}. Try increasing your slippage tolerance`,
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
    minCollateralForSender,
    minExcessDebt,
    previewCollateralForSender: preview.collateral - collateralToSpend,
    previewExcessDebt,
    sharesToRedeem,
    calls,
    quoteSourceName: collateralToDebtQuote.sourceName,
    quoteSourceId: collateralToDebtQuote.sourceId,
  }
}
