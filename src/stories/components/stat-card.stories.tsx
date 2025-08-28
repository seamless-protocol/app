import type { Meta, StoryObj } from '@storybook/react'
import { Activity, DollarSign, TrendingUp } from 'lucide-react'
import { StatCard } from '../../components/StatCard'

const meta = {
  title: 'Components/General/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A card component for displaying statistics with optional icon and caption.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title/label for the statistic',
    },
    stat: {
      control: 'text',
      description: 'The main statistic value to display',
    },
    caption: {
      control: 'text',
      description: 'Optional caption text below the stat',
    },
    icon: {
      control: false,
      description: 'Optional icon to display in the header',
    },
  },
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

// Basic variations
export const Basic: Story = {
  args: {
    title: 'Total Users',
    stat: '12,345',
  },
}

// With Icon (using larger icons to match figma)
export const WithIcon: Story = {
  args: {
    title: 'Revenue',
    stat: '$53,240',
    icon: <DollarSign />,
    iconBgClass: 'bg-green-500/20',
    iconTextClass: 'text-green-400',
  },
  parameters: {
    docs: {
      description: {
        story:
          'StatCard with green icon. Icons are automatically sized and styled to match figma design.',
      },
    },
  },
}

// With Caption
export const WithCaption: Story = {
  args: {
    title: 'Active Users',
    stat: '8,432',
    caption: <span className="text-green-400">+12% from last month</span>,
  },
  parameters: {
    docs: {
      description: {
        story: 'StatCard with green caption text showing positive growth.',
      },
    },
  },
}

// Complete Cards (Icon + Caption)
export const Complete: Story = {
  args: {
    title: 'Leverage Tokens',
    stat: '8',
    caption: 'Available now',
    icon: <TrendingUp />,
    iconBgClass: 'bg-blue-500/20',
    iconTextClass: 'text-blue-400',
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete StatCard with both blue icon and caption.',
      },
    },
  },
}

// Complex Stats (JSX content)
export const ComplexStats: Story = {
  args: {
    title: 'Total TVL',
    stat: (
      <div className="flex items-baseline gap-1">
        <span>$53.9M</span>
        <span className="text-sm text-green-500">+5.2%</span>
      </div>
    ),
    caption: 'Locked value',
    icon: <Activity />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'StatCard with complex JSX content including percentage changes and additional styling.',
      },
    },
  },
}
