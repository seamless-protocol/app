import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  BarChart3,
  BookOpen,
  Coins,
  Github,
  LayoutDashboard,
  Search,
  Vault,
  Vote,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo } from 'react'
import ReactGA from 'react-ga4'
import { useAccount } from 'wagmi'
import { usePortfolioPrefetch } from '@/features/portfolio/hooks/usePrefetchPortfolio'
import { useIdlePrefetch } from '@/hooks/useIdlePrefetch'
import { features } from '@/lib/config/features'
import { trackDeFiEvents } from '@/lib/config/ga4.config'
import { useDeFiLlamaProtocolTVL } from '@/lib/defillama/useProtocolTVL'
import { formatCurrency } from '@/lib/utils/formatting'
import { ConnectButtonTest } from './ConnectButtonTest'
import { DiscordIcon } from './icons/brands/discord-icon'
import { XLogo } from './icons/brands/x-logo'
import { LiFiWidget } from './LiFiWidget'
import { ModeToggle } from './mode-toggle'
import { PageContainer } from './PageContainer'
import { Skeleton } from './ui/skeleton'
import { Toaster } from './ui/sonner'
import { type NavigationItem, VerticalNavbar } from './VerticalNavbar'

const WalletConnectButton = lazy(() =>
  import('./WalletConnectButton').then((m) => ({ default: m.WalletConnectButton })),
)

// Navigation configuration that maps to existing routes
const navigationItems = [
  features.leverageTokens && {
    id: 'explore',
    title: 'Leverage Tokens',
    icon: Search,
    description: 'Explore leverage token strategies',
    subtitle: 'Explore Leverage Tokens that fit your yield and risk profile',
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
    subtitle: 'Stake SEAM tokens to earn protocol rewards',
    externalUrl: 'https://staking.seamlessprotocol.com/#/?tab=Staking',
  },
  features.governance && {
    id: 'governance',
    title: 'Governance',
    icon: Vote,
    description: 'Vote and shape proposals',
    subtitle: 'Participate in protocol governance and voting',
    externalUrl: 'https://staking.seamlessprotocol.com/#/governance',
  },
  // Place Vaults at the end of the list
  features.morphoVaults && {
    id: 'vaults',
    title: 'Vaults',
    icon: Vault,
    description: 'Secure yield strategies',
    subtitle: 'Secure yield strategies for your digital assets',
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
      icon: DiscordIcon,
      url: 'https://discord.gg/seamlessprotocol',
    },
    {
      id: 'x',
      name: 'X',
      icon: XLogo,
      url: 'https://x.com/SeamlessFi',
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
  explore: '/leverage-tokens',
  portfolio: '/portfolio',
  analytics: '/analytics',
  staking: '/staking',
  governance: '/governance',
  vaults: '/vaults',
}

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  useQueryClient() // initialize to ensure QueryClientProvider exists
  const { address, isConnected } = useAccount()
  const {
    data: defillamaData,
    isLoading: isProtocolTvlLoading,
    isError: isProtocolTvlError,
  } = useDeFiLlamaProtocolTVL()

  useEffect(() => {
    const measurementId = import.meta.env['VITE_GA4_MEASUREMENT_ID']
    if (!measurementId) {
      return
    }

    ReactGA.initialize(measurementId, {
      gaOptions: {
        debug_mode: import.meta.env['MODE'] === 'development',
      },
      gtagOptions: {
        debug_mode: import.meta.env['MODE'] === 'development',
      },
    })
  }, [])

  const tvlUsd = defillamaData?.tvl ?? 0

  // Track navigation between pages
  useEffect(() => {
    const currentPath = location.pathname
    const fromPage = document.referrer ? new URL(document.referrer).pathname : 'direct'
    trackDeFiEvents.navigation(fromPage, currentPath)
  }, [location.pathname])

  // Warm portfolio cache globally on wallet connect (30D default)
  usePortfolioPrefetch({
    address,
    enabled: isConnected,
    timeframe: '30D',
  })

  const platformTVL = useMemo(() => {
    if (isProtocolTvlLoading) {
      return <Skeleton as="span" className="inline-block h-3 w-16 align-middle" />
    }

    if (isProtocolTvlError) {
      return '--'
    }

    if (typeof tvlUsd === 'number' && Number.isFinite(tvlUsd)) {
      return formatCurrency(tvlUsd, {
        decimals: 2,
        thousandDecimals: 2,
        millionDecimals: 2,
      })
    }

    return '--'
  }, [isProtocolTvlError, isProtocolTvlLoading, tvlUsd])

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

  const handlePageChange = (pageId: string, options?: { externalUrl?: string }) => {
    if (options?.externalUrl) {
      if (typeof window !== 'undefined') {
        window.open(options.externalUrl, '_blank', 'noopener,noreferrer')
      }
      return
    }

    const route = routeMapping[pageId]
    if (route) {
      navigate({ to: route })
    }
  }

  // Prefetch wallet chunk on idle to reduce first-open latency
  useIdlePrefetch(() => import('./WalletConnectButton'), 300)

  return (
    <div className="h-screen flex overflow-hidden">
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
        <div className="border-b border-border bg-card backdrop-blur-sm shrink-0">
          <PageContainer className="py-3 sm:py-[19.2px]">
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
                  <p className="text-xs sm:text-sm text-secondary-foreground hidden sm:block truncate">
                    {navigationItems.find((item) => item.id === currentPage)?.subtitle ||
                      'Page description'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
                <LiFiWidget />
                {features.testMode ? (
                  <ConnectButtonTest />
                ) : (
                  <Suspense
                    fallback={
                      <button
                        type="button"
                        onMouseEnter={() => {
                          import('./WalletConnectButton').catch(() => {})
                        }}
                        onFocus={() => {
                          import('./WalletConnectButton').catch(() => {})
                        }}
                        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 rounded-md gap-1.5 has-[>svg]:px-2.5 h-9 px-3 sm:h-10 sm:px-4 cursor-pointer bg-cta-gradient text-[var(--cta-text)]"
                        aria-label="Connect Wallet"
                        title="Connect Wallet"
                      >
                        Connect
                      </button>
                    }
                  >
                    <WalletConnectButton />
                  </Suspense>
                )}
                <ModeToggle />
              </div>
            </div>
          </PageContainer>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {/* Use a shared container so all routes align with the top nav */}
          <PageContainer className="py-6">{children}</PageContainer>
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
