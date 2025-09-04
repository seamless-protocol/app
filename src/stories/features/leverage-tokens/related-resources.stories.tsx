import type { Meta, StoryObj } from '@storybook/react-vite'
import { Building2, Coins, Globe, TrendingUp } from 'lucide-react'
import { RelatedResources } from '../../../features/leverage-tokens/components/RelatedResources'

const meta: Meta<typeof RelatedResources> = {
  title: 'Features/Leverage Tokens/RelatedResources',
  component: RelatedResources,
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
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    underlyingPlatforms: [
      {
        id: 'morpho',
        title: 'Morpho Lending Market',
        description: 'View the underlying lending market powering this leverage token',
        url: 'https://app.morpho.org/market?id=0x123...',
        icon: Building2,
        badge: {
          text: 'Primary Market',
          color: 'amber',
        },
        highlight: true,
      },
      {
        id: 'etherfi',
        title: 'Ether.fi Protocol',
        description: 'Learn more about the weETH liquid staking token',
        url: 'https://ether.fi/',
        icon: Globe,
        badge: {
          text: 'Protocol Info',
          color: 'blue',
        },
      },
    ],
    additionalRewards: [
      {
        id: 'etherfi-points',
        title: 'Ether.fi Points',
        description: 'Track your points and rewards from weETH staking activity',
        url: 'https://ether.fi/points',
        icon: Coins,
        badge: {
          text: 'Rewards Program',
          color: 'emerald',
        },
        highlight: true,
      },
      {
        id: 'merkl',
        title: 'Merkl Rewards',
        description: 'Additional DeFi rewards and incentive tracking',
        url: 'https://merkl.xyz/',
        icon: TrendingUp,
        badge: {
          text: 'Incentives',
          color: 'purple',
        },
      },
    ],
  },
}

export const Minimal: Story = {
  args: {
    underlyingPlatforms: [
      {
        id: 'morpho',
        title: 'Morpho Lending Market',
        description: 'View the underlying lending market powering this leverage token',
        url: 'https://app.morpho.org/market?id=0x123...',
        icon: Building2,
        badge: {
          text: 'Primary Market',
          color: 'amber',
        },
        highlight: true,
      },
    ],
    additionalRewards: [],
  },
}
