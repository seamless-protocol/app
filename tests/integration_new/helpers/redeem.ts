import type { AnvilTestClient } from '@morpho-org/test'
import { waitFor } from '@morpho-org/test-wagmi'
import { act } from '@testing-library/react'
import type { Address } from 'viem'
import { expect } from 'vitest'
import type { Config } from 'wagmi'
import type { CollateralToDebtSwapConfig, RedeemPlan } from '@/domain/redeem'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { useApprovalFlow } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { useCollateralToDebtQuote } from '@/features/leverage-tokens/hooks/redeem/useCollateralToDebtQuote'
import { useRedeemExecution } from '@/features/leverage-tokens/hooks/redeem/useRedeemExecution'
import { useRedeemPlanPreview } from '@/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { testMint } from './mint'
import { renderHook } from './wagmi'

export type RedeemExecutionResult = {
  plan: RedeemPlan
}

export class RedeemExecutionSimulationError extends Error {
  slippageUsedBps: number

  constructor(slippageUsedBps: number, cause?: unknown) {
    super(`Failed to create redeem plan with slippage ${slippageUsedBps}`)
    this.name = 'RedeemExecutionSimulationError'
    this.slippageUsedBps = slippageUsedBps
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

const MAX_RETRY_STARTING_SLIPPAGE_BPS = 600 // 6%
const MAX_START_SLIPPAGE_RETRY_ATTEMPTS = 5

export async function testRedeem({
  client,
  wagmiConfig,
  leverageTokenConfig,
  startSlippageBps = 100,
  retries = 5,
  slippageIncrementBps = 100,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  startSlippageBps?: number
  retries?: number
  slippageIncrementBps?: number
}) {
  await testMint({
    client,
    wagmiConfig,
    leverageTokenConfig,
  })

  const leverageTokenBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.address,
    args: [client.account.address],
  })
  const collateralBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.collateralAsset.address,
    args: [client.account.address],
  })
  const debtBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.debtAsset.address,
    args: [client.account.address],
  })

  const plan = await redeemWithRetries({
    client,
    wagmiConfig,
    leverageTokenConfig,
    leverageTokenBalanceBefore,
    startSlippageBps,
    retries,
    slippageIncrementBps,
  })

  if (!plan) {
    return
  }

  // Check the shares redeemed by the user
  const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.address,
    args: [client.account.address],
  })
  const sharesDelta = leverageTokenBalanceBefore - sharesAfter
  expect(sharesDelta).toBe(plan.sharesToRedeem)

  // Check the collateral balance of the user
  const collateralBalanceAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.collateralAsset.address,
    args: [client.account.address],
  })
  const collateralDelta = collateralBalanceAfter - collateralBalanceBefore
  expect(collateralDelta).toBeGreaterThanOrEqual(plan.minCollateralForSender)

  // Check the debt balance of the user
  const debtBalanceAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.debtAsset.address,
    args: [client.account.address],
  })
  const debtDelta = debtBalanceAfter - debtBalanceBefore
  expect(debtDelta).toBeGreaterThanOrEqual(plan.minExcessDebt)
}

async function redeemWithRetries({
  client,
  wagmiConfig,
  leverageTokenConfig,
  leverageTokenBalanceBefore,
  startSlippageBps,
  retries,
  slippageIncrementBps,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  leverageTokenBalanceBefore: bigint
  startSlippageBps: number
  retries: number
  slippageIncrementBps: number
}): Promise<RedeemPlan | undefined> {
  let nextStartSlippageBps = startSlippageBps
  let remainingStartBumps = MAX_START_SLIPPAGE_RETRY_ATTEMPTS
  let lastError: unknown

  while (nextStartSlippageBps <= MAX_RETRY_STARTING_SLIPPAGE_BPS) {
    const allowedPreviewRetries = Math.min(
      retries,
      Math.floor((MAX_RETRY_STARTING_SLIPPAGE_BPS - nextStartSlippageBps) / slippageIncrementBps),
    )

    try {
      const { plan } = await executeRedeemFlow({
        client,
        wagmiConfig,
        leverageTokenConfig,
        sharesToRedeem: leverageTokenBalanceBefore,
        startSlippageBps: nextStartSlippageBps,
        retries: allowedPreviewRetries,
        slippageIncrementBps,
      })

      return plan
    } catch (error) {
      if (isRateLimitError(error)) {
        return undefined
      }

      const canBumpStartingSlippage =
        error instanceof RedeemExecutionSimulationError &&
        remainingStartBumps > 0 &&
        nextStartSlippageBps < MAX_RETRY_STARTING_SLIPPAGE_BPS

      if (canBumpStartingSlippage) {
        lastError = error
        remainingStartBumps -= 1
        nextStartSlippageBps = error.slippageUsedBps + slippageIncrementBps
        console.log(
          `Retrying redeem for ${leverageTokenConfig.symbol} with starting slippage bps: ${nextStartSlippageBps}`,
        )
        continue
      }

      throw error
    }
  }

  throw lastError ?? new Error('Redeem plan not generated after retries')
}

async function executeRedeemFlow({
  client,
  wagmiConfig,
  leverageTokenConfig,
  sharesToRedeem,
  startSlippageBps = 100,
  retries = 5,
  slippageIncrementBps = 100,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  sharesToRedeem: bigint
  startSlippageBps?: number
  retries?: number
  slippageIncrementBps?: number
}): Promise<RedeemExecutionResult> {
  const addresses = getContractAddresses(leverageTokenConfig.chainId)

  // Get the function to quote the collateral to debt swap for the redeem
  const { result: useCollateralToDebtQuoteResult } = renderHook(wagmiConfig, () =>
    useCollateralToDebtQuote({
      chainId: leverageTokenConfig.chainId,
      routerAddress: addresses.leverageRouterV2 as Address,
      swap: leverageTokenConfig.swaps?.collateralToDebt as CollateralToDebtSwapConfig,
      requiresQuote: true,
    }),
  )
  await waitFor(() =>
    expect(
      useCollateralToDebtQuoteResult.current.quote,
      'Quote function for collateral to debt not found',
    ).toBeDefined(),
  )
  const quoteFn = useCollateralToDebtQuoteResult.current.quote as QuoteFn

  // Preview the redeem plan with slippage retries using the quote function
  // biome-ignore lint/correctness/useHookAtTopLevel: renderHook usage inside retry loop is intentional
  const redeemPlanPreviewResult = await useRedeemPlanPreviewWithSlippageRetries({
    wagmiConfig,
    leverageTokenConfig,
    sharesToRedeem,
    quoteFn,
    slippageBps: startSlippageBps,
    retries,
    slippageIncrementBps,
  })
  const plan = redeemPlanPreviewResult.current.plan
  if (!plan) {
    throw new Error('Redeem plan not found')
  }

  // Approve the leverage token shares from the user to be spent by the leverage router
  const { result: approvalFlow } = renderHook(wagmiConfig, () =>
    useApprovalFlow({
      tokenAddress: leverageTokenConfig.address,
      spender: addresses.leverageRouterV2 as Address,
      amountRaw: plan.sharesToRedeem,
      decimals: leverageTokenConfig.decimals,
      chainId: leverageTokenConfig.chainId,
      enabled: true,
    }),
  )
  expect(approvalFlow.current.isApproved).toBe(false)
  approvalFlow.current.approve()
  await waitFor(
    () =>
      expect(
        approvalFlow.current.isApproved,
        'isApproved not set to true on redeem approval flow',
      ).toBe(true),
    {
      timeout: 30000,
    },
  )

  // Execute the redeem using the plan
  try {
    const { result: redeemWriteResult } = renderHook(wagmiConfig, () =>
      useRedeemExecution({
        token: leverageTokenConfig.address,
        chainId: leverageTokenConfig.chainId,
        account: client.account.address,
        routerAddress: addresses.leverageRouterV2 as Address,
        swap: leverageTokenConfig.swaps?.collateralToDebt as CollateralToDebtSwapConfig,
      }),
    )

    await waitFor(
      () =>
        expect(redeemWriteResult.current.redeem, 'Redeem write function not defined').toBeDefined(),
      {
        timeout: 30000,
      },
    )
    await act(async () => {
      await redeemWriteResult.current.redeem(plan)
    })

    return { plan }
  } catch (error) {
    throw new RedeemExecutionSimulationError(redeemPlanPreviewResult.slippageUsedBps, error)
  }
}

async function useRedeemPlanPreviewWithSlippageRetries({
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
  await waitFor(
    () =>
      expect(
        redeemPlanPreviewResult.current.isLoading,
        'isLoading not set to false on redeem plan preview',
      ).toBe(false),
    {
      timeout: 30000,
    },
  )

  const error = redeemPlanPreviewResult.current.error
  if (error && !error.message.includes('Try increasing your slippage tolerance')) {
    throw error
  }

  if (!error) {
    return { ...redeemPlanPreviewResult, slippageUsedBps: currentSlippageBps }
  }

  for (let i = 0; i < retries; i++) {
    // avoid rate limiting by waiting 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000))

    currentSlippageBps += slippageIncrementBps

    rerender({ slippageBps: currentSlippageBps })

    await waitFor(
      () =>
        expect(
          redeemPlanPreviewResult.current.isLoading,
          'isLoading not set to false on redeem plan preview for retry',
        ).toBe(false),
      {
        timeout: 30000,
      },
    )

    const error = redeemPlanPreviewResult.current.error
    if (error && !error.message.includes('Try increasing your slippage tolerance')) {
      throw error
    }

    if (!error) {
      return { ...redeemPlanPreviewResult, slippageUsedBps: currentSlippageBps }
    }
  }

  throw new Error(`Failed to create redeem plan with retry helper after ${1 + retries} attempts`)
}

function isRateLimitError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('Rate limit reached')
}
