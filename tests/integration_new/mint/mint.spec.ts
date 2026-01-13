import { renderHook, waitFor } from '@morpho-org/test-wagmi'
import { parseEther } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect } from 'vitest'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import {
  LeverageTokenKey,
  leverageTokenConfigs,
  type LeverageTokenConfig,
} from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { mainnetAddresses } from '../addresses'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Config } from 'wagmi'
import type { DebtToCollateralSwapConfig } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { mainnetTest } from '../setup'

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
        chainId: mainnet.id,
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
  mainnetTest(
    'mints wsteth-eth-25x: happy path',
    async ({ client, config: wagmiConfig }) => {
      const leverageTokenConfig =
        leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_25X_ETHEREUM_MAINNET]
      if (!leverageTokenConfig) {
        throw new Error('Leverage token config not found')
      }

      // Fund the client account with 1 ETH and 1 wstETH
      await client.deal({
        erc20: leverageTokenConfig.collateralAsset.address,
        account: client.account.address,
        amount: parseEther('1'),
      })
      await client.setBalance({
        address: client.account.address,
        value: parseEther('1'),
      })

      const { result: useDebtToCollateralQuoteResult } = renderHook(wagmiConfig, () =>
        useDebtToCollateralQuote({
          chainId: mainnet.id,
          routerAddress: mainnetAddresses.leverageRouterV2,
          swap: leverageTokenConfig.swaps!.debtToCollateral as DebtToCollateralSwapConfig,
          requiresQuote: true,
          fromAddress: mainnetAddresses.multicallExecutor,
        }),
      )
      await waitFor(() => expect(useDebtToCollateralQuoteResult.current.quote).toBeDefined())
      if (!useDebtToCollateralQuoteResult.current.quote) {
        throw new Error('Quote function for debt to collateral not found')
      }
      const quoteFn = useDebtToCollateralQuoteResult.current.quote

      const equityInCollateralAsset = 10n ** 18n // 1 wstETH deposited by the user
      const mintPlanPreviewResult = await useMintPlanPreviewWithSlippageAttempts({
        wagmiConfig,
        leverageTokenConfig,
        equityInCollateralAsset,
        quoteFn,
        slippageBps: 50,
        retries: 2,
        slippageIncrementBps: 50,
      })

      // Approve the leverage router to spend the collateral asset
      await client.approve({
        address: leverageTokenConfig.collateralAsset.address,
        args: [mainnetAddresses.leverageRouterV2, equityInCollateralAsset],
      })

      const { result: mintWriteResult } = renderHook(wagmiConfig, () => useMintWrite())
      await waitFor(() => expect(mintWriteResult.current.mutateAsync).toBeDefined())

      await mintWriteResult.current.mutateAsync({
        config: wagmiConfig,
        chainId: mainnet.id,
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

  mainnetTest(
    'mints wsteth-eth-25x: slippage exceeded',
    async ({ client, config: wagmiConfig }) => {
      const leverageTokenConfig =
        leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_25X_ETHEREUM_MAINNET]
      if (!leverageTokenConfig) {
        throw new Error('Leverage token config not found')
      }

      // Fund the client account with 1 ETH and 1 wstETH
      await client.deal({
        erc20: leverageTokenConfig.collateralAsset.address,
        account: client.account.address,
        amount: parseEther('1'),
      })
      await client.setBalance({
        address: client.account.address,
        value: parseEther('1'),
      })

      const { result: useDebtToCollateralQuoteResult } = renderHook(wagmiConfig, () =>
        useDebtToCollateralQuote({
          chainId: mainnet.id,
          routerAddress: mainnetAddresses.leverageRouterV2,
          swap: leverageTokenConfig.swaps!.debtToCollateral as DebtToCollateralSwapConfig,
          requiresQuote: true,
          fromAddress: mainnetAddresses.multicallExecutor,
        }),
      )
      await waitFor(() => expect(useDebtToCollateralQuoteResult.current.quote).toBeDefined())
      if (!useDebtToCollateralQuoteResult.current.quote) {
        throw new Error('Quote function for debt to collateral not found')
      }
      const quoteFn = useDebtToCollateralQuoteResult.current.quote

      const equityInCollateralAsset = 10n ** 18n // 1 wstETH deposited by the user
      const plan = await useMintPlanPreviewWithSlippageAttempts({
        wagmiConfig,
        leverageTokenConfig,
        equityInCollateralAsset,
        quoteFn,
        slippageBps: 1,
        retries: 0,
        slippageIncrementBps: 0,
      })

      expect(plan.current.error).toBeDefined()
      expect(plan.current.error?.message).includes(
        'Try increasing your slippage tolerance',
      )
    },
  )
})
