"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Settings,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Edit3,
  Trash2
} from "lucide-react"
import { StrategyDepositModal } from "../StrategyDepositModal"
import { StrategyWithdrawModal } from "../StrategyWithdrawModal"

export function ManagePositions() {
  const [activeTab, setActiveTab] = useState('active')
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mock positions data
  const positions = [
    {
      id: '1',
      strategy: 'Seamless USDC Vault',
      asset: { symbol: 'USDC', logo: '💵' },
      deposited: '10,000.00',
      currentValue: '10,247.83',
      earned: '+247.83',
      earnedPercentage: '+2.48%',
      apy: '12.34%',
      status: 'Active',
      lastUpdate: '2 min ago',
      riskLevel: 'Low',
      category: 'Vaults'
    },
    {
      id: '2',
      strategy: 'weETH / WETH 17x Leverage Token',
      asset: { symbol: 'weETH', logo: '🔥' },
      deposited: '5.50',
      currentValue: '6.12',
      earned: '+0.62',
      earnedPercentage: '+11.27%',
      apy: '18.67%',
      status: 'Active',
      lastUpdate: '5 min ago',
      riskLevel: 'High',
      category: 'Leverage Tokens'
    },
    {
      id: '3',
      strategy: 'Seamless WETH Vault',
      asset: { symbol: 'WETH', logo: '⚡' },
      deposited: '2.50',
      currentValue: '2.41',
      earned: '-0.09',
      earnedPercentage: '-3.60%',
      apy: '8.92%',
      status: 'Active',
      lastUpdate: '1 min ago',
      riskLevel: 'Medium',
      category: 'Vaults'
    }
  ]

  const pendingTransactions = [
    {
      id: '4',
      type: 'Deposit',
      strategy: 'Seamless cbBTC Vault',
      asset: { symbol: 'cbBTC', logo: '₿' },
      amount: '0.15',
      status: 'Pending',
      estimatedCompletion: '~3 min',
      txHash: '0x1234...5678'
    },
    {
      id: '5',
      type: 'Withdraw',
      strategy: 'Seamless USDC Vault',
      asset: { symbol: 'USDC', logo: '💵' },
      amount: '1,500.00',
      status: 'Processing',
      estimatedCompletion: '~1 min',
      txHash: '0xabcd...efgh'
    }
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsRefreshing(false)
  }

  const handlePositionAction = (position: any, action: 'deposit' | 'withdraw') => {
    setSelectedPosition(position)
    if (action === 'deposit') {
      setShowDepositModal(true)
    } else {
      setShowWithdrawModal(true)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Positions</h1>
          <p className="text-slate-400 mt-1">Monitor and adjust your active positions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-slate-800 border-slate-600 hover:bg-slate-700 disabled:opacity-50"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{
                duration: 1,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear"
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
            </motion.div>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.div>

      {/* Portfolio Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Deposited</p>
                <p className="text-2xl font-bold text-white">$15,550.00</p>
                <p className="text-xs text-slate-500 mt-1">Across 3 positions</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Current Value</p>
                <p className="text-2xl font-bold text-white">$16,000.95</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +$450.95 (+2.90%)
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg. APY</p>
                <p className="text-2xl font-bold text-white">13.31%</p>
                <p className="text-xs text-slate-500 mt-1">Weighted average</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Your Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="active">Active Positions</TabsTrigger>
                <TabsTrigger value="pending">Pending Transactions</TabsTrigger>
              </TabsList>

              {/* Active Positions */}
              <TabsContent value="active" className="space-y-4">
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
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-slate-700 text-2xl">
                              {position.asset.logo}
                            </AvatarFallback>
                          </Avatar>
                          
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
                              {position.earnedPercentage}
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
              </TabsContent>

              {/* Pending Transactions */}
              <TabsContent value="pending" className="space-y-4">
                <AnimatePresence>
                  {pendingTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-slate-700 text-lg">
                              {transaction.asset.logo}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-white">{transaction.type}</h4>
                              <Badge variant="outline" className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">{transaction.strategy}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-white">
                            {transaction.amount} {transaction.asset.symbol}
                          </p>
                          <p className="text-xs text-slate-400">
                            ETA: {transaction.estimatedCompletion}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span>Transaction Progress</span>
                          <span>Processing...</span>
                        </div>
                        <Progress value={75} className="h-1" />
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          View Transaction
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                        
                        <div className="text-xs text-slate-400">
                          Tx: {transaction.txHash}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
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