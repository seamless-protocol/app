import type { Meta, StoryObj } from '@storybook/react'
import { APYBreakdown, type APYBreakdownData } from '../../components/APYBreakdown'

const meta: Meta<typeof APYBreakdown> = {
  title: 'Components/APYBreakdown',
  component: APYBreakdown,
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
}

export default meta
type Story = StoryObj<typeof meta>

const mockAPYData: APYBreakdownData = {
  baseYield: 5.12,
  leverageMultiplier: 20,
  borrowCost: -3.67,
  rewardAPY: 2.55,
  points: 1096,
  totalAPY: 28.94,
}

const highAPYData: APYBreakdownData = {
  baseYield: 8.45,
  leverageMultiplier: 15,
  borrowCost: -4.21,
  rewardAPY: 3.89,
  points: 2340,
  totalAPY: 45.67,
}

const lowAPYData: APYBreakdownData = {
  baseYield: 2.34,
  leverageMultiplier: 5,
  borrowCost: -1.89,
  rewardAPY: 0.95,
  points: 234,
  totalAPY: 8.12,
}

export const Default: Story = {
  args: {
    data: mockAPYData,
  },
}

export const Compact: Story = {
  args: {
    data: mockAPYData,
    compact: true,
  },
}

export const HighAPY: Story = {
  args: {
    data: highAPYData,
  },
}

export const LowAPY: Story = {
  args: {
    data: lowAPYData,
  },
}
