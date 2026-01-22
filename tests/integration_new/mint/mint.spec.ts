import type { AnvilTestClient } from '@morpho-org/test'
import { FailedToGenerateAnyQuotesError } from '@seamless-defi/defi-sdk'
import { parseEther } from 'viem'
import { beforeEach, describe, expect } from 'vitest'
import type { Config } from 'wagmi'
import type { MintPlan } from '@/domain/mint'
import type { BalmyAdapterOverrideOptions } from '@/domain/shared/adapters/balmy'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { executeMintFlow, MintExecutionSimulationError } from '../helpers/mint'
import { wagmiTest } from '../setup'

const MAX_RETRY_STARTING_SLIPPAGE_BPS = 600 // 6%

describe('mint integration tests', () => {
  beforeEach(async () => {
    // avoid quote api rate limiting by waiting 3 seconds between tests
    await new Promise((resolve) => setTimeout(resolve, 3000))
  })

  const leverageTokenConfigs = getAllLeverageTokenConfigs()

  for (const leverageTokenConfig of leverageTokenConfigs) {
    const mintSwapConfig = leverageTokenConfig.swaps?.debtToCollateral

    wagmiTest(leverageTokenConfig.chainId)(
      `mints ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId}`,
      async ({ client, config: wagmiConfig }) => {
        await testMint({ client, wagmiConfig, leverageTokenConfig })
      },
    )

    if (mintSwapConfig?.type === 'balmy') {
      if (!mintSwapConfig.excludeAdditionalSources?.includes('kyberswap')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `mints ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for kyberswap`,
          async ({ client, config: wagmiConfig }) => {
            await testMint({
              client,
              wagmiConfig,
              leverageTokenConfig,
              balmyOverrideOptions: { includeSources: ['kyberswap'] },
            })
          },
        )
      }
      if (!mintSwapConfig.excludeAdditionalSources?.includes('li-fi')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `mints ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for li-fi`,
          async ({ client, config: wagmiConfig }) => {
            await testMint({
              client,
              wagmiConfig,
              leverageTokenConfig,
              balmyOverrideOptions: { includeSources: ['li-fi'] },
            })
          },
        )
      }
      if (!mintSwapConfig.excludeAdditionalSources?.includes('open-ocean')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `mints ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for open-ocean`,
          async ({ client, config: wagmiConfig }) => {
            await testMint({
              client,
              wagmiConfig,
              leverageTokenConfig,
              balmyOverrideOptions: { includeSources: ['open-ocean'] },
            })
          },
        )
      }
      if (!mintSwapConfig.excludeAdditionalSources?.includes('paraswap')) {
        wagmiTest(leverageTokenConfig.chainId)(
          `mints ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId} with balmy override options for paraswap`,
          async ({ client, config: wagmiConfig }) => {
            try {
              await testMint({
                client,
                wagmiConfig,
                leverageTokenConfig,
                balmyOverrideOptions: { includeSources: ['paraswap'] },
              })
            } catch (error) {
              console.error('Mint with paraswap integration test error:', error)
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

export async function testMint({
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

  let plan: MintPlan | undefined
  try {
    const result = await executeMintFlow({
      client,
      wagmiConfig,
      leverageTokenConfig,
      equityInCollateralAsset,
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
      error instanceof MintExecutionSimulationError &&
      error.slippageUsedBps < MAX_RETRY_STARTING_SLIPPAGE_BPS
    ) {
      // Retry the mint up to 5 additional times, bumping slippage until MAX_STARTING_SLIPPAGE_BPS
      let attempts = 0
      const slippageIncrementBps = 100
      let nextSlippageBps = error.slippageUsedBps + slippageIncrementBps
      let lastError: unknown = error

      while (attempts < 5 && nextSlippageBps <= MAX_RETRY_STARTING_SLIPPAGE_BPS) {
        console.log(`Retrying mint with starting slippage bps: ${nextSlippageBps}`)

        // Reset the client to avoid "BlockOutOfRangeError: block height is 24291059 but requested was 24291058" like errors
        await client.reset()

        try {
          await testMint({
            client,
            wagmiConfig,
            leverageTokenConfig,
            ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
            startSlippageBps: nextSlippageBps,
            retries: (MAX_RETRY_STARTING_SLIPPAGE_BPS - nextSlippageBps) / slippageIncrementBps,
            slippageIncrementBps,
          })
          break
        } catch (retryError) {
          lastError = retryError
          if (
            retryError instanceof MintExecutionSimulationError &&
            nextSlippageBps < MAX_RETRY_STARTING_SLIPPAGE_BPS
          ) {
            attempts += 1
            nextSlippageBps = retryError.slippageUsedBps + slippageIncrementBps
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
    throw new Error('Mint plan not generated after retries')
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
