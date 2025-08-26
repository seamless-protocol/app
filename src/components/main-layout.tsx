'use client'

import { useLocation, useNavigate } from '@tanstack/react-router'
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
import { features } from '@/lib/config/features'
import { ConnectButtonTest } from './ConnectButtonTest'
import { ModeToggle } from './mode-toggle'
import { VerticalNavbar } from './vertical-navbar'
import { WalletConnectButton } from './WalletConnectButton'

// Navigation configuration that maps to existing routes
const navigationItems = [
  {
    id: 'explore',
    title: 'Leverage Tokens',
    icon: Search,
    description: 'Discover leverage token opportunities',
    subtitle: 'Discover leverage token opportunities tailored to your goals',
  },
  {
    id: 'vaults',
    title: 'Vaults',
    icon: Vault,
    description: 'Secure yield strategies',
    subtitle: 'Secure yield strategies for your digital assets',
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    icon: LayoutDashboard,
    description: 'Overview and manage positions',
    subtitle: 'Overview of your supplied assets, earnings, rewards, and active positions',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Track performance metrics',
    subtitle: 'Track protocol metrics, portfolio performance, and market insights',
  },
  {
    id: 'staking',
    title: 'Staking',
    icon: Coins,
    description: 'Stake SEAM tokens',
    badge: 'New',
    subtitle: 'Stake SEAM tokens to earn protocol rewards',
  },
  {
    id: 'governance',
    title: 'Governance',
    icon: Vote,
    description: 'Participate in decisions',
    subtitle: 'Participate in protocol governance and voting',
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

// Route mapping
const routeMapping: Record<string, string> = {
  explore: '/tokens',
  vaults: '/vaults',
  portfolio: '/portfolio',
  analytics: '/analytics',
  staking: '/staking',
  governance: '/governance',
}

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Determine current page from route
  const getCurrentPage = () => {
    const pathname = location.pathname
    for (const [pageId, route] of Object.entries(routeMapping)) {
      if (pathname === route || (route !== '/' && pathname.startsWith(route))) {
        return pageId
      }
    }
    return 'explore' // default to explore (leverage tokens)
  }

  const currentPage = getCurrentPage()

  const handlePageChange = (pageId: string) => {
    const route = routeMapping[pageId]
    if (route) {
      // biome-ignore lint/suspicious/noExplicitAny: route mapping is safe here
      navigate({ to: route as any })
    }
  }

  return (
    <div className="h-screen flex">
      {/* Vertical Navbar */}
      <div className="w-84 flex-shrink-0">
        <VerticalNavbar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          navigationItems={navigationItems}
          communitySection={communitySection}
          platformTVL="$142.8M"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Top Bar with Actions */}
        <div className="border-b border-slate-700 bg-slate-900 backdrop-blur-sm shrink-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Page Header */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-semibold text-white truncate">
                    {navigationItems.find((item) => item.id === currentPage)?.title || 'Page'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block truncate">
                    {navigationItems.find((item) => item.id === currentPage)?.subtitle ||
                      'Page description'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
                <ModeToggle />
                {features.testMode ? <ConnectButtonTest /> : <WalletConnectButton />}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
