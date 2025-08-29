import type { Meta, StoryObj } from '@storybook/react'
import { LeverageTokenHoldingsCard } from '../../../features/leverage-tokens/components/LeverageTokenHoldingsCard'

const meta: Meta<typeof LeverageTokenHoldingsCard> = {
  title: 'Features/Leverage Tokens/LeverageTokenHoldingsCard',
  component: LeverageTokenHoldingsCard,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onMint: { action: 'mint clicked' },
    onRedeem: { action: 'redeem clicked' },
    onConnectWallet: { action: 'connect wallet clicked' },
    className: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockUserPositionConnectedNoHoldings = {
  hasPosition: false,
  balance: '0.00',
  balanceUSD: '$0.00',
  allTimePercentage: '0.0000',
  shareToken: 'WEETH-WETH-17x',
  isConnected: true,
}

const mockUserPositionConnectedWithHoldings = {
  hasPosition: true,
  balance: '2.45',
  balanceUSD: '$11,268.00',
  allTimePercentage: '+12.34',
  shareToken: 'WEETH-WETH-17x',
  isConnected: true,
}

const mockUserPositionDisconnected = {
  hasPosition: false,
  balance: '0.00',
  balanceUSD: '$0.00',
  allTimePercentage: '0.0000',
  shareToken: 'WEETH-WETH-17x',
  isConnected: false,
}

export const ConnectedNoHoldings: Story = {
  args: {
    userPosition: mockUserPositionConnectedNoHoldings,
  },
}

export const ConnectedWithHoldings: Story = {
  args: {
    userPosition: mockUserPositionConnectedWithHoldings,
  },
}

export const Disconnected: Story = {
  args: {
    userPosition: mockUserPositionDisconnected,
  },
}

export const LargeNumbers: Story = {
  args: {
    userPosition: {
      ...mockUserPositionConnectedWithHoldings,
      balance: '1,234.56',
      balanceUSD: '$5,678,901.23',
      allTimePercentage: '+456.78',
    },
  },
}
