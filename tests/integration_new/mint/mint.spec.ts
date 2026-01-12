import { createWagmiTest, renderHook, waitFor } from '@morpho-org/test-wagmi'
import { parseEther } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect } from 'vitest'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import {
  LeverageTokenKey,
  leverageTokenConfigs,
} from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { mainnetAddresses } from '../addresses'

const test_wsteth_eth_25x_lifi = createWagmiTest(mainnet, {
  forkUrl: process.env['VITE_ETHEREUM_RPC_URL'],
  forkBlockNumber: 24219436n,
})

describe('mint integration tests', () => {
  test_wsteth_eth_25x_lifi(
    'mints wsteth-eth-25x using lifi: happy path',
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
          swap: { type: 'lifi', allowBridges: 'none', order: 'CHEAPEST' },
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
      const { result: mintPlanPreviewResult } = renderHook(wagmiConfig, () =>
        useMintPlanPreview({
          config: wagmiConfig,
          token: leverageTokenConfig.address,
          equityInCollateralAsset,
          slippageBps: 100,
          chainId: mainnet.id,
          enabled: true,
          quote: quoteFn,
          debounceMs: 0,
        }),
      )
      await waitFor(() => expect(mintPlanPreviewResult.current.isLoading).toBe(false))
      if (!mintPlanPreviewResult.current.plan) {
        throw new Error('Current plan not found')
      }
      const plan = mintPlanPreviewResult.current.plan

      expect(plan.minShares).toBe(952417000492971631n)
      expect(plan.minExcessDebt).toBe(6389842463548018n)
      expect(plan.previewShares).toBe(952809156689806197n)
      expect(plan.previewExcessDebt).toBe(11972742859077588n)
      expect(plan.flashLoanAmount).toBe(29077811172079415809n)
      expect(plan.equityInCollateralAsset).toBe(1000000000000000000n)

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
        plan: plan,
      })

      const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
        address: leverageTokenConfig.address,
        args: [client.account.address],
      })
      expect(sharesAfter).toBeGreaterThanOrEqual(plan.minShares)
      expect(sharesAfter).toBe(952772571476942294n)
    },
  )

  test_wsteth_eth_25x_lifi(
    'mints wsteth-eth-25x using lifi: slippage exceeded',
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
          swap: { type: 'lifi', allowBridges: 'none', order: 'CHEAPEST' },
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
      const { result: mintPlanPreviewResult } = renderHook(wagmiConfig, () =>
        useMintPlanPreview({
          config: wagmiConfig,
          token: leverageTokenConfig.address,
          equityInCollateralAsset,
          slippageBps: 1,
          chainId: mainnet.id,
          enabled: true,
          quote: quoteFn,
          debounceMs: 0,
        }),
      )
      await waitFor(() => expect(mintPlanPreviewResult.current.isLoading).toBe(false))
      
      expect(mintPlanPreviewResult.current.error).toBeDefined()
      expect(mintPlanPreviewResult.current.error?.message).toBe('Manager previewed debt 29089783914938493397 is less than flash loan amount 29368589283800209967. Try increasing your slippage tolerance')
    },
  )
})
