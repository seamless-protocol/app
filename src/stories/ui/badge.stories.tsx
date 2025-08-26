import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../../components/ui/badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// Simple mock icon component
const MockIcon = ({ size, className }: { size?: number; className?: string }) => (
  <div className={`w-full h-full bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-medium ${className || ''}`}>
    T
  </div>
)

export const JustText: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
}

export const TextWithLogo: Story = {
  args: {
    children: 'ETH',
    logo: MockIcon,
    logoSize: 20,
  },
}

export const CustomBadge: Story = {
  args: {
    children: 'New',
    variant: 'secondary',
    className: 'text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 px-1.5 py-0.5',
  },
}
