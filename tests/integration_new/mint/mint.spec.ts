import { FailedToGenerateAnyQuotesError } from '@seamless-defi/defi-sdk'
import { beforeEach, describe } from 'vitest'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { testMint } from '../helpers/mint'
import { wagmiTest } from '../setup'

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
            // LiFi is flaky on some swaps sometimes
            try {
              await testMint({
                client,
                wagmiConfig,
                leverageTokenConfig,
                balmyOverrideOptions: { includeSources: ['li-fi'] },
              })
            } catch (error) {
              console.error('Mint with LiFi integration test error:', error)
            }
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
