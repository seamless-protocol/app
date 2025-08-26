"use client"

import { motion } from "motion/react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  Activity, 
  Shield,
  AlertTriangle,
  Star,
  ArrowRight,
  ExternalLink,
  Award,
  Lock,
  Coins,
  BarChart3,
  Target,
  Info
} from "lucide-react"

import type { RewardInfo, CuratorInfo, CollateralInfo } from "./data/mockStrategyData"

export interface Strategy {
  id: string
  name: string
  description: string
  apy: number
  tvl: string | number
  riskLevel: 'Low' | 'Medium' | 'High'
  category: string
  assets: Array<{
    symbol: string
    logo: React.ComponentType<any>
    allocation?: number
  }>
  isActive: boolean
  isPopular?: boolean
  participants?: number
  performance7d?: number
  // New fields for vault information
  curator?: CuratorInfo
  collateral?: CollateralInfo
  rewards?: RewardInfo
  // Leverage token information
  leverageToken?: {
    symbol: string
    leverageAmount: number
    collateralAsset: {
      symbol: string
      name: string
      logo: React.ComponentType<any>
    }
    debtAsset: {
      symbol: string
      name: string
      logo: React.ComponentType<any>
    }
    supplyCap: number
    currentSupply: number
    apyBreakdown: {
      baseYield: number
      leverageMultiplier: number
      borrowCost: number
      netAPY: number
    }
  }
}

interface StrategyCardProps {
  strategy: Strategy
  onViewStrategy: (strategyId: string) => void
  className?: string
}

// Animation variants
const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
}

const glowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
}

const contentVariants = {
  initial: { opacity: 0.8 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  }
}

const buttonVariants = {
  initial: { scale: 1, opacity: 0.9 },
  hover: {
    scale: 1.05,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
}

export function StrategyCard({ 
  strategy, 
  onViewStrategy,
  className = "" 
}: StrategyCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'Medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'High':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low':
        return Shield
      case 'Medium':
        return Activity
      case 'High':
        return AlertTriangle
      default:
        return Activity
    }
  }

  // Render crypto logo component
  const renderAssetLogo = (asset: { symbol: string; logo: React.ComponentType<any> }, size: number = 28) => {
    const LogoComponent = asset.logo
    return <LogoComponent size={size} />
  }

  const RiskIcon = getRiskIcon(strategy.riskLevel)
  const isVault = strategy.category === 'Vaults'
  const isLeverageToken = strategy.category === 'Leverage Tokens'
  
  // Format TVL for display
  const formatTVL = (tvl: string | number) => {
    if (typeof tvl === 'number') {
      return `${(tvl / 1000000).toFixed(1)}M`
    }
    return tvl
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className={`group relative h-full flex flex-col ${className}`}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-20"
        variants={glowVariants}
        initial="initial"
        whileHover="hover"
      />
      
      <Card 
        className="relative bg-slate-900/80 border-slate-700 hover:border-slate-600 
                   backdrop-blur-sm transition-all duration-300 h-full flex flex-col
                   shadow-lg hover:shadow-xl hover:shadow-purple-500/10 
                   w-full max-w-full overflow-hidden cursor-pointer
                   min-h-[420px] sm:min-h-[440px] max-h-[420px] sm:max-h-[440px]"
        onClick={() => onViewStrategy(strategy.id)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${strategy.name} strategy`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onViewStrategy(strategy.id)
          }
        }}
      >
        <CardHeader className="pb-3 flex-shrink-0 p-4 sm:p-6">
          {/* Strategy Title and Popular Badge */}
          <motion.div 
            className="flex items-start justify-between mb-3"
            variants={contentVariants}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-white truncate group-hover:text-purple-300 transition-colors duration-200">
                  {strategy.name}
                </h3>
                {strategy.isPopular && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs px-2 py-0.5 w-fit">
                    <Star className="w-2.5 h-2.5 mr-0.5" />
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-snug group-hover:text-slate-300 transition-colors duration-200 mb-0 line-clamp-2">
                {strategy.description}
              </p>
            </div>
          </motion.div>
          
          {/* Asset Logos and Risk Badge Row - Mobile Optimized */}
          <motion.div 
            className="flex items-center justify-between pt-3 border-t border-slate-800/50"
            variants={contentVariants}
          >
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-1.5 sm:-space-x-2">
                {strategy.assets.map((asset, index) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      x: 0,
                      transition: { 
                        delay: index * 0.1,
                        duration: 0.3 
                      }
                    }}
                    whileHover={{ 
                      scale: 1.2, 
                      zIndex: 10,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-slate-700 group-hover:border-slate-600 transition-colors duration-200 rounded-full bg-slate-800 flex items-center justify-center p-1">
                      {renderAssetLogo(asset, 24)}
                    </div>
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {strategy.assets.map(asset => asset.symbol).join(' / ')}
              </span>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`text-xs ${getRiskColor(strategy.riskLevel)} transition-all duration-200`}
              >
                <RiskIcon className="w-3 h-3 mr-1" />
                {strategy.riskLevel}
              </Badge>
            </motion.div>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 overflow-hidden min-h-0 p-4 sm:p-6 pt-0">
          {/* APY and TVL Prominent Display - Mobile Optimized */}
          <motion.div 
            className="grid grid-cols-2 gap-3"
            variants={contentVariants}
          >
            <div className="text-center py-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5"
              >
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">APY</p>
                <div className="text-lg sm:text-xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-200">
                  {strategy.apy.toFixed(2)}%
                </div>
                {isVault && strategy.rewards && (
                  <p className="text-xs text-slate-500 truncate">
                    {strategy.rewards.types.slice(0, 2).join(' + ')}
                  </p>
                )}
              </motion.div>
            </div>
            
            <div className="text-center py-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5"
              >
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">TVL</p>
                <div className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-200">
                  {formatTVL(strategy.tvl)}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Vault-Specific Information - Mobile Optimized */}
          {isVault && (strategy.curator || strategy.collateral) && (
            <motion.div 
              className="space-y-3 py-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg border border-purple-500/20"
              variants={contentVariants}
            >
              {/* Curator Information */}
              {strategy.curator && (
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400 font-medium">Curator</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">{strategy.curator.logo}</span>
                    <span className="text-sm font-semibold text-white">{strategy.curator.name}</span>
                  </div>
                </div>
              )}
              
              {/* Collateral Information */}
              {strategy.collateral && (
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400 font-medium">Collateral</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{strategy.collateral.type}</span>
                </div>
              )}
              
              {/* Reward Tokens */}
              {strategy.rewards && (
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400 font-medium">Rewards</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {strategy.rewards.tokens.slice(0, 2).map((token, index) => (
                      <span key={token} className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Leverage Token-Specific Information - Mobile Optimized */}
          {isLeverageToken && strategy.leverageToken && (
            <motion.div 
              className="space-y-3 py-3 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-lg border border-cyan-500/20"
              variants={contentVariants}
            >
              {/* Token Symbol & Leverage Amount */}
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 font-medium">Leverage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-slate-800 text-cyan-400 px-2 py-1 rounded font-mono">
                    {strategy.leverageToken.symbol}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {strategy.leverageToken.leverageAmount}x
                  </span>
                </div>
              </div>
              
              {/* Collateral & Debt Assets */}
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 font-medium">Assets</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full">
                    {strategy.leverageToken.collateralAsset.symbol}
                  </span>
                  <span className="text-xs text-slate-500">/</span>
                  <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">
                    {strategy.leverageToken.debtAsset.symbol}
                  </span>
                </div>
              </div>
              
              {/* Supply Cap Information */}
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 font-medium">Supply Cap</span>
                </div>
                {(() => {
                  const fillPercentage = (strategy.leverageToken.currentSupply / strategy.leverageToken.supplyCap) * 100;
                  const isNearCapacity = fillPercentage >= 90;
                  
                  return (
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1">
                        {isNearCapacity && (
                          <AlertTriangle className="w-3 h-3 text-warning-yellow" />
                        )}
                        <span className={`text-sm font-semibold ${isNearCapacity ? 'text-warning-yellow' : 'text-white'}`}>
                          {fillPercentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-500">filled</span>
                      </div>
                      <div className="w-16 bg-slate-700 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isNearCapacity 
                              ? 'bg-gradient-to-r from-warning-yellow to-error-red' 
                              : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                          }`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

        </CardContent>

      </Card>
    </motion.div>
  )
}