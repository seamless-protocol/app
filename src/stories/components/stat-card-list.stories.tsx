import type { Meta, StoryObj } from '@storybook/react'
import { Activity, DollarSign, Target, TrendingUp, Users, Zap } from 'lucide-react'
import { StatCard } from '../../components/StatCard'
import { StatCardList } from '../../components/StatCardList'

const meta = {
  title: 'Components/General/StatCardList',
  component: StatCardList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A responsive grid layout for displaying multiple StatCards with smart column distribution.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cards: {
      control: false,
      description: 'Array of StatCard props to render',
    },
    maxColumns: {
      control: { type: 'select' },
      options: [2, 3, 4],
      description: 'Maximum number of columns in the grid',
    },
  },
} satisfies Meta<typeof StatCardList>

export default meta
type Story = StoryObj<typeof meta>

// Sample card data
const sampleCards = [
  {
    title: 'Leverage Tokens',
    stat: '8',
    caption: 'Available now',
    icon: <Target className="h-4 w-4" />,
  },
  {
    title: 'Average APY',
    stat: '14.08%',
    caption: 'Across all leverage tokens',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: 'Total TVL',
    stat: '$53.9M',
    caption: 'Locked value',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Active Users',
    stat: '12,345',
    caption: '+12% this month',
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: 'Daily Volume',
    stat: '$2.4M',
    caption: '24h trading volume',
    icon: <Activity className="h-4 w-4" />,
  },
  {
    title: 'Network Health',
    stat: '99.9%',
    caption: 'Uptime this month',
    icon: <Zap className="h-4 w-4" />,
  },
]

// Two cards
export const TwoCards: Story = {
  args: {
    cards: sampleCards.slice(0, 2),
    maxColumns: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Two cards displayed in a responsive grid.',
      },
    },
  },
}

// Three cards
export const ThreeCards: Story = {
  args: {
    cards: [
      {
        title: 'Total Vaults',
        stat: '3',
        caption: 'Available now',
        icon: <Target />,
        iconBgClass: 'bg-purple-500/20',
        iconTextClass: 'text-purple-400',
      },
      {
        title: 'Average APY',
        stat: '10.61%',
        caption: (
          <div className="text-xs text-green-400 mt-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Across all vaults
          </div>
        ),
        icon: <TrendingUp />,
        iconBgClass: 'bg-green-500/20',
        iconTextClass: 'text-green-400',
      },
      {
        title: 'Total TVL',
        stat: '$96.0M',
        caption: 'Locked value',
        icon: <DollarSign />,
        iconBgClass: 'bg-cyan-500/20',
        iconTextClass: 'text-cyan-400',
      },
    ],
    maxColumns: 3,
  },
  render: (args) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {args.cards.map((card, index) => (
        <StatCard
          key={`${card.title}-${index}`}
          {...card}
          className={index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Three cards displayed exactly matching the figma design with proper responsive grid layout.',
      },
    },
  },
}

// Four cards
export const FourCards: Story = {
  args: {
    cards: sampleCards.slice(0, 4),
    maxColumns: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Four cards displayed in a responsive grid.',
      },
    },
  },
}

// Six cards (will display as 3x2 grid)
export const SixCards: Story = {
  args: {
    cards: sampleCards,
    maxColumns: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Six cards displayed in a 3-column grid (2 rows of 3).',
      },
    },
  },
}

// 3 cards per row maximum
export const ThreeCardsPerRow: Story = {
  args: {
    cards: sampleCards.slice(0, 4),
    maxColumns: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Four cards with maximum 3 cards per row (displays as 3+1 layout).',
      },
    },
  },
}

// 2 cards per row maximum
export const TwoCardsPerRow: Story = {
  args: {
    cards: sampleCards.slice(0, 4),
    maxColumns: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Four cards with maximum 2 cards per row (displays as 2+2 layout).',
      },
    },
  },
}
