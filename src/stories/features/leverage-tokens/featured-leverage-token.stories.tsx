import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Address } from 'viem'
import { mainnet } from 'viem/chains'
import { WagmiProvider } from 'wagmi'
import { EthereumLogo } from '../../../components/icons/logos'
import { FeaturedLeverageTokens } from '../../../features/leverage-tokens/components/FeaturedLeverageToken'
import { config } from '../../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta: Meta<typeof FeaturedLeverageTokens> = {
  title: 'Features/Leverage Tokens/FeaturedLeverageTokens',
  component: FeaturedLeverageTokens,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Featured leverage tokens section with cards showing APY, rewards, and leverage information.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onTokenClick: { action: 'token clicked' },
  },
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <div className="p-4">
              <Story />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const mockToken = {
  address: '0x1234567890123456789012345678901234567890' as Address,
  name: 'SEAM / USDC 20x Leverage Token',
  symbol: 'SEAM20x',
  description: '20x leveraged SEAM token',
  decimals: 18,
  tvl: 12500000,
  leverageRatio: 20,
  collateralAsset: {
    symbol: 'SEAM',
    name: 'Seamless Protocol',
    description: 'Seamless Protocol governance token',
    address: '0x1234567890123456789012345678901234567890' as Address,
    decimals: 18,
  },
  debtAsset: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
    decimals: 6,
  },
  supplyCap: 1000000,
  currentSupply: 750000,
  collateralAmount: 850000,
  debtAmount: 425000,
  chainId: mainnet.id,
  chainName: mainnet.name,
  chainLogo: EthereumLogo,
  rank: 1,
  test: {
    mintIntegrationTest: {
      equityInCollateralAsset: 1n ** 18n,
    },
  },
}

const mockTokens = [
  {
    ...mockToken,
    address: '0xCd5fE23C85820F7B08D4D8A6c35929B5d900B527' as Address,
    name: 'weETH 2x Leverage Token',
    leverageRatio: 2,
    rank: 1,
  },
  {
    ...mockToken,
    address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
    name: 'USDC 3x Leverage Token',
    leverageRatio: 3,
    collateralAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      description: 'USD Coin stablecoin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    debtAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' as Address,
      decimals: 18,
    },
    leverageToken: {
      apyBreakdown: {
        leverageMultiplier: 3,
        borrowCost: 3.2,
        rewardAPY: 4.5,
        points: 980,
        netAPY: 18.2,
      },
      leverageAmount: 3,
    },
    rank: 2,
  },
  {
    ...mockToken,
    address: '0xCd5fE23C85820F7B08D4D8A6c35929B5d900B527' as Address,
    name: 'weETH 1.5x Leverage Token',
    apy: 8.7,
    leverage: 1.5,
    leverageToken: {
      apyBreakdown: {
        leverageMultiplier: 1.5,
        borrowCost: 1.8,
        rewardAPY: 2.1,
        points: 650,
        netAPY: 8.7,
      },
      leverageAmount: 1.5,
    },
    rank: 3,
  },
]

export const Default: Story = {
  args: {
    tokens: mockTokens,
    onTokenClick: (token) => console.log('Token clicked:', token),
    apyDataMap: new Map([
      [
        '0xCd5fE23C85820F7B08D4D8A6c35929B5d900B527',
        {
          totalAPY: 12.34,
          rewardsAPR: 4.56,
          points: 1250,
          borrowRate: -2.1,
          stakingYield: 8.78,
          restakingYield: 1.2,
          metadata: {
            yieldAveragingPeriod: '7-day average' as const,
            borrowAveragingPeriod: '24-hour average' as const,
          },
          errors: {},
        },
      ],
      [
        '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
        {
          totalAPY: 18.2,
          rewardsAPR: 4.5,
          points: 980,
          borrowRate: -3.2,
          stakingYield: 15.4,
          restakingYield: 1.5,
          metadata: {
            yieldAveragingPeriod: '7-day average' as const,
            borrowAveragingPeriod: '7-day average' as const,
          },
          errors: {},
        },
      ],
    ]),
    isApyLoading: false,
    isApyError: false,
  },
}
