import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BarChart3,
  BookOpen,
  Coins,
  Github,
  LayoutDashboard,
  MessageCircle,
  Search,
  Twitter,
  Vault,
  Vote,
} from 'lucide-react'
import { useState } from 'react'
import { VerticalNavbar } from '../../components/VerticalNavbar'

// Navigation configuration
const navigationItems = [
  {
    id: 'explore',
    title: 'Leverage Tokens',
    icon: Search,
    description: 'Discover leverage token opportunities',
  },
  {
    id: 'vaults',
    title: 'Vaults',
    icon: Vault,
    description: 'Secure yield strategies',
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    icon: LayoutDashboard,
    description: 'Overview and manage positions',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Track performance metrics',
  },
  {
    id: 'staking',
    title: 'Staking',
    icon: Coins,
    description: 'Stake SEAM tokens',
    badge: 'New',
  },
  {
    id: 'governance',
    title: 'Governance',
    icon: Vote,
    description: 'Participate in decisions',
  },
]

// Community section configuration
const communitySection = {
  title: 'Community',
  links: [
    {
      id: 'gitbook',
      name: 'GitBook',
      icon: BookOpen,
      url: 'https://docs.seamlessprotocol.com',
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: MessageCircle,
      url: 'https://discord.gg/seamlessprotocol',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com/seamlessprotocol',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/seamless-protocol',
    },
  ],
}

// Page content for dynamic display
const pageContent = {
  explore: {
    title: 'Leverage Tokens',
    subtitle: 'Discover & Trade',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  vaults: {
    title: 'Vaults',
    subtitle: 'Secure Strategies',
    content:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  },
  portfolio: {
    title: 'Portfolio',
    subtitle: 'Manage Positions',
    content:
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore.',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Deep Insights',
    content:
      'Et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
  },
  staking: {
    title: 'Staking',
    subtitle: 'Earn Rewards',
    content:
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
  },
  governance: {
    title: 'Governance',
    subtitle: 'Community Decisions',
    content:
      'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet.',
  },
}

// Wrapper component to handle state
function NavbarWrapper({ currentPage, isMobile }: { currentPage: string; isMobile?: boolean }) {
  const [page, setPage] = useState(currentPage)
  const content = pageContent[page as keyof typeof pageContent] || pageContent.portfolio

  return (
    <div className="h-screen flex">
      <div className="w-80 flex-shrink-0">
        <VerticalNavbar
          currentPage={page}
          onPageChange={setPage}
          navigationItems={navigationItems}
          communitySection={communitySection}
          platformTVL="$142.8M"
          isMobile={isMobile ?? false}
        />
      </div>
      <div className="flex-1 overflow-auto bg-slate-950 p-3 sm:p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{content.title}</h1>
            <p className="text-lg text-purple-400">{content.subtitle}</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-300 leading-relaxed">{content.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const meta = {
  title: 'Components/VerticalNavbar',
  component: NavbarWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NavbarWrapper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentPage: 'portfolio',
  },
}

export const Mobile: Story = {
  args: {
    currentPage: 'portfolio',
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
