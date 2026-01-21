import type { AnvilTestClient } from '@morpho-org/test'
import { waitFor } from '@morpho-org/test-wagmi'
import { FailedToGenerateAnyQuotesError } from '@seamless-defi/defi-sdk'
import { act } from '@testing-library/react'
import { type Address, parseEther } from 'viem'
import { beforeEach, describe, expect } from 'vitest'
import type { Config } from 'wagmi'
import type { QuoteFn } from '@/domain/mint'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem'
import type { BalmyAdapterOverrideOptions } from '@/domain/shared/adapters/balmy'
import { useApprovalFlow } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { useCollateralToDebtQuote } from '@/features/leverage-tokens/hooks/redeem/useCollateralToDebtQuote'
import { useRedeemExecution } from '@/features/leverage-tokens/hooks/redeem/useRedeemExecution'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { executeMintFlow } from '../helpers/mint'
import { useRedeemPlanPreviewWithSlippageRetries } from '../helpers/redeem'
import { renderHook } from '../helpers/wagmi'
import { wagmiTest } from '../setup'

describe('redeem integration tests', () => {
  beforeEach(async () => {
    // avoid quote api rate limiting by waiting 3 seconds between tests
    await new Promise((resolve) => setTimeout(resolve, 3000))
  })

  const leverageTokenConfigs = getAllLeverageTokenConfigs()

  for (const leverageTokenConfig of leverageTokenConfigs) {
    const redeemSwapConfig = leverageTokenConfig.swaps?.collateralToDebt

    wagmiTest(leverageTokenConfig.chainId)(
      `redeems ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId}`,
      async ({ client, config: wagmiConfig }) => {
        await testRedeem({ client, wagmiConfig, leverageTokenConfig })
      },
    )

    if (redeemSwapConfig?.type === 'balmy') {
      if (!redeemSwapConfig.excludeAdditionalSources?.includes('kyberswap')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `redeems ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for kyberswap`,
          async ({ client, config: wagmiConfig }) => {
            await testRedeem({
              client,
              wagmiConfig,
              leverageTokenConfig,
              balmyOverrideOptions: { includeSources: ['kyberswap'] },
            })
          },
        )
      }
      if (!redeemSwapConfig.excludeAdditionalSources?.includes('li-fi')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `redeems ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for li-fi`,
          async ({ client, config: wagmiConfig }) => {
            await testRedeem({
              client,
              wagmiConfig,
              leverageTokenConfig,
              balmyOverrideOptions: { includeSources: ['li-fi'] },
            })
          },
        )
      }
      if (!redeemSwapConfig.excludeAdditionalSources?.includes('open-ocean')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `redeems ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for open-ocean`,
          async ({ client, config: wagmiConfig }) => {
            await testRedeem({
              client,
              wagmiConfig,
              leverageTokenConfig,
              balmyOverrideOptions: { includeSources: ['open-ocean'] },
            })
          },
        )
      }
      if (!redeemSwapConfig.excludeAdditionalSources?.includes('paraswap')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `redeems ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for paraswap`,
          async ({ client, config: wagmiConfig }) => {
            try {
              await testRedeem({
                client,
                wagmiConfig,
                leverageTokenConfig,
                balmyOverrideOptions: { includeSources: ['paraswap'] },
              })
            } catch (error) {
              console.error('Redeem with paraswap integration test error:', error)
              if (
                (error instanceof Error && error.message.includes('Rate limit reached')) ||
                error instanceof FailedToGenerateAnyQuotesError // Paraswap is flaky on some swaps sometimes
              ) {
                return
              }
              throw error
            }
          },
        )
      }
    }
  }
})

async function testRedeem({
  client,
  wagmiConfig,
  leverageTokenConfig,
  balmyOverrideOptions,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  balmyOverrideOptions?: BalmyAdapterOverrideOptions
}) {
  const addresses = getContractAddresses(leverageTokenConfig.chainId)

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

  await executeMintFlow({
    client,
    wagmiConfig,
    leverageTokenConfig,
    equityInCollateralAsset,
  })

  // Wait 3 seconds to avoid quote api rate limiting and for anvil to catch up
  await new Promise((resolve) => setTimeout(resolve, 3000))

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

  // Get the function to quote the collateral to debt swap for the redeem
  const { result: useCollateralToDebtQuoteResult } = renderHook(wagmiConfig, () =>
    useCollateralToDebtQuote({
      chainId: leverageTokenConfig.chainId,
      routerAddress: addresses.leverageRouterV2 as Address,
      swap: leverageTokenConfig.swaps?.collateralToDebt as CollateralToDebtSwapConfig,
      requiresQuote: true,
      ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
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
    sharesToRedeem: leverageTokenBalanceBefore,
    quoteFn,
    slippageBps: 100,
    retries: 5,
    slippageIncrementBps: 100,
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
  await waitFor(() =>
    expect(
      approvalFlow.current.isApproved,
      'isApproved not set to true on redeem approval flow',
    ).toBe(true),
  )

  // Execute the redeem using the plan
  const { result: redeemWriteResult } = renderHook(wagmiConfig, () =>
    useRedeemExecution({
      token: leverageTokenConfig.address,
      chainId: leverageTokenConfig.chainId,
      account: client.account.address,
      routerAddress: addresses.leverageRouterV2 as Address,
      swap: leverageTokenConfig.swaps?.collateralToDebt as CollateralToDebtSwapConfig,
    }),
  )
  await waitFor(() =>
    expect(redeemWriteResult.current.redeem, 'Redeem write function not defined').toBeDefined(),
  )
  await act(async () => {
    await redeemWriteResult.current.redeem(plan)
  })

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
