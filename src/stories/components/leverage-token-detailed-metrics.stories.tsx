import type { Meta, StoryObj } from '@storybook/react-vite'
import { LeverageTokenDetailedMetrics } from '../../components/LeverageTokenDetailedMetrics'

const meta: Meta<typeof LeverageTokenDetailedMetrics> = {
  title: 'Components/LeverageToken/LeverageTokenDetailedMetrics',
  component: LeverageTokenDetailedMetrics,
  parameters: {
    layout: 'padded',
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
  tags: ['autodocs'],
} satisfies Meta<typeof LeverageTokenDetailedMetrics>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    leverageSettings: {
      targetLeverage: 17.0,
      minMaxLeverage: {
        min: 16.9,
        max: 17.3,
      },
    },
    fees: {
      mintTokenFee: 0.0,
      redeemTokenFee: 0.1,
    },
    auctionParameters: {
      dutchAuctionDuration: '1 hour',
      initialPriceMultiplier: 1.01,
      minPriceMultiplier: 0.99,
    },
    riskManagement: {
      preLiquidationLeverage: 17.5,
      rebalanceReward: 0.5,
    },
  },
}

export const HighLeverage: Story = {
  args: {
    leverageSettings: {
      targetLeverage: 25.0,
      minMaxLeverage: {
        min: 24.5,
        max: 25.5,
      },
    },
    fees: {
      mintTokenFee: 0.05,
      redeemTokenFee: 0.15,
    },
    auctionParameters: {
      dutchAuctionDuration: '30 minutes',
      initialPriceMultiplier: 1.02,
      minPriceMultiplier: 0.98,
    },
    riskManagement: {
      preLiquidationLeverage: 26.0,
      rebalanceReward: 0.75,
    },
  },
}

export const LowLeverage: Story = {
  args: {
    leverageSettings: {
      targetLeverage: 2.0,
      minMaxLeverage: {
        min: 1.95,
        max: 2.05,
      },
    },
    fees: {
      mintTokenFee: 0.0,
      redeemTokenFee: 0.05,
    },
    auctionParameters: {
      dutchAuctionDuration: '2 hours',
      initialPriceMultiplier: 1.005,
      minPriceMultiplier: 0.995,
    },
    riskManagement: {
      preLiquidationLeverage: 2.2,
      rebalanceReward: 0.25,
    },
  },
}
