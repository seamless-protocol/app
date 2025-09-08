import type { Meta, StoryObj } from '@storybook/react-vite'
import { LeverageTokenDetailedMetrics } from '@/features/leverage-tokens/components/LeverageTokenDetailedMetrics'

const meta = {
  title: 'Features/Leverage Tokens/LeverageTokenDetailedMetrics',
  component: LeverageTokenDetailedMetrics,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LeverageTokenDetailedMetrics>

export default meta
type Story = StoryObj<typeof meta>

const sampleMetrics = {
  'Leverage Settings': [
    {
      label: 'Current Leverage',
      value: '12.34x',
      highlight: true,
      color: 'text-white',
      tooltip: 'The current leverage ratio for this token.',
    },
    {
      label: 'Min - Max Leverage',
      value: '8.00x - 20.00x',
      color: 'text-white',
      tooltip: 'The minimum and maximum leverage range allowed.',
    },
  ],
  Fees: [
    {
      label: 'Mint Token Fee',
      value: '0.25%',
      highlight: true,
      color: 'text-green-400',
      tooltip: 'Fee charged when minting new leverage tokens.',
    },
    {
      label: 'Redeem Token Fee',
      value: '0.10%',
      color: 'text-white',
      tooltip: 'Fee charged when redeeming leverage tokens.',
    },
  ],
  'Auction Parameters': [
    {
      label: 'Dutch Auction Duration',
      value: '4 hours',
      color: 'text-white',
      tooltip: 'Duration of the Dutch auction for token redemptions.',
    },
    {
      label: 'Initial Price Multiplier',
      value: '1.050x',
      color: 'text-white',
      tooltip: 'Initial price multiplier for the auction.',
    },
  ],
  'Risk Management': [
    {
      label: 'Pre-liquidation Leverage',
      value: '16.00x',
      color: 'text-white',
      tooltip: 'Leverage threshold before liquidation is triggered.',
    },
    {
      label: 'Rebalance Reward',
      value: '0.35%',
      color: 'text-white',
      tooltip: 'Reward percentage for successful rebalancing.',
    },
  ],
}

export const Loading: Story = {
  render: () => (
    <LeverageTokenDetailedMetrics
      metrics={undefined}
      isLoading
      title="Token Details & Risk Parameters"
      description="Comprehensive leverage token parameters and settings"
      defaultOpen
    />
  ),
}

export const Default: Story = {
  render: () => (
    <LeverageTokenDetailedMetrics
      metrics={sampleMetrics}
      title="Token Details & Risk Parameters"
      description="Comprehensive leverage token parameters and settings"
      defaultOpen
    />
  ),
}

export const ErrorState: Story = {
  render: () => (
    <LeverageTokenDetailedMetrics
      metrics={undefined}
      isError
      title="Token Details & Risk Parameters"
      description="Comprehensive leverage token parameters and settings"
      defaultOpen
    />
  ),
}
