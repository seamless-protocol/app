import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  LeverageTokenDetailedMetrics,
  type LeverageTokenMetrics,
} from '../../components/LeverageTokenDetailedMetrics'

const meta = {
  title: 'Components/LeverageToken/LeverageTokenDetailedMetrics',
  component: LeverageTokenDetailedMetrics,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LeverageTokenDetailedMetrics>

export default meta
type Story = StoryObj<typeof meta>

// Sample data for 17x leverage token
const leverage17xMetrics: LeverageTokenMetrics = {
  'Leverage Settings': [
    {
      label: 'Target Leverage',
      value: '17.00x',
      highlight: false,
      tooltip: 'The target leverage ratio of the token',
    },
    {
      label: 'Min - Max Leverage',
      value: '16.90x - 17.30x',
      highlight: false,
      tooltip: 'Allowed leverage range before rebalancing',
    },
  ],
  Fees: [
    {
      label: 'Mint Token Fee',
      value: '0.00%',
      highlight: true,
      color: 'text-green-400',
      tooltip: 'Fee charged when minting new leverage tokens',
    },
    {
      label: 'Redeem Token Fee',
      value: '0.10%',
      highlight: false,
      tooltip: 'Fee charged when redeeming leverage tokens',
    },
  ],
  'Auction Parameters': [
    {
      label: 'Dutch Auction Duration',
      value: '1 hour',
      highlight: false,
      tooltip: 'Duration of the Dutch auction process for rebalancing',
    },
    {
      label: 'Initial Price Multiplier',
      value: '1.01x',
      highlight: false,
      tooltip: 'Starting price multiplier for the Dutch auction',
    },
    {
      label: 'Min Price Multiplier',
      value: '0.99x',
      highlight: false,
      tooltip: 'Minimum price multiplier during Dutch auction',
    },
  ],
  'Risk Management': [
    {
      label: 'Pre-liquidation Leverage',
      value: '17.50x',
      highlight: false,
      tooltip: 'Leverage threshold that triggers liquidation protection',
    },
    {
      label: 'Rebalance Reward',
      value: '0.50%',
      highlight: false,
      tooltip: 'Reward for triggering pre-liquidation rebalance',
    },
  ],
}

// Sample data for 10x leverage token
const leverage10xMetrics: LeverageTokenMetrics = {
  'Leverage Settings': [
    {
      label: 'Target Leverage',
      value: '10.00x',
      highlight: false,
      tooltip: 'The current leverage ratio of the token',
    },
    {
      label: 'Target Leverage Range',
      value: '9.50x - 10.50x',
      highlight: false,
      tooltip: 'Target leverage range for this token',
    },
  ],
  Fees: [
    {
      label: 'Mint Fee',
      value: '0.05%',
      highlight: false,
      tooltip: 'Fee charged when minting new leverage tokens',
    },
    {
      label: 'Redeem Fee',
      value: '0.10%',
      highlight: false,
      tooltip: 'Fee charged when redeeming leverage tokens',
    },
    {
      label: 'Performance Fee',
      value: '15%',
      highlight: false,
      tooltip: 'Fee charged on profits above benchmark',
    },
  ],
  Operations: [
    {
      label: 'Rebalance Frequency',
      value: '4 hours',
      highlight: false,
      tooltip: 'Maximum time between rebalancing events',
    },
    {
      label: 'Liquidation Threshold',
      value: '11.00x',
      highlight: false,
      tooltip: 'Leverage threshold that triggers liquidation protection',
    },
  ],
}

export const Default: Story = {
  args: {
    metrics: leverage17xMetrics,
  },
  render: (args) => (
    <div className="w-full">
      <LeverageTokenDetailedMetrics {...args} />
    </div>
  ),
}

export const TenTimesLeverage: Story = {
  args: {
    metrics: leverage10xMetrics,
    title: '10x Leverage Token Metrics',
    description: 'Lower leverage token with different fee structure',
  },
  render: (args) => (
    <div className="w-full">
      <LeverageTokenDetailedMetrics {...args} />
    </div>
  ),
}

export const DefaultOpen: Story = {
  args: {
    metrics: leverage17xMetrics,
    defaultOpen: true,
  },
  render: (args) => (
    <div className="w-full">
      <LeverageTokenDetailedMetrics {...args} />
    </div>
  ),
}

export const CustomTitle: Story = {
  args: {
    metrics: leverage17xMetrics,
    title: 'Strategy Parameters',
    description: 'Detailed breakdown of all strategy settings and fees',
  },
  render: (args) => (
    <div className="w-full">
      <LeverageTokenDetailedMetrics {...args} />
    </div>
  ),
}
