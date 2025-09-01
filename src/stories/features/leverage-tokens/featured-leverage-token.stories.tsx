import type { Meta, StoryObj } from '@storybook/react'
import { FeaturedLeverageTokens } from '../../../features/leverage-tokens/components/FeaturedLeverageToken'
import { EthereumLogo } from '../../../components/icons/logos'

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
}

export default meta
type Story = StoryObj<typeof meta>

const mockToken = {
  id: 'seam-usdc-20x',
  name: 'SEAM / USDC 20x Leverage Token',
  apy: 28.94,
  tvl: 12500000,
  leverage: 20,
  collateralAsset: {
    symbol: 'SEAM',
    name: 'Seamless Protocol',
    address: '0x1234567890123456789012345678901234567890',
  },
  debtAsset: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
  },
  supplyCap: 1000000,
  currentSupply: 750000,
  chainId: 137,
  chainName: 'Polygon',
  chainLogo: EthereumLogo,
  // APY calculation properties
  baseYield: 4.2,
  borrowRate: 2.1,
  rewardMultiplier: 0.8,
  rank: 1,
}

const mockTokens = [
  {
    ...mockToken,
    id: 'weeth-2x',
    name: 'weETH 2x Leverage Token',
    apy: 12.5,
    leverage: 2,
    rank: 1,
  },
  {
    ...mockToken,
    id: 'usdc-3x',
    name: 'USDC 3x Leverage Token',
    apy: 18.2,
    leverage: 3,
    collateralAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    debtAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    },
    leverageToken: {
      apyBreakdown: {
        baseYield: 3.8,
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
    id: 'weeth-1.5x',
    name: 'weETH 1.5x Leverage Token',
    apy: 8.7,
    leverage: 1.5,
    leverageToken: {
      apyBreakdown: {
        baseYield: 4.2,
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
  },
}
