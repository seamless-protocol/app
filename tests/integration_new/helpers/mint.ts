import type { AnvilTestClient } from '@morpho-org/test'
import { waitFor } from '@morpho-org/test-wagmi'
import { act } from '@testing-library/react'
import { type Address, parseEther } from 'viem'
import { expect } from 'vitest'
import type { Config } from 'wagmi'
import type { MintPlan } from '@/domain/mint'
import type { DebtToCollateralSwapConfig } from '@/domain/mint/utils/createDebtToCollateralQuote'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { useApprovalFlow } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { renderHook } from './wagmi'

export type MintExecutionResult = {
  plan: MintPlan
}

export class MintExecutionSimulationError extends Error {
  constructor(cause?: unknown) {
    super(`Simulation of mint plan failed`)
    this.name = 'MintExecutionSimulationError'
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

const DEFAULT_START_SHARE_SLIPPAGE_BPS = 100
const DEFAULT_SHARE_SLIPPAGE_INCREMENT_BPS = 100
const MAX_ATTEMPTS = 5

export async function testMint({
  client,
  wagmiConfig,
  leverageTokenConfig,
  startShareSlippageBps = DEFAULT_START_SHARE_SLIPPAGE_BPS,
  slippageIncrementBps = DEFAULT_SHARE_SLIPPAGE_INCREMENT_BPS,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  startShareSlippageBps?: number
  slippageIncrementBps?: number
}) {
  const equityInCollateralAsset =
    leverageTokenConfig.test.mintIntegrationTest.equityInCollateralAsset

  await client.deal({
    erc20: leverageTokenConfig.collateralAsset.address,
    account: client.account.address,
    amount: equityInCollateralAsset,
  })
  await client.setBalance({
    address: client.account.address,
    value: parseEther('1'),
  })

  const collateralBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.collateralAsset.address,
    args: [client.account.address],
  })
  const debtBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.debtAsset.address,
    args: [client.account.address],
  })

  const plan = await mintWithRetries({
    client,
    wagmiConfig,
    leverageTokenConfig,
    equityInCollateralAsset,
    startShareSlippageBps,
    slippageIncrementBps,
  })

  if (!plan) {
    throw new Error('Mint execution failed after retries')
  }

  // Check the shares minted to the user
  const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.address,
    args: [client.account.address],
  })
  expect(sharesAfter).toBeGreaterThanOrEqual(plan.minShares)

  // Verify the user's collateral balance decreased by the expected amount
  const collateralBalanceAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.collateralAsset.address,
    args: [client.account.address],
  })
  const collateralDelta = collateralBalanceBefore - collateralBalanceAfter
  expect(collateralDelta).toBe(equityInCollateralAsset)

  // Check the excess debt assets the user received from the mint
  const debtAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
    address: leverageTokenConfig.debtAsset.address,
    args: [client.account.address],
  })
  const debtDelta = debtAfter - debtBalanceBefore
  expect(debtDelta).toBeGreaterThanOrEqual(plan.minExcessDebt)
}

async function mintWithRetries({
  client,
  wagmiConfig,
  leverageTokenConfig,
  equityInCollateralAsset,
  startShareSlippageBps,
  slippageIncrementBps,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
  startShareSlippageBps: number
  slippageIncrementBps: number
}): Promise<MintPlan | undefined> {
  let shareSlippageBps = startShareSlippageBps

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const { plan } = await executeMintFlow({
        client,
        wagmiConfig,
        leverageTokenConfig,
        equityInCollateralAsset,
        shareSlippageBps,
        swapSlippageBps: 1,
        flashLoanAdjustmentBps: shareSlippageBps, // Setting to the same value as share slippage works fairly consistently
      })

      return plan
    } catch (error) {
      const isRetryableError =
        error instanceof MintExecutionSimulationError ||
        (error instanceof Error &&
          error.message.includes('Try increasing your share slippage tolerance'))

      if (isRetryableError && i < MAX_ATTEMPTS - 1) {
        shareSlippageBps += slippageIncrementBps
        console.log(`Retrying mint with share slippage bps: ${shareSlippageBps}`)
        continue
      }

      throw error
    }
  }

  throw new Error(`Mint failed after ${MAX_ATTEMPTS} attempts`)
}

async function executeMintFlow({
  client,
  wagmiConfig,
  leverageTokenConfig,
  equityInCollateralAsset,
  shareSlippageBps,
  swapSlippageBps,
  flashLoanAdjustmentBps,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
  shareSlippageBps: number
  swapSlippageBps: number
  flashLoanAdjustmentBps: number
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
    }),
  )
  await waitFor(() =>
    expect(
      useDebtToCollateralQuoteResult.current.quote,
      'Quote function for debt to collateral not found',
    ).toBeDefined(),
  )
  const quoteFn = useDebtToCollateralQuoteResult.current.quote as QuoteFn

  // Preview the mint plan
  const { result: mintPlanPreviewResult } = renderHook(
    wagmiConfig,
    (props: {
      shareSlippageBps: number
      swapSlippageBps: number
      flashLoanAdjustmentBps: number
    }) =>
      useMintPlanPreview({
        config: wagmiConfig,
        token: leverageTokenConfig.address,
        equityInCollateralAsset,
        chainId: leverageTokenConfig.chainId,
        enabled: true,
        quote: quoteFn,
        ...props,
      }),
    {
      initialProps: { shareSlippageBps, swapSlippageBps, flashLoanAdjustmentBps },
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
  if (error) throw error

  const plan = mintPlanPreviewResult.current.plan
  if (!plan) {
    throw new Error('Mint plan not found after previewing with slippage retries')
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
    throw new MintExecutionSimulationError(error)
  }
}
