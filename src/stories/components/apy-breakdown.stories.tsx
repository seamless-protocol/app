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
  stakingYield: 5.12,
  restakingYield: 2.34,
  borrowRate: -3.67,
  rewardsAPR: 2.55,
  points: 1096,
  totalAPY: 6.34,
  errors: {},
}

const highAPYData: APYBreakdownData = {
  stakingYield: 8.45,
  restakingYield: 3.21,
  borrowRate: -4.21,
  rewardsAPR: 3.89,
  points: 2340,
  totalAPY: 11.34,
  errors: {},
}

const lowAPYData: APYBreakdownData = {
  stakingYield: 2.34,
  restakingYield: 1.12,
  borrowRate: -1.89,
  rewardsAPR: 0.95,
  points: 234,
  totalAPY: 2.52,
  errors: {},
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
