import { motion } from 'framer-motion'
import { ChevronRight, Github, Menu } from 'lucide-react'
import type * as React from 'react'
import { useId, useState } from 'react'
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
  onPageChange: (page: string) => void
  navigationItems: Array<NavigationItem>
  communitySection: CommunitySection
  platformTVL: string
  isMobile?: boolean
}

// Animation variants
const navItemVariants = {
  rest: {
    x: 0,
    backgroundColor: 'var(--nav-surface)',
    borderColor: 'var(--nav-border)',
    transition: { duration: 0.2 },
  },
  hover: {
    x: 8,
    backgroundColor: 'var(--nav-surface-hover)',
    borderColor: 'var(--nav-border-active)',
    transition: { duration: 0.2 },
  },
  active: {
    x: 4,
    backgroundColor: 'var(--nav-surface-active)',
    borderColor: 'var(--nav-border-active)',
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

// Mobile menu animation variants
const mobileMenuVariants = {
  closed: {
    x: '-100%',
    transition: { duration: 0.3 },
  },
  open: {
    x: 0,
    transition: { duration: 0.4 },
  },
}

// Navigation Item Component
function NavigationItem({
  item,
  isActive,
  onClick,
}: {
  item: NavigationItem
  isActive: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full group relative rounded-xl border transition-all duration-200 cursor-pointer bg-[var(--nav-surface)] text-[var(--nav-text)]',
        isActive
          ? 'border-[var(--nav-border-active)] bg-[var(--nav-surface-active)] text-[var(--nav-text-active)]'
          : 'border-[var(--nav-border)] hover:border-[var(--nav-border-active)] hover:bg-[var(--nav-surface-hover)] hover:text-[var(--nav-text-active)]',
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
                  ? 'text-[var(--nav-icon-active)]'
                  : 'text-[var(--nav-icon-default)] group-hover:text-[var(--nav-icon-active)]',
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center space-x-2">
                <h3
                  className={cn(
                    'font-medium text-sm sm:text-base truncate',
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--nav-text)] group-hover:text-[var(--text-primary)]',
                  )}
                >
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
                    ? 'text-[var(--nav-text-active)]/85'
                    : 'text-[var(--nav-text-muted)] group-hover:text-[var(--nav-text)]',
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
                ? 'text-[var(--nav-icon-active)]'
                : 'text-[var(--nav-text-muted)] group-hover:text-[var(--nav-icon-active)]',
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
      className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 group cursor-pointer bg-[var(--nav-surface)] border-[var(--nav-border)] hover:border-[var(--nav-border-active)] hover:bg-[var(--nav-surface-hover)]"
      aria-label={`Open ${social.name} in new tab`}
      title={social.name}
    >
      <Icon className="h-3.5 w-3.5 text-[var(--nav-text-muted)] group-hover:text-[var(--nav-icon-active)] transition-colors duration-200" />
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
}: {
  currentPage: string
  onPageChange: (pageId: string) => void
  navigationItems: Array<NavigationItem>
  communitySection: CommunitySection
  platformTVL: string
  className?: string
}) {
  return (
    <motion.nav
      className={cn(
        'w-full border-r flex flex-col h-full',
        'bg-[var(--nav-surface)] border-[var(--nav-border)]',
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo Section */}
      <motion.div
        className="p-4 sm:p-6 border-b border-[var(--nav-border)]"
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
            <p className="text-xs text-[var(--nav-text-muted)] flex items-center gap-2">
              <span>Platform TVL:</span>
              {typeof platformTVL === 'string' || typeof platformTVL === 'number' ? (
                <span className="text-[var(--nav-text)] font-semibold">{platformTVL}</span>
              ) : (
                platformTVL
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              onClick={() => onPageChange(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-3 sm:px-4 py-3 border-t border-[var(--nav-border)]">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--nav-text-muted)]">
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
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--nav-text-muted)]">
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
              href="https://github.com/seamless-protocol/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs inline-flex items-center space-x-1 transition-colors duration-200 text-[var(--nav-text-muted)] hover:text-[var(--nav-icon-active)]"
            >
              <Github className="h-3 w-3" />
              <span>Current Deployment</span>
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
        className="p-2 h-10 w-10 text-[var(--nav-text)] hover:text-[var(--text-primary)] hover:bg-[var(--nav-surface-hover)]"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileNavDescriptionId = useId()

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId)
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
            className="w-[280px] xs:w-[300px] sm:w-80 p-0 border bg-[var(--nav-surface)] border-[var(--nav-border)]"
            aria-describedby={mobileNavDescriptionId}
          >
            <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            <SheetDescription id={mobileNavDescriptionId} className="sr-only">
              Navigate through the Seamless Protocol application pages including Portfolio, Vaults,
              Leverage Tokens, Analytics, Staking, and Governance.
            </SheetDescription>

            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate={isMobileMenuOpen ? 'open' : 'closed'}
            >
              <NavbarContent
                currentPage={currentPage}
                onPageChange={handlePageChange}
                navigationItems={navigationItems}
                communitySection={communitySection}
                platformTVL={platformTVL}
              />
            </motion.div>
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
    />
  )
}
