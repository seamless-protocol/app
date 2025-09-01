import type { Meta, StoryObj } from '@storybook/react'
import { EthereumLogo, USDCLogo, weETHLogo } from '../../../components/icons/logos'
import { LeverageTokenTable } from '../../../features/leverage-tokens/components/LeverageTokenTable'

const meta: Meta<typeof LeverageTokenTable> = {
  title: 'Features/Leverage Tokens/LeverageTokenTable',
  component: LeverageTokenTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onTokenClick: { action: 'token clicked' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockTokens = [
  {
    id: 'weeth-2x',
    name: 'weETH 2x Leverage Token',
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 12500000,
    apy: 12.5,
    leverage: 2,
    supplyCap: 1000000,
    currentSupply: 750000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: EthereumLogo,
    baseYield: 8.2,
    borrowRate: 4.3,
  },
  {
    id: 'usdc-3x',
    name: 'USDC 3x Leverage Token',
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
    tvl: 8500000,
    apy: 18.2,
    leverage: 3,
    supplyCap: 5000000,
    currentSupply: 3200000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: USDCLogo,
    baseYield: 12.1,
    borrowRate: 6.1,
  },
  {
    id: 'weeth-1.5x',
    name: 'weETH 1.5x Leverage Token',
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 3200000,
    apy: 8.7,
    leverage: 1.5,
    supplyCap: 2000000,
    currentSupply: 1800000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: weETHLogo,
    baseYield: 5.8,
    borrowRate: 2.9,
  },
  {
    id: 'eth-5x',
    name: 'ETH 5x Leverage Token',
    collateralAsset: {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 4500000,
    apy: 25.3,
    leverage: 5,
    supplyCap: 1500000,
    currentSupply: 1200000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: EthereumLogo,
    baseYield: 15.2,
    borrowRate: 10.1,
  },
  {
    id: 'btc-4x',
    name: 'BTC 4x Leverage Token',
    collateralAsset: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 7800000,
    apy: 22.1,
    leverage: 4,
    supplyCap: 3000000,
    currentSupply: 2500000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: USDCLogo,
    baseYield: 18.5,
    borrowRate: 3.6,
  },
  {
    id: 'matic-2.5x',
    name: 'MATIC 2.5x Leverage Token',
    collateralAsset: {
      symbol: 'MATIC',
      name: 'Polygon',
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 2100000,
    apy: 16.8,
    leverage: 2.5,
    supplyCap: 800000,
    currentSupply: 600000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: EthereumLogo,
    baseYield: 11.2,
    borrowRate: 5.6,
  },
  {
    id: 'link-3.5x',
    name: 'LINK 3.5x Leverage Token',
    collateralAsset: {
      symbol: 'LINK',
      name: 'Chainlink',
      address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 3400000,
    apy: 19.7,
    leverage: 3.5,
    supplyCap: 1200000,
    currentSupply: 900000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: USDCLogo,
    baseYield: 14.3,
    borrowRate: 5.4,
  },
  {
    id: 'aave-2x',
    name: 'AAVE 2x Leverage Token',
    collateralAsset: {
      symbol: 'AAVE',
      name: 'Aave',
      address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 1800000,
    apy: 14.2,
    leverage: 2,
    supplyCap: 600000,
    currentSupply: 450000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: weETHLogo,
    baseYield: 9.8,
    borrowRate: 4.4,
  },
  {
    id: 'uni-3x',
    name: 'UNI 3x Leverage Token',
    collateralAsset: {
      symbol: 'UNI',
      name: 'Uniswap',
      address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 2900000,
    apy: 17.5,
    leverage: 3,
    supplyCap: 1000000,
    currentSupply: 750000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: EthereumLogo,
    baseYield: 12.8,
    borrowRate: 4.7,
  },
  {
    id: 'sushi-2.5x',
    name: 'SUSHI 2.5x Leverage Token',
    collateralAsset: {
      symbol: 'SUSHI',
      name: 'SushiSwap',
      address: '0x0b3f868e0be5597d5db7feb9839de74c76867b58',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 1200000,
    apy: 13.8,
    leverage: 2.5,
    supplyCap: 500000,
    currentSupply: 350000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: USDCLogo,
    baseYield: 8.9,
    borrowRate: 4.9,
  },
  {
    id: 'comp-2x',
    name: 'COMP 2x Leverage Token',
    collateralAsset: {
      symbol: 'COMP',
      name: 'Compound',
      address: '0x8505b9d2254a7ae876c3cbb50a7cd71b7a8ddf81',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
    },
    tvl: 950000,
    apy: 11.9,
    leverage: 2,
    supplyCap: 400000,
    currentSupply: 280000,
    chainId: 137,
    chainName: 'Polygon',
    chainLogo: weETHLogo,
    baseYield: 7.5,
    borrowRate: 4.4,
  },
]

export const Default: Story = {
  args: {
    tokens: mockTokens,
  },
}

export const WithPagination: Story = {
  args: {
    tokens: mockTokens,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the leverage token table with pagination enabled. Since there are 12 tokens and the default page size is 10, you will see pagination controls at the bottom.',
      },
    },
  },
}

export const NoPagination: Story = {
  args: {
    tokens: mockTokens.slice(0, 3), // Only 3 tokens
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the leverage token table with only 3 tokens. The pagination footer will show the summary but hide the navigation buttons since pagination is not needed.',
      },
    },
  },
}

export const NoData: Story = {
  args: {
    tokens: [],
  },
}
