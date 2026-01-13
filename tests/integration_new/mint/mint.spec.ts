import { renderHook, waitFor } from '@morpho-org/test-wagmi'
import { parseEther, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect } from 'vitest'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import {
  getAllLeverageTokenConfigs,
  type LeverageTokenConfig,
} from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Config } from 'wagmi'
import type { DebtToCollateralSwapConfig } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { mainnetTest, baseTest } from '../setup'
import { getContractAddresses } from '@/lib/contracts'

const useMintPlanPreviewWithSlippageAttempts = async ({
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

  // Try increasing slippage up to the allowed attempts
  while (remainingAttempts > 0) {
    remainingAttempts -= 1
    const { result: mintPlanPreviewResult } = renderHook(wagmiConfig, () =>
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

    const isSlippageError =
      mintPlanPreviewResult.current.error?.message.includes('Try increasing your slippage tolerance')

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
    const testRunner =
      (leverageTokenConfig.chainId === mainnet.id ? mainnetTest : baseTest) as typeof mainnetTest 

    const equityInCollateralAsset = parseUnits(
      '1',
      leverageTokenConfig.collateralAsset.decimals,
    )

    testRunner(
      `mints ${leverageTokenConfig.symbol}: happy path`,
      async ({ client, config: wagmiConfig }) => {
        await client.deal({
          erc20: leverageTokenConfig.collateralAsset.address,
          account: client.account.address,
          amount: equityInCollateralAsset,
        })
        await client.setBalance({
          address: client.account.address,
          value: parseEther('1'),
        })

        const { result: useDebtToCollateralQuoteResult } = renderHook(wagmiConfig, () =>
          useDebtToCollateralQuote({
            chainId: leverageTokenConfig.chainId,
            routerAddress: addresses.leverageRouterV2!,
            swap: leverageTokenConfig.swaps!.debtToCollateral as DebtToCollateralSwapConfig,
            requiresQuote: true,
            fromAddress: addresses.multicallExecutor!,
          }),
        )
        await waitFor(() => expect(useDebtToCollateralQuoteResult.current.quote).toBeDefined())
        if (!useDebtToCollateralQuoteResult.current.quote) {
          throw new Error('Quote function for debt to collateral not found')
        }
        const quoteFn = useDebtToCollateralQuoteResult.current.quote

        const mintPlanPreviewResult = await useMintPlanPreviewWithSlippageAttempts({
          wagmiConfig,
          leverageTokenConfig,
          equityInCollateralAsset,
          quoteFn,
          slippageBps: 50,
          retries: 5,
          slippageIncrementBps: 50,
        })

        await client.approve({
          address: leverageTokenConfig.collateralAsset.address,
          args: [addresses.leverageRouterV2!, equityInCollateralAsset],
        })

        const { result: mintWriteResult } = renderHook(wagmiConfig, () => useMintWrite())
        await waitFor(() => expect(mintWriteResult.current.mutateAsync).toBeDefined())

        await mintWriteResult.current.mutateAsync({
          config: wagmiConfig,
          chainId: leverageTokenConfig.chainId,
          account: client.account,
          token: leverageTokenConfig.address,
          plan: mintPlanPreviewResult.current.plan!,
        })

        const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.address,
          args: [client.account.address],
        })
        expect(sharesAfter).toBeGreaterThanOrEqual(mintPlanPreviewResult.current.plan!.minShares)
      },
    )
  }
})
