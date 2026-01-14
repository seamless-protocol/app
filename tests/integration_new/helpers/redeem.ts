import { renderHook, waitFor } from '@morpho-org/test-wagmi'
import { expect } from 'vitest'
import type { Config } from 'wagmi'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { useRedeemPlanPreview } from '@/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'

export async function useRedeemPlanPreviewWithSlippageRetries({
  wagmiConfig,
  leverageTokenConfig,
  sharesToRedeem,
  quoteFn,
  slippageBps,
  retries,
  slippageIncrementBps,
}: {
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  sharesToRedeem: bigint
  quoteFn: QuoteFn
  slippageBps: number
  retries: number
  slippageIncrementBps: number
}) {
  const totalAttempts = 1 + retries
  let currentSlippageBps = slippageBps

  for (let i = 0; i < totalAttempts; i++) {
    const { result: redeemPlanPreviewResult } = renderHook(wagmiConfig, () =>
      // biome-ignore lint/correctness/useHookAtTopLevel: renderHook usage inside retry loop is intentional
      useRedeemPlanPreview({
        config: wagmiConfig,
        token: leverageTokenConfig.address,
        sharesToRedeem,
        slippageBps: currentSlippageBps,
        chainId: leverageTokenConfig.chainId,
        enabled: true,
        quote: quoteFn,
      }),
    )

    await waitFor(() => expect(redeemPlanPreviewResult.current.isLoading).toBe(false))

    if (redeemPlanPreviewResult.current.plan) {
      return redeemPlanPreviewResult
    }

    const error = redeemPlanPreviewResult.current.error
    if (error && !error.message.includes('Try increasing your slippage tolerance')) {
      return redeemPlanPreviewResult
    }

    currentSlippageBps += slippageIncrementBps
  }

  throw new Error(`Failed to create redeem plan with retry helper after ${1 + retries} attempts`)
}
