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
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'success',
        'warning',
        'error',
        'info',
        'brand',
      ],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// Simple mock icon component
const MockIcon = ({ className }: { size?: number; className?: string }) => (
  <div
    className={`w-full h-full rounded-full border border-border bg-accent flex items-center justify-center text-xs font-medium text-foreground ${className || ''}`}
  >
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
    variant: 'brand',
    className: 'text-xs px-1.5 py-0.5',
  },
}

export const Success: Story = {
  args: {
    children: 'Connected',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
}

export const ErrorVariant: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
}

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
}

export const Brand: Story = {
  args: {
    children: 'SEAM',
    variant: 'brand',
  },
}
