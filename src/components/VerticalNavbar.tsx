import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronRight, Github, Menu } from 'lucide-react'
import type * as React from 'react'
import { useId, useRef, useState } from 'react'
import { prefetchMorphoVaultsMaxAPY } from '@/features/vaults/hooks/useMorphoVaultsAPY'
import { prefetchMorphoVaultsStats } from '@/features/vaults/hooks/useMorphoVaultsStats'
import { getRepoCommitUrl, getShortCommitHash } from '@/lib/config/buildInfo'
import { SeamlessLogo } from './icons'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet'
import { cn } from './ui/utils'

// Types
export interface NavigationItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  subtitle?: string
  badge?: string
  externalUrl?: string
}

interface SocialLink {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  url: string
}

interface CommunitySection {
  title: string
  links: Array<SocialLink>
}

interface NavbarProps {
  currentPage: string
  onPageChange: (page: string, options?: { externalUrl?: string }) => void
  navigationItems: Array<NavigationItem>
  communitySection: CommunitySection
  platformTVL: React.ReactNode
  isMobile?: boolean
}

// Animation variants
const navItemVariants = {
  rest: {
    x: 0,
    backgroundColor: 'var(--surface-card)',
    borderColor: 'var(--divider-line)',
    transition: { duration: 0.2 },
  },
  hover: {
    x: 8,
    backgroundColor: 'var(--surface-elevated)',
    borderColor: 'var(--brand-secondary)',
    transition: { duration: 0.2 },
  },
  active: {
    x: 4,
    backgroundColor: 'var(--surface-elevated)',
    borderColor: 'var(--brand-secondary)',
    transition: { duration: 0.2 },
  },
}

const iconVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 5, transition: { duration: 0.2 } },
  active: { scale: 1.05, transition: { duration: 0.2 } },
}

const chevronVariants = {
  rest: { x: -10, opacity: 0 },
  hover: { x: 0, opacity: 1, transition: { duration: 0.2 } },
  active: { x: 0, opacity: 1, transition: { duration: 0.2 } },
}

// Navigation Item Component
function NavigationItem({
  item,
  isActive,
  onClick,
  userAddress,
}: {
  item: NavigationItem
  isActive: boolean
  onClick: (options?: { externalUrl?: string }) => void
  userAddress?: string | null | undefined
}) {
  const Icon = item.icon
  const queryClient = useQueryClient()
  const prefetchedRef = useRef(false)

  const handleClick = () => {
    if (item.externalUrl) {
      onClick({ externalUrl: item.externalUrl })
      return
    }

    onClick()
  }

  const handleMouseEnter = () => {
    if (prefetchedRef.current) return
    // Prefetch Vaults stats/APY when hovering the Vaults tab
    if (item.id?.toLowerCase?.() === 'vaults') {
      prefetchedRef.current = true
      // Fire-and-forget; errors are fine to ignore for prefetching
      prefetchMorphoVaultsMaxAPY(queryClient).catch(() => {})
      prefetchMorphoVaultsStats(queryClient).catch(() => {})
    }
    // Prefetch portfolio cache on Portfolio hover
    if (item.id?.toLowerCase?.() === 'portfolio' && userAddress) {
      prefetchedRef.current = true
      prefetchPortfolioWarmup(queryClient, { address: userAddress, timeframe: '30D' }).catch(
        () => {},
      )
    }
  }

  return (
    <motion.button
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={cn(
        'w-full group relative rounded-xl border transition-all duration-200 cursor-pointer bg-card text-foreground',
        isActive
          ? 'border-brand-purple bg-accent text-foreground'
          : 'border-border hover:border-brand-purple hover:bg-accent hover:text-foreground',
      )}
      variants={navItemVariants}
      initial="rest"
      whileHover="hover"
      animate={isActive ? 'active' : 'rest'}
      whileTap={{ scale: 0.98 }}
      aria-label={`Navigate to ${item.title}. ${item.description}`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <motion.div
              variants={iconVariants}
              className={cn(
                'relative flex-shrink-0',
                isActive
                  ? 'text-brand-purple'
                  : 'text-secondary-foreground group-hover:text-brand-purple',
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center space-x-2">
                <h3 className={cn('font-medium text-sm sm:text-base truncate text-foreground')}>
                  {item.title}
                </h3>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 px-1.5 py-0.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p
                className={cn(
                  'text-xs mt-1 truncate',
                  isActive
                    ? 'text-foreground/85'
                    : 'text-foreground/85 group-hover:text-foreground',
                )}
              >
                {item.description}
              </p>
            </div>
          </div>

          <motion.div
            variants={chevronVariants}
            className={cn(
              'flex-shrink-0 ml-2',
              isActive
                ? 'text-brand-purple'
                : 'text-secondary-foreground group-hover:text-brand-purple',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-1/2 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
          style={{ height: '60%' }}
          initial={{ scaleY: 0, y: '-50%' }}
          animate={{ scaleY: 1, y: '-50%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}

// Social Link Component
function SocialLink({ social }: { social: SocialLink }) {
  const Icon = social.icon

  const handleClick = () => {
    window.open(social.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 group cursor-pointer bg-card border-border hover:border-brand-purple hover:bg-accent"
      aria-label={`Open ${social.name} in new tab`}
      title={social.name}
    >
      <Icon className="h-3.5 w-3.5 text-secondary-foreground group-hover:text-brand-purple transition-colors duration-200" />
    </button>
  )
}

// Navbar Content Component
function NavbarContent({
  currentPage,
  onPageChange,
  navigationItems,
  communitySection,
  platformTVL,
  className,
  isMobile = false,
  userAddress,
}: {
  currentPage: string
  onPageChange: (pageId: string, options?: { externalUrl?: string }) => void
  navigationItems: Array<NavigationItem>
  communitySection: CommunitySection
  platformTVL: React.ReactNode
  className?: string
  isMobile?: boolean
  userAddress?: string | null | undefined
}) {
  return (
    <motion.nav
      className={cn(
        'w-full flex flex-col',
        isMobile ? 'h-full border-0' : 'h-full border-r',
        'bg-card border-border',
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo Section */}
      <motion.div
        className="p-4 sm:p-6 border-b border-border"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="h-8 w-8 sm:h-10 sm:w-10"
            tabIndex={0}
          >
            <div className="relative size-full" data-name="Seamless Logo">
              <SeamlessLogo className="block size-full" />
            </div>
          </motion.div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              Seamless Protocol
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="text-muted-foreground">Platform TVL:</span>
              {typeof platformTVL === 'string' || typeof platformTVL === 'number' ? (
                <span className="text-foreground font-semibold">{platformTVL}</span>
              ) : (
                platformTVL
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Items */}
      <div className={cn('flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-4', isMobile && 'flex-1')}>
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              onClick={(options) => onPageChange(item.id, options)}
              userAddress={userAddress}
            />
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div
        className={cn(
          'px-3 sm:px-4 py-3 border-t border-[var(--nav-border)]',
          isMobile && 'mt-auto',
        )}
      >
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {communitySection.title}
          </h3>
          <div className="flex space-x-2">
            {communitySection.links.map((social) => (
              <SocialLink key={social.id} social={social} />
            ))}
          </div>
        </div>

        {/* Mobile Layout - Centered */}
        <div className="sm:hidden flex flex-col items-center space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {communitySection.title}
          </h3>
          <div className="flex space-x-2">
            {communitySection.links.map((social) => (
              <SocialLink key={social.id} social={social} />
            ))}
          </div>
        </div>
      </div>

      {/* Current Deployment Section */}
      <div className="p-4 sm:p-6 border-t border-[var(--nav-border)]">
        <div className="space-y-3">
          <div className="text-center">
            <a
              href={getRepoCommitUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs inline-flex items-center space-x-1 transition-colors duration-200 text-muted-foreground hover:text-brand-purple"
            >
              <Github className="h-3 w-3" />
              <span>
                Current Deployment{getShortCommitHash() ? ` @ ${getShortCommitHash()}` : ''}
              </span>
            </a>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

// Mobile hamburger button component
function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
        onClick={onClick}
        aria-label="Open mobile navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </motion.div>
  )
}

// Main Vertical Navbar Component
export function VerticalNavbar({
  currentPage,
  onPageChange,
  navigationItems,
  communitySection,
  platformTVL,
  isMobile = false,
}: NavbarProps) {
  const { address } = useAccount()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileNavDescriptionId = useId()

  const handlePageChange = (pageId: string, options?: { externalUrl?: string }) => {
    if (options?.externalUrl) {
      if (typeof window !== 'undefined') {
        window.open(options.externalUrl, '_blank', 'noopener,noreferrer')
      }
      setIsMobileMenuOpen(false)
      return
    }

    onPageChange(pageId, options)
    setIsMobileMenuOpen(false) // Close mobile menu when page changes
  }

  // Mobile view - only render hamburger button
  if (isMobile) {
    return (
      <>
        <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />

        {/* Mobile Navigation Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side="left"
            className="w-[280px] xs:w-[300px] sm:w-80 p-0 border bg-card border-border flex flex-col h-full"
            aria-describedby={mobileNavDescriptionId}
          >
            <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            <SheetDescription id={mobileNavDescriptionId} className="sr-only">
              Navigate through the Seamless Protocol application pages including Portfolio, Vaults,
              Leverage Tokens, Analytics, Staking, and Governance.
            </SheetDescription>

            <div className="flex-1 flex flex-col">
              <NavbarContent
                currentPage={currentPage}
                onPageChange={handlePageChange}
                navigationItems={navigationItems}
                communitySection={communitySection}
                platformTVL={platformTVL}
                isMobile={true}
                userAddress={address}
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop view - render full navbar
  return (
    <NavbarContent
      currentPage={currentPage}
      onPageChange={handlePageChange}
      navigationItems={navigationItems}
      communitySection={communitySection}
      platformTVL={platformTVL}
      className="h-screen"
      userAddress={address}
    />
  )
}
