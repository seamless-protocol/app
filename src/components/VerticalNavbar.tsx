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
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    transition: { duration: 0.2 },
  },
  hover: {
    x: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    transition: { duration: 0.2 },
  },
  active: {
    x: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
        'w-full group relative rounded-xl border transition-all duration-200 cursor-pointer',
        isActive
          ? 'border-purple-500/30 bg-purple-500/10 text-white'
          : 'border-transparent hover:border-slate-600 text-slate-300 hover:text-white',
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
                isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400',
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center space-x-2">
                <h3
                  className={cn(
                    'font-medium text-sm sm:text-base truncate',
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white',
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
                  isActive ? 'text-purple-200' : 'text-slate-500 group-hover:text-slate-400',
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
              isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400',
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
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-200 group cursor-pointer"
      aria-label={`Open ${social.name} in new tab`}
      title={social.name}
    >
      <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-400 transition-colors duration-200" />
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
        'bg-slate-900 w-full border-r border-slate-700 flex flex-col h-full',
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo Section */}
      <motion.div
        className="p-4 sm:p-6 border-b border-slate-700"
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
              <SeamlessLogo className="block size-full text-white" />
            </div>
          </motion.div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Seamless Protocol</h2>
            <p className="text-xs text-slate-400">Platform TVL: {platformTVL}</p>
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
      <div className="px-3 sm:px-4 py-3 border-t border-slate-700">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
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
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
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
      <div className="p-4 sm:p-6 border-t border-slate-700">
        <div className="space-y-3">
          <div className="text-center">
            <a
              href="https://github.com/seamless-protocol/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-purple-400 transition-colors duration-200 inline-flex items-center space-x-1"
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
        className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors p-2 h-10 w-10"
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
            className="w-[280px] xs:w-[300px] sm:w-80 p-0 bg-slate-900 border-slate-700"
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
