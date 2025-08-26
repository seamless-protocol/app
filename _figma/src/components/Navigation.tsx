"use client"

import { motion } from "motion/react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { 
  LayoutDashboard, 
  Search, 
  BarChart3,
  Vote,
  Coins,
  Vault,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Twitter,
  Github,
  ExternalLink
} from "lucide-react"
import SeamlessLogo from "../imports/SeamlessLogo"

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  isMobile?: boolean
}

const navigationItems = [
  {
    id: 'explore',
    title: 'Leverage Tokens',
    icon: Search,
    description: 'Discover leverage token opportunities',
    shortcut: 'Alt+1'
  },
  {
    id: 'vaults',
    title: 'Vaults',
    icon: Vault,
    description: 'Secure yield strategies',
    shortcut: 'Alt+2'
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    icon: LayoutDashboard,
    description: 'Overview and manage positions',
    shortcut: 'Alt+3'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Track performance metrics',
    shortcut: 'Alt+4'
  },
  {
    id: 'staking',
    title: 'Staking',
    icon: Coins,
    description: 'Stake SEAM tokens',
    shortcut: 'Alt+5',
    badge: 'New'
  },
  {
    id: 'governance',
    title: 'Governance',
    icon: Vote,
    description: 'Participate in decisions',
    shortcut: 'Alt+6'
  }
]

const socialLinks = [
  {
    id: 'gitbook',
    name: 'GitBook',
    icon: BookOpen,
    url: 'https://docs.seamlessprotocol.com'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: MessageCircle,
    url: 'https://discord.gg/seamlessprotocol'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    url: 'https://twitter.com/seamlessprotocol'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    url: 'https://github.com/seamless-protocol'
  }
]

// Animation variants
const navItemVariants = {
  rest: { 
    x: 0,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    transition: { duration: 0.2 }
  },
  hover: { 
    x: 8,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    transition: { duration: 0.2 }
  },
  active: {
    x: 4,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    transition: { duration: 0.2 }
  }
}

const iconVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 5, transition: { duration: 0.2 } },
  active: { scale: 1.05, transition: { duration: 0.2 } }
}

const chevronVariants = {
  rest: { x: -10, opacity: 0 },
  hover: { x: 0, opacity: 1, transition: { duration: 0.2 } },
  active: { x: 0, opacity: 1, transition: { duration: 0.2 } }
}

export function Navigation({ currentPage, onPageChange, isMobile = false }: NavigationProps) {
  const handleSocialLinkClick = (url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.nav 
      className={`bg-slate-900 ${isMobile ? 'h-full' : 'h-screen'} w-full border-r border-slate-700 flex flex-col`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo Section - Mobile Optimized */}
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
          >
            <SeamlessLogo />
          </motion.div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Seamless</h2>
            <p className="text-xs text-slate-400">Protocol</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Items - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => {
            const isActive = currentPage === item.id
            const Icon = item.icon
            
            return (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              >
                <motion.button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full group relative rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'border-purple-500/30 bg-purple-500/10 text-white' 
                      : 'border-transparent hover:border-slate-600 text-slate-300 hover:text-white'
                  }`}
                  variants={navItemVariants}
                  initial="rest"
                  whileHover="hover"
                  animate={isActive ? "active" : "rest"}
                  whileTap={{ scale: 0.98 }}
                  aria-label={`Navigate to ${item.title}. ${item.description}. Keyboard shortcut: ${item.shortcut}`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <motion.div
                          variants={iconVariants}
                          className={`relative flex-shrink-0 ${
                            isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'
                          }`}
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </motion.div>
                        
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-medium text-sm sm:text-base truncate ${
                              isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                            }`}>
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
                          <p className={`text-xs mt-1 truncate ${
                            isActive ? 'text-purple-200' : 'text-slate-500 group-hover:text-slate-400'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      <motion.div
                        variants={chevronVariants}
                        className={`flex-shrink-0 ml-2 ${
                          isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
                      style={{ height: "60%" }}
                      initial={{ scaleY: 0, y: "-50%" }}
                      animate={{ scaleY: 1, y: "-50%" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  )}
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Social Links Section - Simplified */}
      <div className="px-3 sm:px-4 py-4 border-t border-slate-700">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
          Community
        </h3>
        
        <div className="flex justify-between space-x-2">
          {socialLinks.map((social) => {
            const Icon = social.icon
            
            return (
              <button
                key={social.id}
                onClick={() => handleSocialLinkClick(social.url, social.name)}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-200 group"
                aria-label={`Open ${social.name} in new tab`}
                title={social.name}
              >
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-purple-400 transition-colors duration-200" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer Section - Mobile Optimized */}
      <motion.div 
        className="p-4 sm:p-6 border-t border-slate-700"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-xs text-slate-500">Seamless Protocol v2.0</p>
            <p className="text-xs text-slate-500 mt-1">
              {isMobile ? 'Tap to navigate' : 'Use Alt+1-6 for quick access'}
            </p>
          </div>
          
          <motion.div
            className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700"
            whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.7)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">All Systems Operational</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.nav>
  )
}