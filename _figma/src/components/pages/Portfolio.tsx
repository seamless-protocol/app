"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

import { 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Minus,
  ArrowUpRight,
  DollarSign,
  Target,
  Activity,
  Award,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  Shield,
  AlertTriangle,
  Settings,
  Info,
  Lock,
  Unlock,
  ExternalLink
} from "lucide-react"
import { AddFundsModal } from "../AddFundsModal"
import { BridgeSwapModal } from "../BridgeSwapModal"
import { RemoveFundsModal } from "../RemoveFundsModal"
import { ClaimModal } from "../ClaimModal"
import { StrategyDepositModal } from "../StrategyDepositModal"
import { StrategyWithdrawModal } from "../StrategyWithdrawModal"
import { StakeModal } from "../StakeModal"
import { ConnectionStatusCard } from "../ConnectionStatusCard"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Area, AreaChart } from "recharts"
import { Network } from "../NetworkSelector"
import { USDCLogo, EthereumLogo, weETHLogo as WeETHLogo, SEAMLogo } from "../ui/crypto-logos"
import { MorphoLogo } from "../icons/logos/MorphoLogo"

interface PortfolioProps {
  currentNetwork: Network
  isConnected: boolean
  onConnectWallet?: () => void
  onViewStrategy?: (strategyId: string) => void
  onNavigateToStaking?: () => void
}

// Mock portfolio data generator
const generatePortfolioData = () => {
  const baseValue = 61829
  const timePoints = 30
  
  return Array.from({ length: timePoints }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (timePoints - 1 - i))
    
    const variation = Math.sin(i * 0.3) * 0.1 + Math.random() * 0.05 - 0.025
    const value = baseValue * (1 + variation)
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value),
      earnings: Math.round(value * 0.08 / 365 * (i + 1)) // 8% APY simulation
    }
  })
}

export function Portfolio({ currentNetwork, isConnected, onConnectWallet, onViewStrategy, onNavigateToStaking }: PortfolioProps) {
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showBridgeSwapModal, setShowBridgeSwapModal] = useState(false)
  const [showRemoveFundsModal, setShowRemoveFundsModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [portfolioData, setPortfolioData] = useState(generatePortfolioData())
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')

  // Portfolio summary calculations
  const currentValue = portfolioData[portfolioData.length - 1]?.value || 0
  const previousValue = portfolioData[portfolioData.length - 2]?.value || 0
  const totalEarnings = portfolioData[portfolioData.length - 1]?.earnings || 0
  const changeAmount = currentValue - previousValue
  const changePercent = previousValue > 0 ? ((changeAmount / previousValue) * 100) : 0

  const timeframes = ['7D', '30D', '90D', '1Y']

  // Mock staking data
  const stakingData = {
    hasStakingPosition: true, // Toggle this to test both states
    stakedAmount: '1,247.83',
    stakingAPY: '15.67%',
    rewards: '82.34',
    totalStaked: '1,247.83',
    availableToStake: '247.83' // This comes from available rewards
  }

  // Render crypto logo component
  const renderAssetLogo = (asset: { symbol: string; logo: React.ComponentType<any> }, size: number = 32) => {
    const LogoComponent = asset.logo
    return <LogoComponent size={size} />
  }

  // Enhanced positions data with management information
  const positions = [
    {
      id: '1',
      asset: { symbol: 'USDC', logo: USDCLogo },
      strategy: 'Seamless USDC Vault',
      currentValue: '25,618.45',
      currentValueUSD: '$25,618.45',
      unrealizedGain: '+618.45',
      unrealizedGainUSD: '+$618.45',
      unrealizedGainPercent: '+2.47%',
      apy: '12.34%',
      apyBreakdown: {
        baseRate: '8.2%',
        rewards: '2.8%',
        compounding: '1.34%'
      },
      riskLevel: 'Low',
      riskColor: 'text-green-400',
      riskIcon: Shield,
      isPositive: true,
      category: 'Vaults'
    },
    {
      id: '2',
      asset: { symbol: 'WETH', logo: EthereumLogo },
      strategy: 'Seamless WETH Vault',
      currentValue: '8.72',
      currentValueUSD: '$21,276.80',
      unrealizedGain: '+0.22',
      unrealizedGainUSD: '+$536.80',
      unrealizedGainPercent: '+2.59%',
      apy: '8.92%',
      apyBreakdown: {
        baseRate: '6.1%',
        rewards: '1.9%',
        compounding: '0.92%'
      },
      riskLevel: 'Medium',
      riskColor: 'text-yellow-400',
      riskIcon: AlertTriangle,
      isPositive: true,
      category: 'Vaults'
    },
    {
      id: '3',
      asset: { symbol: 'weETH', logo: WeETHLogo },
      strategy: 'weETH / WETH 17x Leverage Token',
      currentValue: '6.12',
      currentValueUSD: '$14,932.80',
      unrealizedGain: '+0.62',
      unrealizedGainUSD: '+$1,512.80',
      unrealizedGainPercent: '+11.27%',
      apy: '18.67%',
      apyBreakdown: {
        baseRate: '12.4%',
        leverage: '4.8%',
        rewards: '1.47%'
      },
      riskLevel: 'High',
      riskColor: 'text-red-400',
      riskIcon: AlertTriangle,
      isPositive: true,
      category: 'Leverage Tokens'
    }
  ]

  // Handle position actions
  const handlePositionAction = (position: any, action: 'deposit' | 'withdraw') => {
    setSelectedPosition(position)
    if (action === 'deposit') {
      setShowDepositModal(true)
    } else {
      setShowWithdrawModal(true)
    }
  }

  // Risk and status color helpers
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  if (!isConnected) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-[500px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ConnectionStatusCard 
          onConnect={() => onConnectWallet?.()}
          className="max-w-2xl mx-auto"
        />
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Portfolio Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >

      </motion.div>

      {/* Portfolio Value Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/15 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-white mt-1">${currentValue.toLocaleString()}</p>
                <div className={`flex items-center text-sm mt-2 ${
                  changeAmount >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {changeAmount >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  ${Math.abs(changeAmount).toLocaleString()} ({changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-white mt-1">+${totalEarnings.toLocaleString()}</p>
                <p className="text-sm text-green-400 mt-2">+8.2% avg APY</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Active Positions</p>
                <p className="text-2xl font-bold text-white mt-1">{positions.length}</p>
                <p className="text-sm text-slate-400 mt-2">Across {positions.length} strategies</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Card className="bg-slate-900/80 border border-blue-600/40 shadow-[0_0_45px_rgba(37,99,235,0.12)]">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-slate-950 font-semibold">
                  M
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Where can I view/manage my Seamless Vaults?
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Your Seamless Vault (powered by Morpho) positions are now managed directly in the Morpho App. This includes depositing, withdrawing, and claiming any rewards earned from the Seamless Vaults on Morpho.
                  </p>
                </div>

                <div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
                    onClick={() => window.open('https://app.morpho.org/base/dashboard', '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Morpho App
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle className="text-white">Portfolio Performance</CardTitle>
              <div className="flex space-x-1">
                {timeframes.map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className="text-xs px-3 py-1"
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A16CFE" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A16CFE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B', fontSize: '12px' } }}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                    formatter={(value) => [`$${value?.toLocaleString()}`, 'Portfolio Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#A16CFE" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#portfolioGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Available Rewards & Staking Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Available Rewards - Left Half */}
        <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-400" />
              Available Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Accruing</span>
                <div className="flex items-center space-x-3">
                  {/* Overlapping cryptocurrency icons */}
                  <div className="flex items-center relative">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-900 relative z-10">
                      <USDCLogo size={24} />
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-900 relative -ml-2 z-20">
                      <EthereumLogo size={24} />
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-900 relative -ml-2 z-30">
                      <WeETHLogo size={24} />
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-900 relative -ml-2 z-40">
                      <SEAMLogo size={24} />
                    </div>
                  </div>
                  <span className="text-white font-semibold">$1,294.34</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">SEAM Tokens</span>
                <span className="text-white font-semibold">247.83 SEAM</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Protocol Fees</span>
                <span className="text-white font-semibold">$156.42</span>
              </div>
              <Button 
                onClick={() => setShowClaimModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white mt-2"
              >
                <Zap className="h-4 w-4 mr-2" />
                Claim All Rewards
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staking Module - Right Half */}
        <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <Lock className="h-5 w-5 mr-2 text-purple-400" />
              SEAM Staking
              <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                {stakingData.stakingAPY} APY
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stakingData.hasStakingPosition ? (
              /* User has staking position */
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Staked Amount</span>
                  <span className="text-white font-semibold">{stakingData.stakedAmount} SEAM</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Earned Rewards</span>
                  <span className="text-green-400 font-semibold">+{stakingData.rewards} SEAM</span>
                </div>
                <div className="flex justify-between items-center py-2 pb-4 border-b border-slate-700">
                  <span className="text-slate-400">APY</span>
                  <span className="text-purple-400 font-semibold">{stakingData.stakingAPY}</span>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    size="sm"
                    onClick={() => setShowStakeModal(true)}
                    className="bg-green-600 hover:bg-green-500 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Stake
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateToStaking?.()}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            ) : (
              /* User has no staking position */
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Lock className="h-12 w-12 text-purple-400 mx-auto mb-3 opacity-60" />
                  <p className="text-slate-400 text-sm mb-2">Start earning {stakingData.stakingAPY} APY by staking SEAM tokens</p>
                  <p className="text-xs text-slate-500">Secure the protocol and earn rewards</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Available to stake</span>
                    <span className="text-white">{stakingData.availableToStake} SEAM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Potential APY</span>
                    <span className="text-purple-400 font-medium">{stakingData.stakingAPY}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => setShowStakeModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Stake Now
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onNavigateToStaking?.()}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Learn More
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <MorphoLogo className="h-6 w-6" size={24} />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Where can I view/manage my Seamless Vaults?
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Your Seamless Vault (powered by Morpho) positions are now managed directly in the Morpho App. This includes depositing, withdrawing, and claiming any rewards earned from the Seamless Vaults on Morpho.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
                    onClick={() => window.open('https://app.morpho.org/base/dashboard', '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Morpho App
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      
      {/* Position Management Section - Integrated from ManagePositions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">

          <CardContent className="p-6">
            {/* Active Positions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Active Positions</h3>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {positions.length} Active Position{positions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <AnimatePresence>
                {positions.map((position, index) => (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => onViewStrategy?.(position.id)}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                      {/* Group 1: Strategy Info - Token image, title, tags */}
                      <div className="lg:col-span-4 flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center p-1 shrink-0">
                          {renderAssetLogo(position.asset, 32)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">{position.strategy}</h3>
                            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100 lg:hidden" />
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className={getRiskColor(position.riskLevel)}>
                              {position.riskLevel} Risk
                            </Badge>
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              {position.category}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Group 2: Performance Metrics - Current Value, Unrealized Gain, APY */}
                      <div className="lg:col-span-5 grid grid-cols-3 gap-4">
                        <div className="text-left">
                          <p className="text-xs text-slate-400">Current Value</p>
                          <p className="font-medium text-white">{position.currentValue} {position.asset.symbol}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{position.currentValueUSD}</p>
                        </div>
                        
                        <div className="text-left">
                          <p className="text-xs text-slate-400">Unrealized Gain</p>
                          <p className={`font-medium ${
                            position.unrealizedGain.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.unrealizedGain} {position.asset.symbol}
                          </p>
                          <p className={`text-xs ${
                            position.unrealizedGain.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.unrealizedGainPercent}
                          </p>
                        </div>
                        
                        <div className="text-left">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <div className="flex items-center">
                                  <p className="text-xs text-slate-400 mr-1">APY</p>
                                  <Info className="h-3 w-3 text-slate-400" />
                                </div>
                                <p className="font-medium text-purple-400">{position.apy}</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              className="bg-slate-800 border-slate-600 text-sm p-3 max-w-xs"
                            >
                              <div className="space-y-2">
                                <p className="font-medium text-white mb-2">APY Breakdown:</p>
                                {position.category === 'Leverage Tokens' ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Base Rate:</span>
                                      <span className="text-white">{position.apyBreakdown.baseRate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Leverage Multiplier:</span>
                                      <span className="text-white">{position.apyBreakdown.leverage}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Protocol Rewards:</span>
                                      <span className="text-white">{position.apyBreakdown.rewards}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Base Rate:</span>
                                      <span className="text-white">{position.apyBreakdown.baseRate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Protocol Rewards:</span>
                                      <span className="text-white">{position.apyBreakdown.rewards}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Auto-compounding:</span>
                                      <span className="text-white">{position.apyBreakdown.compounding}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Group 3: CTA Buttons */}
                      <div className="lg:col-span-3 flex items-center justify-start lg:justify-end space-x-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePositionAction(position, 'deposit')
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {position.category === 'Leverage Tokens' ? 'Mint' : 'Deposit'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePositionAction(position, 'withdraw')
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          {position.category === 'Leverage Tokens' ? 'Redeem' : 'Withdraw'}
                        </Button>
                        <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100 hidden lg:block ml-2" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
      />

      <BridgeSwapModal
        isOpen={showBridgeSwapModal}
        onClose={() => setShowBridgeSwapModal(false)}
      />

      <RemoveFundsModal
        isOpen={showRemoveFundsModal}
        onClose={() => setShowRemoveFundsModal(false)}
      />

      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />

      <StrategyDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        strategy={selectedPosition}
      />

      <StrategyWithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        strategy={selectedPosition}
      />

      <StakeModal
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
      />
    </motion.div>
  )
}
