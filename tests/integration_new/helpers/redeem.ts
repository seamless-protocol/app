import { waitFor } from '@morpho-org/test-wagmi'
import { expect } from 'vitest'
import type { Config } from 'wagmi'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { useRedeemPlanPreview } from '@/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { renderHook } from './wagmi'

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
  let currentSlippageBps = slippageBps

  const { result: redeemPlanPreviewResult, rerender } = renderHook(
    wagmiConfig,
    (props: { slippageBps: number }) =>
      // biome-ignore lint/correctness/useHookAtTopLevel: renderHook usage inside retry loop is intentional
      useRedeemPlanPreview({
        config: wagmiConfig,
        token: leverageTokenConfig.address,
        sharesToRedeem,
        chainId: leverageTokenConfig.chainId,
        enabled: true,
        quote: quoteFn,
        ...props,
      }),
    {
      initialProps: { slippageBps: currentSlippageBps },
    },
  )
  await waitFor(() => expect(redeemPlanPreviewResult.current.isLoading).toBe(false), {
    timeout: 15000,
  })

  const error = redeemPlanPreviewResult.current.error
  if (error && !error.message.includes('Try increasing your slippage tolerance')) {
    throw error
  }

  if (!error) {
    return redeemPlanPreviewResult
  }

  for (let i = 0; i < retries; i++) {
    // avoid rate limiting by waiting 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000))

    currentSlippageBps += slippageIncrementBps

    rerender({ slippageBps: currentSlippageBps })

    await waitFor(() => expect(redeemPlanPreviewResult.current.isLoading).toBe(false), {
      timeout: 15000,
    })

    const error = redeemPlanPreviewResult.current.error
    if (error && !error.message.includes('Try increasing your slippage tolerance')) {
      throw error
    }

    if (!error) {
      return redeemPlanPreviewResult
    }
  }

  throw new Error(`Failed to create redeem plan with retry helper after ${1 + retries} attempts`)
}
