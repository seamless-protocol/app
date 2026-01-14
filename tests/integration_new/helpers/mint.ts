import type { AnvilTestClient } from '@morpho-org/test'
import { renderHook, waitFor } from '@morpho-org/test-wagmi'
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

export type MintExecutionResult = {
  plan: MintPlan
  collateralBalanceBefore: bigint
  equityInCollateralAsset: bigint
  debtBalanceBefore: bigint
}

export async function executeMintFlow({
  client,
  wagmiConfig,
  leverageTokenConfig,
  equityInCollateralAsset,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
}): Promise<MintExecutionResult> {
  const addresses = getContractAddresses(leverageTokenConfig.chainId)

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
  await waitFor(() => expect(useDebtToCollateralQuoteResult.current.quote).toBeDefined())
  if (!useDebtToCollateralQuoteResult.current.quote) {
    throw new Error('Quote function for debt to collateral not found')
  }
  const quoteFn = useDebtToCollateralQuoteResult.current.quote

  // Preview the mint plan with slippage retries using the quote function
  const mintPlanPreviewResult = await useMintPlanPreviewWithSlippageRetries({
    wagmiConfig,
    leverageTokenConfig,
    equityInCollateralAsset,
    quoteFn,
    slippageBps: 50,
    retries: 5,
    slippageIncrementBps: 50,
  })

  const plan = mintPlanPreviewResult.current.plan
  if (!plan) {
    throw new Error('Mint plan not found')
  }

  // Approve the collateral asset from the user to be spent by the leverage router
  const { result: approvalFlow } = renderHook(wagmiConfig, () =>
    useApprovalFlow({
      tokenAddress: leverageTokenConfig.collateralAsset.address,
      spender: addresses.leverageRouterV2 as Address,
      amountRaw: plan.equityInCollateralAsset,
      decimals: leverageTokenConfig.collateralAsset.decimals,
      chainId: leverageTokenConfig.chainId,
      enabled: true,
    }),
  )
  expect(approvalFlow.current.isApproved).toBe(false)
  approvalFlow.current.approve()
  await waitFor(() => expect(approvalFlow.current.isApproved).toBe(true))

  // Execute the mint using the plan
  const { result: mintWriteResult } = renderHook(wagmiConfig, () => useMintWrite())
  await waitFor(() => expect(mintWriteResult.current.mutateAsync).toBeDefined())
  await act(async () => {
    await mintWriteResult.current.mutateAsync({
      config: wagmiConfig,
      chainId: leverageTokenConfig.chainId,
      account: client.account,
      token: leverageTokenConfig.address,
      plan: plan,
    })
  })

  return { plan, collateralBalanceBefore, debtBalanceBefore, equityInCollateralAsset }
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
  const totalAttempts = 1 + retries
  let currentSlippageBps = slippageBps

  for (let i = 0; i < totalAttempts; i++) {
    const { result: mintPlanPreviewResult } = renderHook(wagmiConfig, () =>
      // biome-ignore lint/correctness/useHookAtTopLevel: renderHook usage inside retry loop is intentional
      useMintPlanPreview({
        config: wagmiConfig,
        token: leverageTokenConfig.address,
        equityInCollateralAsset,
        slippageBps: currentSlippageBps,
        chainId: leverageTokenConfig.chainId,
        enabled: true,
        quote: quoteFn,
        debounceMs: 0,
      }),
    )

    await waitFor(() => expect(mintPlanPreviewResult.current.isLoading).toBe(false))

    if (mintPlanPreviewResult.current.plan) {
      return mintPlanPreviewResult
    }

    const error = mintPlanPreviewResult.current.error
    if (error && !error.message.includes('Try increasing your slippage tolerance')) {
      return mintPlanPreviewResult
    }

    currentSlippageBps += slippageIncrementBps
  }

  throw new Error(`Failed to create mint plan with retry helper after ${1 + retries} attempts`)
}
