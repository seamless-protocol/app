import type { AnvilTestClient } from '@morpho-org/test'
import { waitFor } from '@morpho-org/test-wagmi'
import { act } from '@testing-library/react'
import type { Address } from 'viem'
import { expect } from 'vitest'
import type { Config } from 'wagmi'
import type { MintPlan } from '@/domain/mint'
import type { DebtToCollateralSwapConfig } from '@/domain/mint/utils/createDebtToCollateralQuote'
import type { BalmyAdapterOverrideOptions } from '@/domain/shared/adapters/balmy'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { useApprovalFlow } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts'
import { renderHook } from './wagmi'

export type MintExecutionResult = {
  plan: MintPlan
}

export class MintExecutionSimulationError extends Error {
  slippageUsedBps: number

  constructor(slippageUsedBps: number, cause?: unknown) {
    super(`Failed to create mint plan with slippage ${slippageUsedBps}`)
    this.name = 'MintExecutionSimulationError'
    this.slippageUsedBps = slippageUsedBps
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export type MintExecutionError = MintExecutionSimulationError

export async function executeMintFlow({
  client,
  wagmiConfig,
  leverageTokenConfig,
  equityInCollateralAsset,
  balmyOverrideOptions,
  startSlippageBps = 100,
  retries = 5,
  slippageIncrementBps = 100,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
  balmyOverrideOptions?: BalmyAdapterOverrideOptions
  startSlippageBps?: number
  retries?: number
  slippageIncrementBps?: number
}): Promise<MintExecutionResult> {
  const addresses = getContractAddresses(leverageTokenConfig.chainId)

  // Get the function to quote the debt to collateral swap for the mint
  const { result: useDebtToCollateralQuoteResult } = renderHook(wagmiConfig, () =>
    useDebtToCollateralQuote({
      chainId: leverageTokenConfig.chainId,
      routerAddress: addresses.leverageRouterV2 as Address,
      swap: leverageTokenConfig.swaps?.debtToCollateral as DebtToCollateralSwapConfig,
      requiresQuote: true,
      fromAddress: addresses.multicallExecutor as Address,
      ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
    }),
  )
  await waitFor(() =>
    expect(
      useDebtToCollateralQuoteResult.current.quote,
      'Quote function for debt to collateral not found',
    ).toBeDefined(),
  )
  const quoteFn = useDebtToCollateralQuoteResult.current.quote as QuoteFn

  // Preview the mint plan with slippage retries using the quote function
  const mintPlanPreviewResult = await useMintPlanPreviewWithSlippageRetries({
    wagmiConfig,
    leverageTokenConfig,
    equityInCollateralAsset,
    quoteFn,
    slippageBps: startSlippageBps,
    retries,
    slippageIncrementBps,
  })

  const plan = mintPlanPreviewResult.current.plan
  if (!plan) {
    throw new Error('Mint plan not found')
  }

  // Approve the collateral asset from the user to be spent by the leverage router
  const { result: approvalFlow } = renderHook(wagmiConfig, () =>
    useApprovalFlow({
      tokenAddress: leverageTokenConfig.collateralAsset.address,
      owner: client.account.address,
      spender: addresses.leverageRouterV2 as Address,
      amountRaw: plan.equityInCollateralAsset,
      decimals: leverageTokenConfig.collateralAsset.decimals,
      chainId: leverageTokenConfig.chainId,
      enabled: true,
    }),
  )
  expect(approvalFlow.current.isApproved).toBe(false)
  approvalFlow.current.approve()
  await waitFor(() =>
    expect(
      approvalFlow.current.isApproved,
      'isApproved not set to true on mint approval flow',
    ).toBe(true),
  )

  // Execute the mint using the plan
  try {
    const { result: mintWriteResult } = renderHook(wagmiConfig, () => useMintWrite())
    await waitFor(() =>
      expect(mintWriteResult.current.mutateAsync, 'Mint write function not defined').toBeDefined(),
    )
    await act(async () => {
      await mintWriteResult.current.mutateAsync({
        config: wagmiConfig,
        chainId: leverageTokenConfig.chainId,
        account: client.account,
        token: leverageTokenConfig.address,
        plan: plan,
      })
    })

    return { plan }
  } catch (error) {
    throw new MintExecutionSimulationError(mintPlanPreviewResult.slippageUsedBps, error)
  }
}

async function useMintPlanPreviewWithSlippageRetries({
  wagmiConfig,
  leverageTokenConfig,
  equityInCollateralAsset,
  quoteFn,
  slippageBps,
  retries,
  slippageIncrementBps,
}: {
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
  quoteFn: QuoteFn
  slippageBps: number
  retries: number
  slippageIncrementBps: number
}) {
  let currentSlippageBps = slippageBps

  const { result: mintPlanPreviewResult, rerender } = renderHook(
    wagmiConfig,
    (props: { slippageBps: number }) =>
      // biome-ignore lint/correctness/useHookAtTopLevel: renderHook usage inside retry loop is intentional
      useMintPlanPreview({
        config: wagmiConfig,
        token: leverageTokenConfig.address,
        equityInCollateralAsset,
        chainId: leverageTokenConfig.chainId,
        enabled: true,
        quote: quoteFn,
        debounceMs: 0,
        ...props,
      }),
    {
      initialProps: { slippageBps: currentSlippageBps },
    },
  )
  await waitFor(
    () =>
      expect(
        mintPlanPreviewResult.current.isLoading,
        'Initial render of mint plan preview failed',
      ).toBe(false),
    { timeout: 30000 },
  )

  const error = mintPlanPreviewResult.current.error
  if (error && !error.message.includes('Try increasing your slippage tolerance')) {
    throw error
  }

  if (!error) {
    return { ...mintPlanPreviewResult, slippageUsedBps: currentSlippageBps }
  }

  for (let i = 0; i < retries; i++) {
    // avoid rate limiting by waiting 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000))

    currentSlippageBps += slippageIncrementBps

    rerender({ slippageBps: currentSlippageBps })
    await waitFor(
      () =>
        expect(
          mintPlanPreviewResult.current.isLoading,
          'Rerender of mint plan preview failed',
        ).toBe(false),
      { timeout: 30000 },
    )

    const error = mintPlanPreviewResult.current.error
    if (error && !error.message.includes('Try increasing your slippage tolerance')) {
      return { ...mintPlanPreviewResult, slippageUsedBps: currentSlippageBps }
    }

    if (!error) {
      return { ...mintPlanPreviewResult, slippageUsedBps: currentSlippageBps }
    }
  }

  throw new Error(`Failed to create mint plan with retry helper after ${1 + retries} attempts`)
}
