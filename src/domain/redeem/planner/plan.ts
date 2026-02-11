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

  if (isRedeemWithVeloraExactOut(leverageTokenConfig?.swaps?.collateralToDebt)) {
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
      routerMethod: 'redeemWithVelora',
      calls,
      quoteSourceName: collateralToDebtQuote.quoteSourceName,
      quoteSourceId: collateralToDebtQuote.quoteSourceId,
    }
  } else {
    // First quote to get the expected exchange rate
    const collateralToSpendInitial = preview.collateral - previewEquity
    const collateralToDebtQuoteInitial = await quoteCollateralToDebt({
      intent: 'exactIn',
      inToken: collateralAsset,
      outToken: debtAsset,
      amountIn: collateralToSpendInitial,
      slippageBps: swapSlippageBps,
    })

    const exchangeRateScale = 10n ** 18n
    const exchangeRate =
      (collateralToDebtQuoteInitial.out * exchangeRateScale) / collateralToSpendInitial

    // Calculate the minimum collateral to spend based on the expected exchange rate
    const minCollateralToSpend = (preview.debt * exchangeRateScale) / exchangeRate

    // Check if the preview collateral minus the minimum collateral to spend is less than 0. If it is, there is insufficient DEX liquidity to redeem the shares
    if (preview.collateral - minCollateralToSpend <= 0) {
      captureRedeemPlanError({
        errorString: `Insufficient DEX liquidity to redeem ${sharesToRedeem} shares`,
        collateralSlippageBps,
        swapSlippageBps,
        collateralSwapAdjustmentBps,
        previewRedeem: preview,
        previewEquity,
      })
      throw new Error(`Insufficient DEX liquidity to redeem ${sharesToRedeem} shares`)
    }

    // Apply the collateral swap adjustment to the minimum collateral to spend. This adjustment is necessary to account for debt accrual between off-chain preview and on-chain redemption
    // It also helps account for slight variance in the exchange rate for the actual amount to swap
    const collateralToSpend = applySlippageFloor(minCollateralToSpend, -collateralSwapAdjustmentBps)

    const collateralToDebtQuote = await quoteCollateralToDebt({
      intent: 'exactIn',
      inToken: collateralAsset,
      outToken: debtAsset,
      amountIn: collateralToSpend,
      slippageBps: swapSlippageBps,
    })

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
        collateralToDebtQuote,
      })
      throw new Error(`Try decreasing your collateral swap adjustment`)
    }

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
      throw new Error(`Try increasing your collateral swap adjustment`)
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
        `Try decreasing your swap slippage tolerance. If you cannot further decrease it, try increasing your collateral swap adjustment`,
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
