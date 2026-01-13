import { renderHook, waitFor } from '@morpho-org/test-wagmi'
import { type Address, parseEther, parseUnits } from 'viem'
import { describe, expect } from 'vitest'
import type { Config } from 'wagmi'
import type { DebtToCollateralSwapConfig } from '@/domain/mint/utils/createDebtToCollateralQuote'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import {
  getAllLeverageTokenConfigs,
  type LeverageTokenConfig,
} from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { wagmiTest } from '../setup'

const useMintPlanPreviewWithSlippageRetries = async ({
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
}) => {
  let remainingAttempts = 1 + retries
  let currentSlippageBps = slippageBps

  while (remainingAttempts > 0) {
    remainingAttempts -= 1
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

    const isSlippageError = mintPlanPreviewResult.current.error?.message.includes(
      'Try increasing your slippage tolerance',
    )

    if (isSlippageError && remainingAttempts > 0) {
      currentSlippageBps += slippageIncrementBps
      continue
    }

    return mintPlanPreviewResult
  }

  throw new Error(`Failed to create mint plan with retry helper after ${1 + retries} attempts`)
}

describe('mint integration tests', () => {
  const leverageTokenConfigs = getAllLeverageTokenConfigs()

  for (const leverageTokenConfig of leverageTokenConfigs) {
    const addresses = getContractAddresses(leverageTokenConfig.chainId)

    const equityInCollateralAsset = parseUnits('1', leverageTokenConfig.collateralAsset.decimals)

    wagmiTest(leverageTokenConfig.chainId)(
      `mints ${leverageTokenConfig.symbol} shares on ${leverageTokenConfig.chainId}`,
      async ({ client, config: wagmiConfig }) => {
        // Give the account some ETH and the collateral asset to mint with
        await client.deal({
          erc20: leverageTokenConfig.collateralAsset.address,
          account: client.account.address,
          amount: equityInCollateralAsset,
        })
        await client.setBalance({
          address: client.account.address,
          value: parseEther('1'),
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

        // Approve the leverage router to spend the collateral asset for the mint
        await client.approve({
          address: leverageTokenConfig.collateralAsset.address,
          args: [addresses.leverageRouterV2 as Address, plan.equityInCollateralAsset],
        })

        // Execute the mint using the plan
        const { result: mintWriteResult } = renderHook(wagmiConfig, () => useMintWrite())
        await waitFor(() => expect(mintWriteResult.current.mutateAsync).toBeDefined())
        await mintWriteResult.current.mutateAsync({
          config: wagmiConfig,
          chainId: leverageTokenConfig.chainId,
          account: client.account,
          token: leverageTokenConfig.address,
          plan: plan,
        })

        // Verify the mint was successful by checking the balance of shares
        const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.address,
          args: [client.account.address],
        })
        expect(sharesAfter).toBeGreaterThanOrEqual(plan.minShares)
      },
    )
  }
})
