import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Address } from 'viem'
import { mainnet } from 'viem/chains'
import { WagmiProvider } from 'wagmi'
import { EthereumLogo, USDCLogo, weETHLogo } from '../../../components/icons/logos'
import { LeverageTokenTable } from '../../../features/leverage-tokens/components/leverage-token-table'
import { config } from '../../../lib/config/wagmi.config'

const queryClient = new QueryClient()

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

const mockTokens = [
  {
    address: '0xCd5fE23C85820F7B08D4D8A6c35929B5d900B527' as Address,
    name: 'weETH 2x Leverage Token',
    symbol: 'weETH2x',
    description: '2x leveraged weETH token',
    decimals: 18,
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether',
      description: 'Wrapped Ether token',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    leverageRatio: 2,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: EthereumLogo,
    tvl: 12500000,
    supplyCap: 1000000,
    currentSupply: 750000,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
    name: 'USDC 3x Leverage Token',
    symbol: 'USDC3X',
    description: '3x leveraged USDC token',
    decimals: 18,
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
      description: 'Wrapped Ether token',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' as Address,
      decimals: 18,
    },
    tvl: 8500000,
    leverageRatio: 3,
    supplyCap: 5000000,
    currentSupply: 3200000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: USDCLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 6n,
      },
    },
  },
  {
    address: '0xCd5fE23C85820F7B08D4D8A6c35929B5d900B527' as Address,
    name: 'weETH 1.5x Leverage Token',
    symbol: 'weETH1.5X',
    description: '1.5x leveraged weETH token',
    decimals: 18,
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether',
      description: 'Wrapped Ether token',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 3200000,
    leverageRatio: 1.5,
    supplyCap: 2000000,
    currentSupply: 1800000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: weETHLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' as Address,
    name: 'ETH 5x Leverage Token',
    symbol: 'ETH5x',
    description: '5x leveraged ETH token',
    decimals: 18,
    collateralAsset: {
      symbol: 'ETH',
      name: 'Ethereum',
      description: 'Ethereum native token',
      address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 4500000,
    leverageRatio: 5,
    supplyCap: 1500000,
    currentSupply: 1200000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: EthereumLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x4444444444444444444444444444444444444444' as Address,
    name: 'BTC 4x Leverage Token',
    symbol: 'BTC4X',
    description: '4x leveraged Bitcoin token',
    decimals: 18,
    collateralAsset: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      description: 'Wrapped Bitcoin token',
      address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6' as Address,
      decimals: 8,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 7800000,
    leverageRatio: 4,
    supplyCap: 3000000,
    currentSupply: 2500000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: USDCLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 8n,
      },
    },
  },
  {
    address: '0x5555555555555555555555555555555555555555' as Address,
    name: 'MATIC 2.5x Leverage Token',
    symbol: 'MATIC2.5X',
    description: '2.5x leveraged MATIC token',
    decimals: 18,
    collateralAsset: {
      symbol: 'MATIC',
      name: 'Polygon',
      description: 'Polygon native token',
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 2100000,
    leverageRatio: 2.5,
    supplyCap: 800000,
    currentSupply: 600000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: EthereumLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x6666666666666666666666666666666666666666' as Address,
    name: 'LINK 3.5x Leverage Token',
    symbol: 'LINK3.5X',
    description: '3.5x leveraged Chainlink token',
    decimals: 18,
    collateralAsset: {
      symbol: 'LINK',
      name: 'Chainlink',
      description: 'Chainlink oracle token',
      address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 3400000,
    leverageRatio: 3.5,
    supplyCap: 1200000,
    currentSupply: 900000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: USDCLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x7777777777777777777777777777777777777777' as Address,
    name: 'AAVE 2x Leverage Token',
    symbol: 'AAVE2X',
    description: '2x leveraged Aave token',
    decimals: 18,
    collateralAsset: {
      symbol: 'AAVE',
      name: 'Aave',
      description: 'Aave protocol token',
      address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 1800000,
    leverageRatio: 2,
    supplyCap: 600000,
    currentSupply: 450000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: weETHLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x2222222222222222222222222222222222222222' as Address,
    name: 'UNI 3x Leverage Token',
    symbol: 'UNI3X',
    description: '3x leveraged Uniswap token',
    decimals: 18,
    collateralAsset: {
      symbol: 'UNI',
      name: 'Uniswap',
      description: 'Uniswap governance token',
      address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 2900000,
    leverageRatio: 3,
    supplyCap: 1000000,
    currentSupply: 750000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: EthereumLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x1111111111111111111111111111111111111111' as Address,
    name: 'SUSHI 2.5x Leverage Token',
    symbol: 'SUSHI2.5X',
    description: '2.5x leveraged SushiSwap token',
    decimals: 18,
    collateralAsset: {
      symbol: 'SUSHI',
      name: 'SushiSwap',
      description: 'SushiSwap governance token',
      address: '0x0b3f868e0be5597d5db7feb9839de74c76867b58' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 1200000,
    leverageRatio: 2.5,
    supplyCap: 500000,
    currentSupply: 350000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: USDCLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
  {
    address: '0x3333333333333333333333333333333333333333' as Address,
    name: 'COMP 2x Leverage Token',
    symbol: 'COMP2X',
    description: '2x leveraged Compound token',
    decimals: 18,
    collateralAsset: {
      symbol: 'COMP',
      name: 'Compound',
      description: 'Compound governance token',
      address: '0x8505b9d2254a7ae876c3cbb50a7cd71b7a8ddf81' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c' as Address,
      decimals: 6,
    },
    tvl: 950000,
    leverageRatio: 2,
    supplyCap: 400000,
    currentSupply: 280000,
    chainId: mainnet.id,
    chainName: mainnet.name,
    chainLogo: weETHLogo,
    test: {
      mintIntegrationTest: {
        equityInCollateralAsset: 1n ** 18n,
      },
    },
  },
]

export const Default: Story = {
  args: {
    tokens: mockTokens,
    apyDataMap: new Map([
      [
        '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c',
        {
          stakingYield: 8.2,
          restakingYield: 2.1,
          borrowRate: -4.3,
          rewardsAPR: 1.5,
          points: 4,
          totalAPY: 7.5,
          errors: {},
        },
      ],
    ]),
    isApyLoading: false,
    isApyError: false,
  },
}

export const WithPagination: Story = {
  args: {
    tokens: mockTokens,
    apyDataMap: new Map([
      [
        '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c',
        {
          stakingYield: 8.2,
          restakingYield: 2.1,
          borrowRate: -4.3,
          rewardsAPR: 1.5,
          points: 4,
          totalAPY: 7.5,
          errors: {},
        },
      ],
    ]),
    isApyLoading: false,
    isApyError: false,
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
    apyDataMap: new Map([
      [
        '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c',
        {
          stakingYield: 8.2,
          restakingYield: 2.1,
          borrowRate: -4.3,
          rewardsAPR: 1.5,
          points: 4,
          totalAPY: 7.5,
          errors: {},
        },
      ],
    ]),
    isApyLoading: false,
    isApyError: false,
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
