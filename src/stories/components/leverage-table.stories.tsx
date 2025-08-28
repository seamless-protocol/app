import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { BaseLogo, EthereumLogo } from '../../components/icons'
import { LeverageTable, type LeverageToken } from '../../components/LeverageTable'
import { Toaster } from '../../components/ui/sonner'
import { config } from '../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const mockLeverageTokens: Array<LeverageToken> = [
  {
    id: '1',
    name: 'SEAM / USDC 20x Leverage Token',
    collateralAsset: {
      symbol: 'SEAM',
      name: 'Seamless',
      address: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    tvl: 1800000,
    apy: 28.94,
    leverage: 20,
    supplyCap: 1000000,
    currentSupply: 972000,
    chainId: 8453,
    chainName: 'Base',
    chainLogo: BaseLogo,
  },
  {
    id: '2',
    name: 'cbETH / USDC 14x Leverage Token',
    collateralAsset: {
      symbol: 'cbETH',
      name: 'Coinbase ETH',
      address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    tvl: 3400000,
    apy: 26.34,
    leverage: 14,
    supplyCap: 3000,
    currentSupply: 2781,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
  },
  {
    id: '3',
    name: 'rETH / USDC 13x Leverage Token',
    collateralAsset: {
      symbol: 'rETH',
      name: 'Rocket Pool ETH',
      address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86a33E6441c8C7D077d8c2C72F7da6a7a7Dd0',
    },
    tvl: 2900000,
    apy: 24.61,
    leverage: 13,
    supplyCap: 2500,
    currentSupply: 2365,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
  },
  {
    id: '4',
    name: 'weETH / WETH 17x Leverage Token',
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped eETH',
      address: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
    },
    debtAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    tvl: 8900000,
    apy: 18.67,
    leverage: 17,
    supplyCap: 10000,
    currentSupply: 9650,
    chainId: 8453,
    chainName: 'Base',
    chainLogo: BaseLogo,
  },
]

const meta: Meta<typeof LeverageTable> = {
  title: 'Components/LeverageTable',
  component: LeverageTable,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <div className="p-4">
              <Story />
              <Toaster position="top-center" />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    tokens: mockLeverageTokens,
  },
}

export const NoData: Story = {
  args: {
    tokens: [],
  },
}
