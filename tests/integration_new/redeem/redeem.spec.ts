import type { QuoteRequest as BalmyQuoteRequest } from '@seamless-defi/defi-sdk'
import { parseUnits } from 'viem'
import { beforeEach, describe } from 'vitest'
import {
  getAllLeverageTokenConfigs,
  type LeverageTokenConfig,
} from '@/features/leverage-tokens/leverageTokens.config'
import { testRedeem } from '../helpers/redeem'
import { wagmiTest } from '../setup'

describe('redeem integration tests', () => {
  beforeEach(async () => {
    // avoid quote api rate limiting by waiting 3 seconds between tests
    await new Promise((resolve) => setTimeout(resolve, 3000))
  })

  const leverageTokenConfigs = getAllLeverageTokenConfigs()

  const rlpUsdc675xConfig = leverageTokenConfigs.find(
    (config) => config.symbol === 'RLP-USDC-6.75x',
  ) as LeverageTokenConfig

  const wstethEth25xConfig = leverageTokenConfigs.find(
    (config) => config.symbol === 'WSTETH-ETH-25x',
  ) as LeverageTokenConfig

  for (const leverageTokenConfig of leverageTokenConfigs) {
    wagmiTest(leverageTokenConfig.chainId)(
      `redeems ${leverageTokenConfig.symbol} shares on chain id ${leverageTokenConfig.chainId}`,
      async ({ client, config: wagmiConfig }) => {
        await testRedeem({ client, wagmiConfig, leverageTokenConfig })
      },
    )
  }

  wagmiTest(rlpUsdc675xConfig.chainId)(
    'redeems with LeverageRouter.redeemWithVelora successfully when on-chain debt to repay is greater than off-chain preview (RLP-USDC-6.75x)',
    async ({ client, config: wagmiConfig }) => {
      // override the default swap config for RLP-USDC-6.75x to use velora exact out for redeem
      ;(
        rlpUsdc675xConfig.swaps?.collateralToDebt as {
          type: 'balmy'
          sourceWhitelist?: Array<string>
          sourceConfig?: BalmyQuoteRequest['sourceConfig']
          excludeAdditionalSources?: never
        }
      ).sourceWhitelist = ['paraswap']

      ;(
        rlpUsdc675xConfig.swaps?.collateralToDebt as {
          type: 'balmy'
          sourceWhitelist?: Array<string>
          sourceConfig?: BalmyQuoteRequest['sourceConfig']
          excludeAdditionalSources?: never
        }
      ).sourceConfig = {
        custom: {
          paraswap: {
            includeContractMethods: ['swapExactAmountOut'],
          },
        },
      }
      await testRedeem({
        client,
        wagmiConfig,
        leverageTokenConfig: rlpUsdc675xConfig,
        debtIncreaseBetweenPlanAndRedeemAmount: parseUnits('0.1', 6), // 0.1 USDC
      })
    },
  )

  wagmiTest(wstethEth25xConfig.chainId)(
    'redeems with LeverageRouter.redeemWithVelora successfully when on-chain debt to repay is greater than off-chain preview (WSTETH-ETH-25x)',
    async ({ client, config: wagmiConfig }) => {
      // override the default swap config for WSTETH-ETH-25x to use velora exact out for redeem
      ;(
        wstethEth25xConfig.swaps?.collateralToDebt as {
          type: 'balmy'
          sourceWhitelist?: Array<string>
          sourceConfig?: BalmyQuoteRequest['sourceConfig']
          excludeAdditionalSources?: never
        }
      ).sourceWhitelist = ['paraswap']
      ;(
        wstethEth25xConfig.swaps?.collateralToDebt as {
          type: 'balmy'
          sourceWhitelist?: Array<string>
          sourceConfig?: BalmyQuoteRequest['sourceConfig']
          excludeAdditionalSources?: never
        }
      ).sourceConfig = {
        custom: {
          paraswap: {
            includeContractMethods: ['swapExactAmountOut'],
          },
        },
      }
      await testRedeem({
        client,
        wagmiConfig,
        leverageTokenConfig: wstethEth25xConfig,
        debtIncreaseBetweenPlanAndRedeemAmount: parseUnits('0.000000001', 18), // 0.000000001 WSTETH
      })
    },
  )
})
