"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "./components/Navigation"
import { Portfolio } from "./components/pages/Portfolio"
import { Vaults } from "./components/pages/Vaults"
import { ExploreStrategies } from "./components/pages/ExploreStrategies"
import { Analytics } from "./components/pages/Analytics"
import { Governance } from "./components/pages/Governance"
import { Staking } from "./components/pages/Staking"
import { ViewStrategy } from "./components/pages/ViewStrategy"
import { OnboardingModal } from "./components/OnboardingModal"
import { SettingsModal } from "./components/SettingsModal"
import { BridgeSwapModal } from "./components/BridgeSwapModal"
import { WalletConnectModal } from "./components/WalletConnectModal"
import { getStrategyData } from "./components/data/mockStrategyData"
import { NetworkSelector, getDefaultNetwork, Network } from "./components/NetworkSelector"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./components/ui/sheet"
import { SkipNavigation, LiveRegion, announceToScreenReader } from "./components/ui/accessibility"
import { Settings, Menu, Wallet, ArrowUpDown } from "lucide-react"
import { toast } from "sonner@2.0.3"
import { Toaster } from "sonner@2.0.3"
import { motion, AnimatePresence } from "motion/react"

// Animation variants for page transitions
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  in: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  out: { 
    opacity: 0, 
    y: -10,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.55, 0.06, 0.68, 0.19]
    }
  }
}

// Header animation variants
const headerVariants = {
  initial: { y: -60, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.1
    }
  }
}

// Mobile menu animation variants
const mobileMenuVariants = {
  closed: {
    x: "-100%",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  open: {
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('explore')
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null)
  const [previousPage, setPreviousPage] = useState<string>('explore') // Track the page user came from
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showBridgeSwap, setShowBridgeSwap] = useState(false)
  const [showWalletConnect, setShowWalletConnect] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [currentNetwork, setCurrentNetwork] = useState<Network>(getDefaultNetwork())
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const mainContentRef = useRef<HTMLElement>(null)

  // Handle successful wallet connection
  const handleConnectWallet = (address: string) => {
    setWalletAddress(address)
    setIsConnected(true)
    setShowWalletConnect(false)
    
    announceToScreenReader('Wallet connected successfully', 'assertive')
  }

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    toast.success(`Switched to ${!isDarkMode ? 'dark' : 'light'} mode`)
    
    // Apply theme class to document root
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Handle wallet disconnect
  const handleDisconnectWallet = () => {
    setWalletAddress('')
    setIsConnected(false)
    announceToScreenReader('Wallet disconnected', 'assertive')
  }

  // Apply theme on initial load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Handle network switching with accessibility announcements
  const handleNetworkChange = async (network: Network) => {
    setIsNetworkSwitching(true)
    setAnnouncement(`Switching to ${network.displayName} network...`)
    
    try {
      // Simulate network switching delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setCurrentNetwork(network)
      const successMessage = `Successfully switched to ${network.displayName} network`
      setAnnouncement(successMessage)
      
      toast.success(`Switched to ${network.displayName}`, {
        description: `You are now connected to ${network.displayName} network`
      })
      
      // Announce to screen readers
      announceToScreenReader(successMessage, "assertive")
      
    } catch (error) {
      const errorMessage = 'Failed to switch network. Please try again or check your wallet connection.'
      setAnnouncement(errorMessage)
      
      toast.error('Failed to switch network', {
        description: 'Please try again or check your wallet connection'
      })
      
      announceToScreenReader(errorMessage, "assertive")
      console.error('Network switch failed:', error)
    } finally {
      setIsNetworkSwitching(false)
      // Clear announcement after delay
      setTimeout(() => setAnnouncement(''), 3000)
    }
  }

  // Handle Bridge/Swap modal with accessibility
  const handleOpenBridgeSwap = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        description: 'You need to connect a wallet to use swap and bridge features'
      })
      return
    }
    
    setShowBridgeSwap(true)
    announceToScreenReader('Opening swap and bridge interface', 'polite')
  }

  // Function to navigate to strategy view with accessibility and breadcrumb tracking
  const handleViewStrategy = (strategyId: string) => {
    setPreviousPage(currentPage) // Track where user came from
    setSelectedStrategyId(strategyId)
    setCurrentPage('view-strategy')
    setIsMobileMenuOpen(false)
    
    // Announce navigation to screen readers
    announceToScreenReader('Navigating to strategy details page', 'polite')
    
    // Focus main content after navigation
    setTimeout(() => {
      mainContentRef.current?.focus()
    }, 100)
  }

  // Function to go back from strategy view with accessibility
  const handleBackFromStrategy = () => {
    setSelectedStrategyId(null)
    setCurrentPage(previousPage) // Go back to the page user came from
    
    // Announce navigation to screen readers
    const pageInfo = getPageInfo(previousPage)
    announceToScreenReader(`Navigating back to ${pageInfo.title}`, 'polite')
    
    // Focus main content after navigation
    setTimeout(() => {
      mainContentRef.current?.focus()
    }, 100)
  }

  // Function to navigate to specific page from breadcrumb
  const handleNavigateToPage = (page: string) => {
    setCurrentPage(page)
    setSelectedStrategyId(null)
    setIsMobileMenuOpen(false)
    
    // Announce navigation to screen readers
    const pageInfo = getPageInfo(page)
    announceToScreenReader(`Navigated to ${pageInfo.title} page`, 'polite')
    
    // Focus main content after navigation
    setTimeout(() => {
      mainContentRef.current?.focus()
    }, 100)
  }

  // Handle page change with accessibility enhancements and animations
  const handlePageChange = (page: string) => {
    if (page === currentPage) return
    
    setIsPageTransitioning(true)
    
    // Small delay for transition effect
    setTimeout(() => {
      const pageInfo = getPageInfo(page)
      setCurrentPage(page)
      setIsMobileMenuOpen(false)
      setIsPageTransitioning(false)
      
      // Announce page change to screen readers
      announceToScreenReader(`Navigated to ${pageInfo.title} page: ${pageInfo.description}`, 'polite')
      
      // Focus main content after navigation
      setTimeout(() => {
        mainContentRef.current?.focus()
      }, 100)
    }, 150)
  }

  // Keyboard shortcuts for navigation - Updated order: Leverage Tokens, Vaults, Portfolio, Analytics, Staking, Governance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger shortcuts when Alt is pressed and not in input fields
      if (!e.altKey || (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key) {
        case '1':
          e.preventDefault()
          handlePageChange('explore')
          break
        case '2':
          e.preventDefault()
          handlePageChange('vaults')
          break
        case '3':
          e.preventDefault()
          handlePageChange('portfolio')
          break
        case '4':
          e.preventDefault()
          handlePageChange('analytics')
          break
        case '5':
          e.preventDefault()
          handlePageChange('staking')
          break
        case '6':
          e.preventDefault()
          handlePageChange('governance')
          break
        case 's':
          e.preventDefault()
          handleOpenBridgeSwap()
          break
        case 'm':
          e.preventDefault()
          setIsMobileMenuOpen(!isMobileMenuOpen)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, isMobileMenuOpen, isConnected])

  const renderCurrentPage = () => {
    const pageComponent = (() => {
      switch (currentPage) {
        case 'portfolio':
          return (
            <Portfolio 
              currentNetwork={currentNetwork}
              isConnected={isConnected}
              onConnectWallet={() => setShowWalletConnect(true)}
              onViewStrategy={handleViewStrategy}
              onNavigateToStaking={() => handlePageChange('staking')}
            />
          )
        case 'vaults':
          return <Vaults onViewStrategy={handleViewStrategy} />
        case 'explore':
          return <ExploreStrategies onViewStrategy={handleViewStrategy} />
        case 'analytics':
          return <Analytics />
        case 'governance':
          return <Governance />
        case 'staking':
          return <Staking />
        case 'view-strategy':
          return (
            <ViewStrategy 
              strategyId={selectedStrategyId || undefined}
              onBack={handleBackFromStrategy}
              previousPage={previousPage}
              onNavigateToPage={handleNavigateToPage}
              isConnected={isConnected}
              onConnectWallet={() => setShowWalletConnect(true)}
            />
          )
        default:
          return <ExploreStrategies onViewStrategy={handleViewStrategy} />
      }
    })()

    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          className="w-full h-full"
        >
          {pageComponent}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Get page title and description - Updated navigation order
  const getPageInfo = (page?: string) => {
    const targetPage = page || currentPage
    
    switch (targetPage) {
      case 'portfolio':
        return {
          title: 'Portfolio',
          description: 'Overview of your supplied assets, earnings, rewards, and active positions'
        }
      case 'vaults':
        return {
          title: 'Vaults',
          description: 'Secure yield strategies for your digital assets'
        }
      case 'explore':
        return {
          title: 'Leverage Tokens',
          description: 'Discover leverage token opportunities tailored to your goals'
        }
      case 'analytics':
        return {
          title: 'Analytics',
          description: 'Track protocol metrics, portfolio performance, and market insights'
        }
      case 'governance':
        return {
          title: 'Governance',
          description: 'Participate in protocol governance and voting'
        }
      case 'staking':
        return {
          title: 'Staking',
          description: 'Stake SEAM tokens to earn protocol rewards'
        }
      case 'view-strategy':
        // Get strategy data to show actual strategy name for both leverage tokens and vaults
        if (selectedStrategyId) {
          const strategyData = getStrategyData(selectedStrategyId)
          const isLeverageToken = strategyData.category === 'Leverage Tokens'
          return {
            title: strategyData.name,
            description: isLeverageToken ? 'Amplified exposure to asset pairs with automated position management and liquidation protection' : `Detailed information about ${strategyData.name}`
          }
        }
        return {
          title: 'Strategy Details',
          description: 'Detailed information about this strategy'
        }
      default:
        return {
          title: 'Leverage Tokens',
          description: 'Discover leverage token opportunities tailored to your goals'
        }
    }
  }

  const pageInfo = getPageInfo()

  return (
    <>
      {/* Skip Navigation Links */}
      <SkipNavigation />
      
      {/* Live Region for Screen Reader Announcements */}
      <LiveRegion priority="assertive">
        {announcement}
      </LiveRegion>
      
      {/* Main Application */}
      <motion.div 
        className="flex h-screen bg-slate-950 text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Desktop Left Navigation */}
        <motion.aside 
          className="hidden lg:block"
          aria-label="Main navigation"
          role="navigation"
          id="navigation"
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2
          }}
        >
          <Navigation 
            currentPage={currentPage} 
            onPageChange={handlePageChange}
          />
        </motion.aside>
        
        {/* Mobile Navigation Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-[280px] xs:w-[300px] sm:w-80 p-0 bg-slate-900 border-slate-700"
            aria-describedby="mobile-nav-description"
          >
            <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            <SheetDescription id="mobile-nav-description" className="sr-only">
              Navigate through the Seamless Protocol application pages including Portfolio, Vaults, Leverage Tokens, Analytics, Staking, and Governance. Use Alt+1 through Alt+6 for keyboard shortcuts, or Alt+M to toggle this menu.
            </SheetDescription>
            
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate={isMobileMenuOpen ? "open" : "closed"}
            >
              <Navigation 
                currentPage={currentPage} 
                onPageChange={handlePageChange}
                isMobile={true}
              />
            </motion.div>
          </SheetContent>
        </Sheet>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header - Mobile Optimized */}
          <motion.header 
            className="border-b border-slate-700 bg-slate-900 backdrop-blur-sm shrink-0"
            role="banner"
            aria-label="Application header"
            variants={headerVariants}
            initial="initial"
            animate="animate"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                  {/* Mobile Menu Button - Enhanced */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 transition-colors p-2 h-10 w-10"
                      onClick={() => setIsMobileMenuOpen(true)}
                      aria-label="Open mobile navigation menu (Alt+M)"
                      aria-expanded={isMobileMenuOpen}
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </motion.div>
                  
                  {/* Page Title and Description */}
                  <motion.div 
                    className="min-w-0 flex-1"
                    key={pageInfo.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 
                      className="text-base sm:text-lg font-semibold text-white truncate"
                      id="page-title"
                    >
                      {pageInfo.title}
                    </h1>
                    <p 
                      className="text-xs sm:text-sm text-slate-400 hidden sm:block truncate"
                      id="page-description"
                    >
                      {pageInfo.description}
                    </p>
                  </motion.div>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
                  {/* Network Selector - Hidden on mobile, show on tablet+ */}
                  <motion.div 
                    className="hidden md:block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <NetworkSelector 
                      currentNetwork={currentNetwork}
                      isConnecting={isNetworkSwitching}
                    />
                  </motion.div>
                  
                  {/* Bridge/Swap Button - New Global Feature */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenBridgeSwap}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors px-3 h-9 sm:h-10 border border-slate-700 hover:border-purple-500/50"
                      aria-label="Open swap and bridge interface (Alt+S)"
                      title="Swap & Bridge"
                    >
                      <ArrowUpDown className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline font-medium">Swap/Bridge</span>
                    </Button>
                  </motion.div>
                  
                  {/* Wallet Connect Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(true)}
                        className="h-9 sm:h-10 bg-slate-800 hover:bg-slate-700 border-slate-600"
                      >
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4 text-green-500" />
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-slate-700 text-white hidden sm:inline-flex"
                          >
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </Badge>
                        </div>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowWalletConnect(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 h-9 px-3 sm:h-10 sm:px-4"
                        size="sm"
                      >
                        <Wallet className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Connect Wallet</span>
                      </Button>
                    )}
                  </motion.div>
                  
                  {/* Settings Button - Always visible */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSettings(true)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors p-2 h-9 w-9 sm:h-10 sm:w-10"
                      aria-label="Open settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.header>
          
          {/* Main Content - Mobile Optimized */}
          <main 
            className="flex-1 overflow-auto bg-slate-950"
            id="main-content"
            role="main"
            aria-labelledby="page-title"
            aria-describedby="page-description"
            tabIndex={-1}
            ref={mainContentRef}
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
              {renderCurrentPage()}
            </div>
          </main>
        </div>
        
        {/* Wallet Connect Modal */}
        <WalletConnectModal
          isOpen={showWalletConnect}
          onClose={() => setShowWalletConnect(false)}
          onConnect={handleConnectWallet}
        />
        
        {/* Bridge/Swap Modal - Global Access */}
        <BridgeSwapModal
          isOpen={showBridgeSwap}
          onClose={() => setShowBridgeSwap(false)}
        />
        
        {/* Onboarding Modal - Mobile Optimized */}
        <OnboardingModal 
          isOpen={showOnboarding}
          onClose={() => {
            setShowOnboarding(false)
            localStorage.setItem('seamless-onboarding-seen', 'true')
          }}
        />
        
        {/* Settings Modal - Mobile Optimized */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          walletAddress={walletAddress}
          isDarkMode={isDarkMode}
          onThemeToggle={handleThemeToggle}
          onDisconnectWallet={handleDisconnectWallet}
          isWalletConnected={isConnected}
        />
        
        {/* Toast Notifications - Mobile Positioned */}
        <Toaster 
          position="top-center" 
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--divider-line)',
            },
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
          }}
          className="sm:!top-4 !top-2"
        />
      </motion.div>
    </>
  )
}

export default function App() {
  return <AppContent />
}