import type { Meta, StoryObj } from '@storybook/react'
import { EthereumLogo, USDCLogo, weETHLogo } from '../../components/icons/logos'
import { LeverageTokenTable } from '../../components/LeverageTokenTable'

const meta: Meta<typeof LeverageTokenTable> = {
  title: 'Components/LeverageToken/LeverageTokenTable',
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
  },
]

export const Default: Story = {
  args: {
    tokens: mockTokens,
  },
}

export const NoData: Story = {
  args: {
    tokens: [],
  },
}
