"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

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
  CheckCircle,
  Clock,
  MoreHorizontal
} from "lucide-react"
import { AddFundsModal } from "../AddFundsModal"
import { BridgeSwapModal } from "../BridgeSwapModal"
import { RemoveFundsModal } from "../RemoveFundsModal"
import { ClaimModal } from "../ClaimModal"
import { StrategyDepositModal } from "../StrategyDepositModal"
import { StrategyWithdrawModal } from "../StrategyWithdrawModal"
import { ConnectionStatusCard } from "../ConnectionStatusCard"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts"
import { Network } from "../NetworkSelector"
import { USDCLogo, EthereumLogo, weETHLogo } from "../ui/crypto-logos"

interface PortfolioProps {
  currentNetwork: Network
  isConnected: boolean
  onConnectWallet?: () => void
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

export function Portfolio({ currentNetwork, isConnected, onConnectWallet }: PortfolioProps) {
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showBridgeSwapModal, setShowBridgeSwapModal] = useState(false)
  const [showRemoveFundsModal, setShowRemoveFundsModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
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
      deposited: '25,000.00',
      depositedUSD: '$25,000.00',
      currentValue: '25,618.45',
      currentValueUSD: '$25,618.45',
      apy: '12.34%',
      earned: '+618.45',
      earnedUSD: '+$618.45',
      pnl: '+2.47%',
      riskLevel: 'Low',
      riskColor: 'text-green-400',
      riskIcon: Shield,
      isPositive: true,
      status: 'Active',
      lastUpdate: '2 min ago',
      category: 'Vaults'
    },
    {
      id: '2',
      asset: { symbol: 'WETH', logo: EthereumLogo },
      strategy: 'Seamless WETH Vault',
      deposited: '8.50',
      depositedUSD: '$20,740.00',
      currentValue: '8.72',
      currentValueUSD: '$21,276.80',
      apy: '8.92%',
      earned: '+0.22',
      earnedUSD: '+$536.80',
      pnl: '+2.59%',
      riskLevel: 'Medium',
      riskColor: 'text-yellow-400',
      riskIcon: AlertTriangle,
      isPositive: true,
      status: 'Active',
      lastUpdate: '1 min ago',
      category: 'Vaults'
    },
    {
      id: '3',
      asset: { symbol: 'weETH', logo: weETHLogo },
      strategy: 'weETH / WETH 17x Leverage Token',
      deposited: '5.50',
      depositedUSD: '$13,420.00',
      currentValue: '6.12',
      currentValueUSD: '$14,932.80',
      apy: '18.67%',
      earned: '+0.62',
      earnedUSD: '+$1,512.80',
      pnl: '+11.27%',
      riskLevel: 'High',
      riskColor: 'text-red-400',
      riskIcon: AlertTriangle,
      isPositive: true,
      status: 'Active',
      lastUpdate: '5 min ago',
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
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Overview</h1>
          <p className="text-slate-400 mt-1">Track your investments, earnings, and manage positions</p>
        </div>
      </motion.div>

      {/* Portfolio Value Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
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
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
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

      {/* Available Rewards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
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
      </motion.div>

      {/* Position Management Section - Integrated from ManagePositions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Position Management</CardTitle>
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                {positions.length} Active Position{positions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Active Positions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Active Positions</h3>
              <AnimatePresence>
                {positions.map((position, index) => (
                  <motion.div
                    key={position.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      {/* Strategy Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center p-1">
                          {renderAssetLogo(position.asset, 32)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{position.strategy}</h3>
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

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="text-center lg:text-left">
                          <p className="text-xs text-slate-400">Deposited</p>
                          <p className="font-medium text-white">{position.deposited} {position.asset.symbol}</p>
                        </div>
                        
                        <div className="text-center lg:text-left">
                          <p className="text-xs text-slate-400">Current Value</p>
                          <p className="font-medium text-white">{position.currentValue} {position.asset.symbol}</p>
                        </div>
                        
                        <div className="text-center lg:text-left">
                          <p className="text-xs text-slate-400">P&L</p>
                          <p className={`font-medium ${
                            position.earned.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.earned} {position.asset.symbol}
                          </p>
                          <p className={`text-xs ${
                            position.earned.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {position.pnl}
                          </p>
                        </div>
                        
                        <div className="text-center lg:text-left">
                          <p className="text-xs text-slate-400">APY</p>
                          <p className="font-medium text-purple-400">{position.apy}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 lg:ml-4">
                        <Button
                          size="sm"
                          onClick={() => handlePositionAction(position, 'deposit')}
                          className="bg-green-600 hover:bg-green-500 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePositionAction(position, 'withdraw')}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                          {position.status}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Updated {position.lastUpdate}
                        </span>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        View Details
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
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
    </motion.div>
  )
}