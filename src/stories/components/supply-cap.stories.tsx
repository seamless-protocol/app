import type { Meta, StoryObj } from '@storybook/react-vite'
import { SupplyCap } from '../../components/SupplyCap'

const meta = {
  title: 'Components/Leverage/SupplyCap',
  component: SupplyCap,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SupplyCap>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentSupply: 750000,
    supplyCap: 1000000,
  },
  render: (args) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Default:</span>
        <SupplyCap {...args} />
      </div>
    </div>
  ),
}

export const AllVariations: Story = {
  args: {
    currentSupply: 750000,
    supplyCap: 1000000,
  },
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">0%:</span>
        <SupplyCap currentSupply={0} supplyCap={1000000} />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">50%:</span>
        <SupplyCap currentSupply={500000} supplyCap={1000000} />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">99%:</span>
        <SupplyCap currentSupply={990000} supplyCap={1000000} />
      </div>
    </div>
  ),
}
