/**
 * Planner for redeem operations.
 *
 * Mirrors the mint planner structure: validate inputs, preview on-chain state,
 * quote the swap required to repay debt, build approval + swap calls, and
 * return preview/min bounds for the UI and executor.
 */
import { type Address, encodeFunctionData, erc20Abi, type PublicClient } from 'viem'
import { applySlippageFloor } from '@/domain/mint/planner/math'
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

  if (collateralAdjustmentBps < 0) {
    throw new Error('Collateral slippage cannot be less than 0')
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

  if (leverageTokenConfig.swaps?.collateralToDebt?.type === 'velora') {
    const collateralToDebtQuote = await quoteCollateralToDebt({
      intent: 'exactOut',
      inToken: collateralAsset,
      outToken: debtAsset,
      amountOut: preview.debt,
      slippageBps: 1, // TODO What should this be set to? Should it be configurable by the user?
    })

    const expectedCollateralForSender = preview.collateral - (collateralToDebtQuote.in ?? 0n)
    const minCollateralForSender = applySlippageFloor(
      expectedCollateralForSender,
      collateralAdjustmentBps,
    )

    if (collateralToDebtQuote.out < preview.debt) {
      captureRedeemPlanError({
        errorString: `Collateral to debt quote output ${collateralToDebtQuote.out} is less than preview debt ${preview.debt}`,
        collateralAdjustmentBps,
        swapSlippageBps,
        previewRedeem: preview,
        previewEquity,
        minCollateralForSender,
        collateralToDebtQuote,
      })
      throw new Error(`Try increasing your collateral adjustment`)
    }

    const previewExcessDebt = collateralToDebtQuote.out - preview.debt

    const calls: Array<Call> = []
    calls.push(...collateralToDebtQuote.calls)

    return {
      collateralToSwap: collateralToDebtQuote.in ?? 0n,
      collateralToDebtQuoteAmount: collateralToDebtQuote.out,
      minCollateralForSender,
      minExcessDebt: previewExcessDebt,
      previewCollateralForSender: expectedCollateralForSender,
      previewExcessDebt,
      sharesToRedeem,
      calls,
      quoteSourceName: collateralToDebtQuote.quoteSourceName,
      quoteSourceId: collateralToDebtQuote.quoteSourceId,
    }
  } else {
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
      captureRedeemPlanError({
        errorString: `Collateral to debt quote output ${collateralToDebtQuote.out} is less than preview debt ${preview.debt}`,
        collateralAdjustmentBps,
        swapSlippageBps,
        previewRedeem: preview,
        previewEquity,
        minCollateralForSender,
        collateralToSpend,
        collateralToDebtQuote,
      })
      throw new Error(`Try increasing your collateral adjustment`)
    }

    if (collateralToDebtQuote.minOut < preview.debt) {
      captureRedeemPlanError({
        errorString: `Collateral to debt quote minimum output ${collateralToDebtQuote.minOut} is less than preview debt ${preview.debt}`,
        collateralAdjustmentBps,
        swapSlippageBps,
        previewRedeem: preview,
        previewEquity,
        minCollateralForSender,
        collateralToSpend,
        collateralToDebtQuote,
      })
      throw new Error(
        `Try decreasing your swap slippage tolerance. If you cannot further decrease it, try increasing your collateral adjustment`,
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
}
