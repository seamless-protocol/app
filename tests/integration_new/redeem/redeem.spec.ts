import type { AnvilTestClient } from '@morpho-org/test'
import { FailedToGenerateAnyQuotesError } from '@seamless-defi/defi-sdk'
import { beforeEach, describe, expect } from 'vitest'
import type { Config } from 'wagmi'
import type { RedeemPlan } from '@/domain/redeem'
import type { BalmyAdapterOverrideOptions } from '@/domain/shared/adapters/balmy'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { executeRedeemFlow, RedeemExecutionSimulationError } from '../helpers/redeem'
import { wagmiTest } from '../setup'
import { testMint } from '../mint/mint.spec'

const MAX_RETRY_STARTING_SLIPPAGE_BPS = 600 // 6%

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
  startSlippageBps = 100,
  retries = 5,
  slippageIncrementBps = 100,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  leverageTokenConfig: LeverageTokenConfig
  balmyOverrideOptions?: BalmyAdapterOverrideOptions
  startSlippageBps?: number
  retries?: number
  slippageIncrementBps?: number
}) {
  await testMint({
    client,
    wagmiConfig,
    leverageTokenConfig,
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

  let plan: RedeemPlan | undefined
  try {
    const result = await executeRedeemFlow({
      client,
      wagmiConfig,
      leverageTokenConfig,
      sharesToRedeem: leverageTokenBalanceBefore,
      ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
      startSlippageBps,
      retries,
      slippageIncrementBps,
    })
    plan = result.plan
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit reached')) {
      return
    } else if (
      error instanceof RedeemExecutionSimulationError &&
      error.slippageUsedBps < MAX_RETRY_STARTING_SLIPPAGE_BPS
    ) {
      // Retry the redeem up to 5 additional times, bumping slippage until MAX_STARTING_SLIPPAGE_BPS
      let attempts = 0
      let nextSlippageBps = error.slippageUsedBps + 100
      let lastError: unknown = error

      while (attempts < 5 && nextSlippageBps <= MAX_RETRY_STARTING_SLIPPAGE_BPS) {
        console.log(
          `Retrying redeem for ${leverageTokenConfig.symbol} with starting slippage bps: ${nextSlippageBps}`,
        )

        // Reset the client to avoid "BlockOutOfRangeError: block height is 24291059 but requested was 24291058" like errors
        await client.reset()

        try {
          await testRedeem({
            client,
            wagmiConfig,
            leverageTokenConfig,
            ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
            startSlippageBps: nextSlippageBps,
            retries: (MAX_RETRY_STARTING_SLIPPAGE_BPS - nextSlippageBps) / 100,
            slippageIncrementBps: 100,
          })
          break
        } catch (retryError) {
          lastError = retryError
          if (
            retryError instanceof RedeemExecutionSimulationError &&
            nextSlippageBps < MAX_RETRY_STARTING_SLIPPAGE_BPS
          ) {
            attempts += 1
            nextSlippageBps = retryError.slippageUsedBps + 100
            continue
          }
          throw retryError
        }
      }

      if (!plan) {
        throw lastError
      }
    } else {
      throw error
    }
  }

  if (!plan) {
    throw new Error('Redeem plan not generated after retries')
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
