import type { Meta, StoryObj } from '@storybook/react-vite'
import { LeverageBadge } from '../../components/LeverageBadge'

const meta = {
  title: 'Components/Leverage/LeverageBadge',
  component: LeverageBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LeverageBadge>

export default meta
type Story = StoryObj<typeof meta>

export const AllSizes: Story = {
  args: {
    leverage: 17,
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Small:</span>
        <LeverageBadge {...args} size="sm" />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Medium:</span>
        <LeverageBadge {...args} size="md" />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Large:</span>
        <LeverageBadge {...args} size="lg" />
      </div>
    </div>
  ),
}
