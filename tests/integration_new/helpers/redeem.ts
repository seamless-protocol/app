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
  constructor(cause?: unknown) {
    super(`Simulation of redeem plan failed`)
    this.name = 'RedeemExecutionSimulationError'
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

const DEFAULT_START_COLLATERAL_SLIPPAGE_BPS = 100
const DEFAULT_COLLATERAL_SLIPPAGE_INCREMENT_BPS = 100
const MAX_ATTEMPTS = 5

export async function testRedeem({
  client,
  wagmiConfig,
  leverageTokenConfig,
  startCollateralSlippageBps = DEFAULT_START_COLLATERAL_SLIPPAGE_BPS,
  collateralSlippageIncrementBps = DEFAULT_COLLATERAL_SLIPPAGE_INCREMENT_BPS,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  startCollateralSlippageBps?: number
  collateralSlippageIncrementBps?: number
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
    startCollateralSlippageBps,
    collateralSlippageIncrementBps,
  })

  if (!plan) {
    throw new Error('Redeem execution failed after retries')
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
  startCollateralSlippageBps,
  collateralSlippageIncrementBps,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  leverageTokenBalanceBefore: bigint
  startCollateralSlippageBps: number
  collateralSlippageIncrementBps: number
}): Promise<RedeemPlan | undefined> {
  let collateralSlippageBps = startCollateralSlippageBps

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const { plan } = await executeRedeemFlow({
        client,
        wagmiConfig,
        leverageTokenConfig,
        sharesToRedeem: leverageTokenBalanceBefore,
        collateralSlippageBps,
        swapSlippageBps: 1,
      })

      return plan
    } catch (error) {
      const isRetryableError =
        error instanceof RedeemExecutionSimulationError ||
        (error instanceof Error &&
          error.message.includes('Try increasing your collateral slippage tolerance'))

      if (isRetryableError && i < MAX_ATTEMPTS - 1) {
        collateralSlippageBps += collateralSlippageIncrementBps
        console.log(`Retrying redeem with collateral slippage bps: ${collateralSlippageBps}`)
        continue
      }

      throw error
    }
  }

  throw new Error(`Redeem failed after ${MAX_ATTEMPTS} attempts`)
}

async function executeRedeemFlow({
  client,
  wagmiConfig,
  leverageTokenConfig,
  sharesToRedeem,
  collateralSlippageBps,
  swapSlippageBps,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  sharesToRedeem: bigint
  collateralSlippageBps: number
  swapSlippageBps: number
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

  // Preview the redeem plan
  const { result: redeemPlanPreviewResult } = renderHook(
    wagmiConfig,
    (props: { collateralSlippageBps: number; swapSlippageBps: number }) =>
      useRedeemPlanPreview({
        token: leverageTokenConfig.address,
        sharesToRedeem,
        chainId: leverageTokenConfig.chainId,
        enabled: true,
        quote: quoteFn,
        ...props,
      }),
    {
      initialProps: { collateralSlippageBps, swapSlippageBps },
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
  if (error) throw error

  const plan = redeemPlanPreviewResult.current.plan
  if (!plan) {
    throw new Error('Redeem plan not found after previewing with slippage retries')
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
    throw new RedeemExecutionSimulationError(error)
  }
}
