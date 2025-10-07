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
  Leverage: [
    {
      label: 'Current Leverage',
      value: '12.34x',
      highlight: true,
      color: 'text-foreground',
    },
    {
      label: 'Min - Max Leverage',
      value: '8.00x - 20.00x',
      color: 'text-foreground',
    },
  ],
  Fees: [
    {
      label: 'Mint Token Fee',
      value: '0.25%',
      highlight: true,
      color: 'text-[var(--state-success-text)]',
      tooltip: 'Fee charged when minting new leverage tokens.',
    },
    {
      label: 'Redeem Token Fee',
      value: '0.10%',
      color: 'text-foreground',
      tooltip: 'Fee charged when redeeming leverage tokens.',
    },
  ],
  'Dutch Auction Parameters': [
    {
      label: 'Dutch Auction Duration',
      value: '4 hours',
      color: 'text-foreground',
    },
    {
      label: 'Initial Price Multiplier',
      value: '1.050x',
      color: 'text-foreground',
    },
  ],
  'Pre-liquidation': [
    {
      label: 'Pre-liquidation Leverage',
      value: '16.00x',
      color: 'text-foreground',
      tooltip: 'Leverage threshold that triggers pre-liquidation protection',
    },
    {
      label: 'Rebalance Reward',
      value: '0.35%',
      color: 'text-foreground',
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
