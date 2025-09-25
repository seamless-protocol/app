import { useLocation, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
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
import { useProtocolTVL } from '@/features/leverage-tokens/hooks/useProtocolTVL'
import { features } from '@/lib/config/features'
import { formatCurrency } from '@/lib/utils/formatting'
import { ConnectButtonTest } from './ConnectButtonTest'
import { LiFiWidget } from './LiFiWidget'
import { ModeToggle } from './mode-toggle'
import { Toaster } from './ui/sonner'
import { type NavigationItem, VerticalNavbar } from './VerticalNavbar'
import { WalletConnectButton } from './WalletConnectButton'

// Navigation configuration that maps to existing routes
const navigationItems = [
  features.leverageTokens && {
    id: 'explore',
    title: 'Leverage Tokens',
    icon: Search,
    description: 'Discover leverage token opportunities',
    subtitle: 'Discover leverage token opportunities tailored to your goals',
  },
  features.morphoVaults && {
    id: 'vaults',
    title: 'Vaults',
    icon: Vault,
    description: 'Secure yield strategies',
    subtitle: 'Secure yield strategies for your digital assets',
  },
  features.portfolio && {
    id: 'portfolio',
    title: 'Portfolio',
    icon: LayoutDashboard,
    description: 'Overview and manage positions',
    subtitle: 'Overview of your supplied assets, earnings, rewards, and active positions',
  },
  features.analytics && {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Track performance metrics',
    subtitle: 'Track protocol metrics, portfolio performance, and market insights',
  },
  features.staking && {
    id: 'staking',
    title: 'Staking',
    icon: Coins,
    description: 'Stake SEAM tokens',
    badge: 'New',
    subtitle: 'Stake SEAM tokens to earn protocol rewards',
  },
  features.governance && {
    id: 'governance',
    title: 'Governance',
    icon: Vote,
    description: 'Participate in decisions',
    subtitle: 'Participate in protocol governance and voting',
  },
].filter(Boolean) as Array<NavigationItem>

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
  const {
    tvlUsd,
    isLoading: isProtocolTvlLoading,
    isError: isProtocolTvlError,
  } = useProtocolTVL()

  const platformTVL = useMemo(() => {
    if (isProtocolTvlLoading) return 'Loading...'
    if (isProtocolTvlError) return '--'
    if (typeof tvlUsd === 'number' && Number.isFinite(tvlUsd)) {
      return formatCurrency(tvlUsd, {
        decimals: 2,
        thousandDecimals: 2,
        millionDecimals: 2,
      })
    }
    return '--'
  }, [isProtocolTvlLoading, isProtocolTvlError, tvlUsd])

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
      {/* Vertical Navbar - Desktop Only */}
      <div className="hidden lg:block w-84 flex-shrink-0">
        <VerticalNavbar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          navigationItems={navigationItems}
          communitySection={communitySection}
          platformTVL={platformTVL}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-hero)] text-[var(--text-primary)]">
        {/* Top Bar with Actions */}
        <div className="border-b border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 95%,transparent)] backdrop-blur-sm shrink-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-[19.2px]">
            <div className="flex items-center justify-between">
              {/* Page Header with Mobile Menu */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                {/* Mobile Menu Button - Only visible on mobile */}
                <div className="lg:hidden">
                  <VerticalNavbar
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    navigationItems={navigationItems}
                    communitySection={communitySection}
                    platformTVL={platformTVL}
                    isMobile={true}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate">
                    {navigationItems.find((item) => item.id === currentPage)?.title || 'Page'}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] hidden sm:block truncate">
                    {navigationItems.find((item) => item.id === currentPage)?.subtitle ||
                      'Page description'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
                <LiFiWidget />
                {features.testMode ? <ConnectButtonTest /> : <WalletConnectButton />}
                <ModeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--divider-line)',
          },
        }}
        className="sm:!top-4 !top-2"
      />
    </div>
  )
}
