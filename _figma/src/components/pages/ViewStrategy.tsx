"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  BarChart3,
  DollarSign,
  Users,
  Shield,
  Clock,
  Target,
  AlertTriangle,
  ExternalLink,
  Zap
} from "lucide-react"
import { LeverageTokenMintModal } from "../LeverageTokenMintModal"
import { LeverageTokenRedeemModal } from "../LeverageTokenRedeemModal"
import { StrategyDepositModal } from "../StrategyDepositModal"
import { StrategyWithdrawModal } from "../StrategyWithdrawModal"
import { getStrategyData } from "../data/mockStrategyData"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  Area,
  AreaChart
} from "recharts"

interface ViewStrategyProps {
  strategyId?: string
  onBack: () => void
}

export function ViewStrategy({ strategyId = 'seamless-usdc-vault', onBack }: ViewStrategyProps) {
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showMintModal, setShowMintModal] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1W')
  const [selectedAPYTimeframe, setSelectedAPYTimeframe] = useState('1W')
  const [openFAQs, setOpenFAQs] = useState<string[]>([])
  
  // Chart line visibility states
  const [visibleLines, setVisibleLines] = useState({
    weethPrice: true,
    leverageTokenPrice: true
  })

  const strategyData = getStrategyData(strategyId)

  // Check if this is a leverage token strategy
  const isLeverageToken = strategyData.category === 'Leverage Tokens'

  // Mock user position data
  const userPosition = {
    hasPosition: true,
    balance: '0.00',
    balanceUSD: '$0.00',
    shares: '0.00',
    shareToken: strategyData.id.includes('usdc') ? 'mUSDC' : 
                strategyData.id.includes('cbbtc') ? 'mBTC' : 
                strategyData.id.includes('weth') ? 'mETH' : 
                isLeverageToken ? 'weETH/WETH-17x' : 'mTOKEN',
    walletBalance: '1,234.56',
    maxBuy: '5,000',
    maxSell: '0.00',
    asset: strategyData.assets[0]
  }

  // Mock price/TVL data over time
  const priceData = useMemo(() => {
    if (isLeverageToken) {
      // For leverage tokens, show weETH vs Leverage Token price comparison
      return Array.from({ length: 30 }, (_, i) => ({
        time: `Day ${i + 1}`,
        weethPrice: 2489 * (1 + (Math.random() - 0.5) * 0.02),
        leverageTokenPrice: 2456 * (1 + (Math.random() - 0.3) * 0.4), // More volatile
        leverageTokenPriceNormalized: 2456 * (1 + (Math.sin(i / 5) * 0.15))
      }))
    } else {
      const basePrice = strategyData.id.includes('usdc') ? 1.00 : 
                       strategyData.id.includes('cbbtc') ? 67840 : 2456
      return Array.from({ length: 30 }, (_, i) => ({
        time: `Day ${i + 1}`,
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        tvl: (strategyData.tvl / 1000000) * (1 + (Math.random() - 0.5) * 0.1)
      }))
    }
  }, [strategyId, isLeverageToken])

  // Mock APY data over time
  const apyData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      time: `Day ${i + 1}`,
      grossAPY: strategyData.apy * (1 + (Math.random() - 0.5) * 0.2),
      netAPY: strategyData.apy * 0.9 * (1 + (Math.random() - 0.5) * 0.2)
    }))
  }, [strategyId])

  const timeframes = ['1H', '1D', '1W', '1M', '3M', '1Y']

  // Chart line configuration
  const chartLines = [
    {
      key: 'weethPrice',
      name: 'weETH Price',
      color: '#10B981',
      dataKey: 'weethPrice'
    },
    {
      key: 'leverageTokenPrice', 
      name: 'Leverage Token Price',
      color: '#A16CFE',
      dataKey: 'leverageTokenPrice'
    }
  ]

  // Toggle line visibility
  const toggleLineVisibility = (lineKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey as keyof typeof prev]
    }))
  }

  const toggleFAQ = (faqId: string) => {
    setOpenFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    )
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400 border-green-400/20'
      case 'medium': return 'text-yellow-400 border-yellow-400/20'
      case 'high': return 'text-red-400 border-red-400/20'
      default: return 'text-slate-400 border-slate-400/20'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return Shield
      case 'medium': return AlertTriangle
      case 'high': return AlertTriangle
      default: return Shield
    }
  }

  const RiskIcon = getRiskIcon(strategyData.riskLevel)

  // Leverage Token specific FAQ data
  const leverageTokenFAQs = [
    {
      id: 'how-leverage-token-works',
      question: 'How does Phil Leverage Token work?',
      answer: 'Phil Leverage Tokens provide leveraged exposure to the price ratio between two assets. This 17x leverage token amplifies the performance difference between weETH and WETH, allowing traders to benefit from relative price movements with enhanced returns.'
    },
    {
      id: 'what-can-mint-redeem',
      question: 'What asset can I use to mint the Leverage Token?',
      answer: 'You can mint leverage tokens using either weETH or WETH. The protocol automatically manages the leveraged position and rebalancing to maintain the target leverage ratio.'
    },
    {
      id: 'what-is-ltv',
      question: 'What is LTV?',
      answer: 'LTV (Loan-to-Value) represents the ratio of borrowed assets to collateral value. For this 17x leverage token, the LTV is carefully managed through automated rebalancing to maintain optimal leverage while avoiding liquidation risks.'
    },
    {
      id: 'exposure-to-eth',
      question: 'Do I have leveraged exposure to ETH price with the Leverage Token?',
      answer: 'Yes, this leverage token provides amplified exposure to the relative performance between weETH and WETH. When weETH outperforms WETH, you benefit from 17x the price difference, and vice versa.'
    },
    {
      id: 'target-leverage-ratio',
      question: 'What\'s the target leverage ratio for this Leverage Token?',
      answer: 'This token maintains a target leverage ratio of 17x. The protocol automatically rebalances positions to maintain this ratio while managing risk through sophisticated algorithms and liquidation protections.'
    },
    {
      id: 'rebalance-mechanics',
      question: 'What are the rebalance mechanics for Leverage Tokens?',
      answer: 'The protocol automatically rebalances positions when leverage drifts from the target ratio. Rebalancing occurs based on price movements, time intervals, or when leverage approaches risk thresholds to maintain optimal performance.'
    },
    {
      id: 'risks',
      question: 'What are the risks involved?',
      answer: 'Leverage tokens carry amplified risks including higher volatility, potential for significant losses during adverse price movements, rebalancing costs, and smart contract risks. Always understand the mechanics before investing.'
    },
    {
      id: 'fees',
      question: 'What are the fees with this Leverage Token?',
      answer: 'Fees include a management fee, performance fee, and rebalancing costs. Frequent rebalancing during volatile periods may impact returns through transaction costs and slippage.'
    },
    {
      id: 'short-vs-long-term',
      question: 'Is this a short-term or long-term strategy?',
      answer: 'Leverage tokens are generally more suitable for short to medium-term strategies due to rebalancing effects and volatility decay. Long-term performance may differ significantly from expected leveraged returns.'
    },
    {
      id: 'lose-money',
      question: 'Can I lose money with this Leverage Token?',
      answer: 'Yes, leverage tokens can result in significant losses due to their amplified exposure. In extreme market conditions, you could lose a substantial portion or all of your investment. Only invest what you can afford to lose.'
    },
    {
      id: 'where-learn-more',
      question: 'Where can I learn more?',
      answer: 'Visit our documentation for detailed explanations of leverage token mechanics, risk management, and best practices. Join our Discord community for support and educational resources.'
    }
  ]

  // Vault FAQ data (existing)
  const vaultFAQs = [
    {
      id: 'how-it-works',
      question: 'How does this vault work?',
      answer: strategyData.longDescription + ' The vault automatically rebalances positions and manages risk to optimize yields while protecting user capital.'
    },
    {
      id: 'main-risks',
      question: 'What are the main risks?',
      answer: `The main risks include ${strategyData.riskMetrics.marketRisk.toLowerCase()} market risk, ${strategyData.riskMetrics.smartContractRisk.toLowerCase()} smart contract risk, and ${strategyData.riskMetrics.liquidityRisk.toLowerCase()} liquidity risk. All smart contracts have been audited and the protocol maintains strict risk management parameters.`
    },
    {
      id: 'fees',
      question: 'Are there fees for using this vault?',
      answer: `This vault charges a ${strategyData.fees.managementFee}% annual management fee and a ${strategyData.fees.performanceFee}% performance fee on profits. Deposit fee: ${strategyData.fees.depositFee}%, Withdrawal fee: ${strategyData.fees.withdrawalFee}%.`
    },
    {
      id: 'learn-more',
      question: 'Where can I learn more?',
      answer: 'You can find detailed documentation, audit reports, and technical specifications in our documentation portal. Join our Discord community for real-time updates and support from our team and community members.'
    }
  ]

  const faqData = isLeverageToken ? leverageTokenFAQs : vaultFAQs

  // Render Leverage Token Layout
  if (isLeverageToken) {
    return (
      <motion.div 
        className="min-h-full space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with back button */}
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </motion.div>

        {/* Strategy Title and Description */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-1">
              {strategyData.assets.map((asset, index) => (
                <Avatar key={asset.symbol} className="w-8 h-8 border-2 border-slate-700">
                  <AvatarImage src={asset.logo} alt={asset.symbol} />
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
                    {asset.symbol.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {strategyData.name}
            </h1>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20">
              {strategyData.apy.toFixed(2)}% APY
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-400/20">
              NEW BETA
            </Badge>
            <Badge variant="outline" className={`${getRiskColor(strategyData.riskLevel)}`}>
              <RiskIcon className="w-3 h-3 mr-1" />
              {strategyData.riskLevel} Risk
            </Badge>
          </div>
          
          <p className="text-slate-400 leading-relaxed max-w-4xl">
            {strategyData.description}
          </p>
        </motion.div>

        {/* Current Holdings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Current Holdings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Position Value */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={userPosition.asset.logo} alt={userPosition.shareToken} />
                      <AvatarFallback className="bg-slate-800 text-xs">
                        {userPosition.shareToken.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-400">{userPosition.shareToken}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userPosition.balance}</div>
                  <div className="text-sm text-slate-400">{userPosition.balanceUSD}</div>
                </div>

                {/* Max Buy */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Max</span>
                  </div>
                  <div className="text-xl font-bold text-white">{userPosition.maxBuy}</div>
                  <div className="text-sm text-purple-400">Buy</div>
                </div>

                {/* Max Sell */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Max</span>
                  </div>
                  <div className="text-xl font-bold text-white">{userPosition.maxSell}</div>
                  <div className="text-sm text-pink-400">Sell</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={() => setShowMintModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Mint
                  </Button>
                  <Button
                    onClick={() => setShowRedeemModal(true)}
                    variant="outline"
                    disabled={!userPosition.hasPosition}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Minus className="w-4 w-4 mr-2" />
                    Redeem
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leverage Token Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Leverage Token TVL */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Leverage Token TVL</p>
                <p className="text-2xl font-bold text-white">$718.04K</p>
                <p className="text-sm text-slate-500">154.26 weETH</p>
              </div>
            </CardContent>
          </Card>

          {/* Leverage Token Collateral */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Leverage Token Collateral</p>
                <p className="text-2xl font-bold text-white">$12.64M</p>
                <p className="text-sm text-slate-500">2.72K weETH</p>
              </div>
            </CardContent>
          </Card>

          {/* Leverage Token Price */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Leverage Token Price</p>
                <p className="text-2xl font-bold text-white">$4.60K</p>
              </div>
            </CardContent>
          </Card>

          {/* Target Leverage */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Target leverage</p>
                <p className="text-2xl font-bold text-white">17.00x</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Price Comparison Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="text-lg text-white mb-1">
                      weETH vs. Leverage Token Price
                    </CardTitle>
                    <div className="text-sm text-slate-400">Price comparison and performance tracking</div>
                  </div>
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
                
                {/* Chart Line Toggle Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-slate-400 font-medium">Chart Lines:</span>
                  {chartLines.map((line) => (
                    <motion.button
                      key={line.key}
                      onClick={() => toggleLineVisibility(line.key)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                        visibleLines[line.key as keyof typeof visibleLines]
                          ? 'bg-slate-800/80 border-slate-600 text-white'
                          : 'bg-slate-900/50 border-slate-700 text-slate-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div 
                        className={`w-3 h-3 rounded-full transition-opacity duration-200 ${
                          visibleLines[line.key as keyof typeof visibleLines] ? 'opacity-100' : 'opacity-40'
                        }`}
                        style={{ backgroundColor: line.color }}
                      />
                      <span className="text-sm font-medium">{line.name}</span>
                      <motion.div
                        initial={false}
                        animate={{ 
                          opacity: visibleLines[line.key as keyof typeof visibleLines] ? 1 : 0.4,
                          scale: visibleLines[line.key as keyof typeof visibleLines] ? 1 : 0.8
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {visibleLines[line.key as keyof typeof visibleLines] ? (
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-slate-600 rounded-full" />
                        )}
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData}>
                    <XAxis 
                      dataKey="time" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#F8FAFC'
                      }}
                    />
                    {visibleLines.weethPrice && (
                      <Line 
                        type="monotone" 
                        dataKey="weethPrice" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={false}
                        name="weETH Price"
                      />
                    )}
                    {visibleLines.leverageTokenPrice && (
                      <Line 
                        type="monotone" 
                        dataKey="leverageTokenPrice" 
                        stroke="#A16CFE" 
                        strokeWidth={2}
                        dot={false}
                        name="Leverage Token Price"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics Grid - Enhanced with Leverage Token Details */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          {/* Row 1 */}
          {/* Current Leverage */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Current Leverage</div>
              <div className="text-2xl font-bold text-white">17.00x</div>
            </CardContent>
          </Card>

          {/* Min - Max Leverage */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Min - Max Leverage</div>
              <div className="text-2xl font-bold text-white">16.90x - 17.30x</div>
            </CardContent>
          </Card>

          {/* Mint Token Fee */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Mint Token Fee</div>
              <div className="text-2xl font-bold text-green-400">0.00%</div>
            </CardContent>
          </Card>

          {/* Row 2 */}
          {/* Redeem Token Fee */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Redeem Token Fee</div>
              <div className="text-2xl font-bold text-white">0.10%</div>
            </CardContent>
          </Card>

          {/* Dutch Auction Duration */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Dutch Auction Duration</div>
              <div className="text-2xl font-bold text-white">1 hour</div>
            </CardContent>
          </Card>

          {/* Dutch Auction Initial Price Multiplier */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Dutch Auction Initial Price Multiplier</div>
              <div className="text-2xl font-bold text-white">1.01x</div>
            </CardContent>
          </Card>

          {/* Row 3 */}
          {/* Dutch Auction Min Price Multiplier */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Dutch Auction Min Price Multiplier</div>
              <div className="text-2xl font-bold text-white">0.99x</div>
            </CardContent>
          </Card>

          {/* Pre-liquidation Leverage */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Pre-liquidation Leverage</div>
              <div className="text-2xl font-bold text-white">17.50x</div>
            </CardContent>
          </Card>

          {/* Pre-liquidation Rebalance Reward */}
          <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300">
            <CardContent className="p-6">
              <div className="text-sm text-slate-400 mb-2">Pre-liquidation Rebalance Reward</div>
              <div className="text-2xl font-bold text-white">0.50%</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqData.map((faq) => (
                <Collapsible key={faq.id} open={openFAQs.includes(faq.id)} onOpenChange={() => toggleFAQ(faq.id)}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg transition-colors duration-200">
                    <span className="text-left font-medium text-white">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: openFAQs.includes(faq.id) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </motion.div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-slate-400 leading-relaxed mt-2">{faq.answer}</p>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modals */}
        <LeverageTokenMintModal
          isOpen={showMintModal}
          onClose={() => setShowMintModal(false)}
          strategyId={strategyId}
        />

        <LeverageTokenRedeemModal
          isOpen={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          strategyId={strategyId}
        />
      </motion.div>
    )
  }

  // Render Vault Layout
  return (
    <motion.div 
      className="min-h-full space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with back button */}
      <motion.div 
        className="flex items-center space-x-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </motion.div>

      {/* Vault Title and Description */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-1">
            {strategyData.assets.map((asset, index) => (
              <Avatar key={asset.symbol} className="w-8 h-8 border-2 border-slate-700">
                <AvatarImage src={asset.logo} alt={asset.symbol} />
                <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
                  {asset.symbol.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {strategyData.name}
          </h1>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20">
            {strategyData.apy.toFixed(2)}% APY
          </Badge>
          <Badge variant="outline" className={`${getRiskColor(strategyData.riskLevel)}`}>
            <RiskIcon className="w-3 h-3 mr-1" />
            {strategyData.riskLevel} Risk
          </Badge>
        </div>
        
        <p className="text-slate-400 leading-relaxed max-w-4xl">
          {strategyData.description}
        </p>
      </motion.div>

      {/* Current Position Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Current Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Position Value */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={userPosition.asset.logo} alt={userPosition.shareToken} />
                    <AvatarFallback className="bg-slate-800 text-xs">
                      {userPosition.shareToken.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-400">{userPosition.shareToken}</span>
                </div>
                <div className="text-2xl font-bold text-white">{userPosition.balance}</div>
                <div className="text-sm text-slate-400">{userPosition.balanceUSD}</div>
              </div>

              {/* Wallet Balance */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-400">Wallet</span>
                </div>
                <div className="text-xl font-bold text-white">{userPosition.walletBalance}</div>
                <div className="text-sm text-slate-400">Available</div>
              </div>

              {/* Max Withdraw */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-400">Max</span>
                </div>
                <div className="text-xl font-bold text-white">{userPosition.maxSell}</div>
                <div className="text-sm text-pink-400">Withdraw</div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  variant="outline"
                  disabled={!userPosition.hasPosition}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vault Performance Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Price History */}
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg text-white mb-1">Price History</CardTitle>
                <div className="text-sm text-slate-400">Vault token price over time</div>
              </div>
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
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10B981" 
                    fill="url(#priceGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* APY History */}
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg text-white mb-1">APY History</CardTitle>
                <div className="text-sm text-slate-400">Annual percentage yield over time</div>
              </div>
              <div className="flex space-x-1">
                {timeframes.map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedAPYTimeframe === timeframe ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedAPYTimeframe(timeframe)}
                    className="text-xs px-3 py-1"
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={apyData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="grossAPY" 
                    stroke="#A16CFE" 
                    strokeWidth={2}
                    dot={false}
                    name="Gross APY"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netAPY" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                    name="Net APY"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vault Metrics */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Total Value Locked</p>
              <p className="text-2xl font-bold text-white">${(strategyData.tvl / 1000000).toFixed(2)}M</p>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+5.2% this week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Participants</p>
              <p className="text-2xl font-bold text-white">{strategyData.metrics.participants.toLocaleString()}</p>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-slate-400">Active users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Current APY</p>
              <p className="text-2xl font-bold text-green-400">{strategyData.apy.toFixed(2)}%</p>
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-3 w-3 text-purple-400" />
                <span className="text-xs text-slate-400">7-day average</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Risk Score</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-white">{strategyData.riskLevel}</p>
                <RiskIcon className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-xs text-slate-400">Automated assessment</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqData.map((faq) => (
              <Collapsible key={faq.id} open={openFAQs.includes(faq.id)} onOpenChange={() => toggleFAQ(faq.id)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg transition-colors duration-200">
                  <span className="text-left font-medium text-white">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFAQs.includes(faq.id) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  </motion.div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-slate-400 leading-relaxed mt-2">{faq.answer}</p>
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <StrategyDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        strategyId={strategyId}
      />

      <StrategyWithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        strategyId={strategyId}
      />
    </motion.div>
  )
}