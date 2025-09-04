"use client"

import React, { useState, useMemo } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { 
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Shield,
  Target,
  AlertTriangle,
  ExternalLink,
  Zap,
  Info,
  Wallet,
  Building2,
  Coins,
  TrendingUp,
  Globe
} from "lucide-react"
import { getCryptoLogo } from "../ui/crypto-logos"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { StrategyBreadcrumb } from "../StrategyBreadcrumb"
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
  Tooltip as RechartsTooltip,
  Area,
  AreaChart
} from "recharts"

interface ViewStrategyProps {
  strategyId?: string
  onBack: () => void
  previousPage?: string
  onNavigateToPage?: (page: string) => void
  isConnected: boolean
  onConnectWallet: () => void
}

export function ViewStrategy({ 
  strategyId = 'seamless-usdc-vault', 
  onBack, 
  previousPage = 'explore',
  onNavigateToPage,
  isConnected,
  onConnectWallet
}: ViewStrategyProps) {
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showMintModal, setShowMintModal] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1W')
  const [selectedAPYTimeframe, setSelectedAPYTimeframe] = useState('1W')
  const [openFAQs, setOpenFAQs] = useState<string[]>([])
  const [isDetailedMetricsOpen, setIsDetailedMetricsOpen] = useState(false)
  const [isRelatedResourcesOpen, setIsRelatedResourcesOpen] = useState(false)
  
  // Chart line visibility states
  const [visibleLines, setVisibleLines] = useState({
    weethPrice: true,
    leverageTokenPrice: true
  })

  const strategyData = getStrategyData(strategyId)

  // Check if this is a leverage token strategy
  const isLeverageToken = strategyData.category === 'Leverage Tokens'

  // Get page info for breadcrumb
  const getPageInfo = (page: string) => {
    switch (page) {
      case 'explore':
        return { title: 'Leverage Tokens', path: 'explore' }
      case 'vaults':
        return { title: 'Vaults', path: 'vaults' }
      case 'portfolio':
        return { title: 'Portfolio', path: 'portfolio' }
      default:
        return { title: 'Leverage Tokens', path: 'explore' }
    }
  }

  const parentPageInfo = getPageInfo(previousPage)

  // Create breadcrumb items
  const breadcrumbItems = [
    {
      label: parentPageInfo.title,
      onClick: () => onNavigateToPage?.(parentPageInfo.path),
      isActive: false
    },
    {
      label: isLeverageToken ? strategyData.name : 'Vault Details',
      isActive: true
    }
  ]

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
    maxDeposit: '5,000',
    maxWithdraw: '0.00',
    asset: strategyData.assets[0]
  }

  // Mock price/TVL data over time
  const priceData = useMemo(() => {
    const now = new Date()
    const getDateString = (daysAgo: number) => {
      const date = new Date(now)
      date.setDate(date.getDate() - daysAgo)
      return date.toISOString().split('T')[0] // YYYY-MM-DD format
    }

    if (isLeverageToken) {
      // For leverage tokens, show weETH vs Leverage Token price comparison
      return Array.from({ length: 30 }, (_, i) => ({
        time: getDateString(29 - i), // Most recent first
        date: getDateString(29 - i),
        weethPrice: 2489 * (1 + (Math.random() - 0.5) * 0.02),
        leverageTokenPrice: 2456 * (1 + (Math.random() - 0.3) * 0.4), // More volatile
        leverageTokenPriceNormalized: 2456 * (1 + (Math.sin(i / 5) * 0.15))
      }))
    } else {
      const basePrice = strategyData.id.includes('usdc') ? 1.00 : 
                       strategyData.id.includes('cbbtc') ? 67840 : 2456
      return Array.from({ length: 30 }, (_, i) => ({
        time: getDateString(29 - i), // Most recent first
        date: getDateString(29 - i),
        price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
        tvl: (strategyData.tvl / 1000000) * (1 + (Math.random() - 0.5) * 0.1)
      }))
    }
  }, [strategyId, isLeverageToken])

  // Mock APY data over time
  const apyData = useMemo(() => {
    const now = new Date()
    const getDateString = (daysAgo: number) => {
      const date = new Date(now)
      date.setDate(date.getDate() - daysAgo)
      return date.toISOString().split('T')[0] // YYYY-MM-DD format
    }

    return Array.from({ length: 30 }, (_, i) => ({
      time: getDateString(29 - i), // Most recent first
      date: getDateString(29 - i),
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

  // Handle mint button click with wallet connection check
  const handleMintClick = () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }
    setShowMintModal(true)
  }

  // Handle redeem button click with wallet connection check
  const handleRedeemClick = () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }
    setShowRedeemModal(true)
  }

  // Handle deposit button click with wallet connection check
  const handleDepositClick = () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }
    setShowDepositModal(true)
  }

  // Handle withdraw button click with wallet connection check
  const handleWithdrawClick = () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }
    setShowWithdrawModal(true)
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

  // Render crypto logo component
  const renderCryptoLogo = (asset: { symbol: string }, size: number = 32, className: string = "") => {
    const LogoComponent = getCryptoLogo(asset.symbol)
    return <LogoComponent size={size} className={className} />
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    } else {
      return `${amount.toFixed(2)}`
    }
  }

  // Format date for chart display
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Format price for Y-axis
  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    } else {
      return `$${value.toFixed(0)}`
    }
  }

  // Format APY percentage for Y-axis
  const formatAPY = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Format TVL for Y-axis
  const formatTVL = (value: number) => {
    return `$${value.toFixed(0)}M`
  }

  // Get Y-axis label based on strategy type and chart content
  const getYAxisLabel = (chartType: 'price' | 'apy' | 'tvl', isLeverageToken: boolean) => {
    switch (chartType) {
      case 'price':
        return 'Price ($)'
      case 'apy':
        return 'APY (%)'
      case 'tvl':
        return 'TVL ($)'
      default:
        return ''
    }
  }

  // Common Y-axis properties for consistency
  const getYAxisProps = (chartType: 'price' | 'apy' | 'tvl', formatter?: (value: number) => string) => ({
    axisLine: false,
    tickLine: false,
    tick: { fill: '#64748B', fontSize: 12 },
    tickFormatter: formatter,
    label: { 
      value: getYAxisLabel(chartType, isLeverageToken), 
      angle: -90, 
      position: 'insideLeft', 
      style: { textAnchor: 'middle', fill: '#64748B', fontSize: '12px' } 
    }
  })

  const renderAPYChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={apyData}>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
          tickFormatter={formatChartDate}
        />
        <YAxis {...getYAxisProps('apy', formatAPY)} />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#F8FAFC'
          }}
          formatter={(value, name) => [
            `${Number(value).toFixed(2)}%`,
            name === 'grossAPY' ? 'Gross APY' : 'Net APY'
          ]}
        />
        <Line 
          type="monotone" 
          dataKey="grossAPY" 
          stroke="#22D3EE" 
          strokeWidth={2}
          dot={false}
          name="Gross APY"
        />
        <Line 
          type="monotone" 
          dataKey="netAPY" 
          stroke="#A16CFE" 
          strokeWidth={2}
          dot={false}
          name="Net APY"
        />
      </LineChart>
    </ResponsiveContainer>
  )

  const renderTVLChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={priceData}>
        <defs>
          <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
          tickFormatter={formatChartDate}
        />
        <YAxis {...getYAxisProps('tvl', formatTVL)} />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#F8FAFC'
          }}
          formatter={(value) => [`$${Number(value).toFixed(2)}M`, 'TVL']}
        />
        <Area 
          type="monotone" 
          dataKey="tvl" 
          stroke="#10B981" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#tvlGradient)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )

  // Get vault-specific metrics data
  const getVaultMetrics = (strategyId: string) => {
    return {
      tvl: {
        amount: strategyData.id.includes('usdc') ? '68.76M USDC' : 
                strategyData.id.includes('cbbtc') ? '1.05K cbBTC' : 
                '28.42K WETH',
        usdValue: `${formatCurrency(strategyData.tvl)}`
      },
      curator: {
        name: 'Gauntlet',
        icon: 'G'
      },
      performanceFee: `${strategyData.fees.performanceFee}%`,
      timelockPeriod: '72h Hours'
    }
  }

  // Get leverage token specific metrics - Organized by category for better UX and flexibility
  const getLeverageTokenMetrics = (strategyId: string) => {
    // Base metrics that all leverage tokens should have
    const baseMetrics = {
      'Leverage Settings': [
        { 
          label: 'Target Leverage', 
          value: '17.00x', 
          highlight: false,
          tooltip: 'The target leverage ratio of the token'
        },
        { 
          label: 'Min - Max Leverage', 
          value: '16.90x - 17.30x', 
          highlight: false,
          tooltip: 'Allowed leverage range before rebalancing'
        }
      ],
      'Fees': [
        { 
          label: 'Mint Token Fee', 
          value: '0.00%', 
          highlight: true, 
          color: 'text-green-400',
          tooltip: 'Fee charged when minting new leverage tokens'
        },
        { 
          label: 'Redeem Token Fee', 
          value: '0.10%', 
          highlight: false,
          tooltip: 'Fee charged when redeeming leverage tokens'
        }
      ],
      'Auction Parameters': [
        { 
          label: 'Dutch Auction Duration', 
          value: '1 hour', 
          highlight: false,
          tooltip: 'Duration of the Dutch auction process for rebalancing'
        },
        { 
          label: 'Initial Price Multiplier', 
          value: '1.01x', 
          highlight: false,
          tooltip: 'Starting price multiplier for the Dutch auction'
        },
        { 
          label: 'Min Price Multiplier', 
          value: '0.99x', 
          highlight: false,
          tooltip: 'Minimum price multiplier during Dutch auction'
        }
      ],
      'Risk Management': [
        { 
          label: 'Pre-liquidation Leverage', 
          value: '17.50x', 
          highlight: false,
          tooltip: 'Leverage threshold that triggers liquidation protection'
        },
        { 
          label: 'Rebalance Reward', 
          value: '0.50%', 
          highlight: false,
          tooltip: 'Reward for triggering pre-liquidation rebalance'
        }
      ]
    }

    // Strategy-specific configurations can override or extend base metrics
    const strategySpecificMetrics: Record<string, any> = {
      'weeth-weth-17x': baseMetrics,
      'seamless-weeth-weth-17x': baseMetrics,
      'weeth-weth-leverage-token': baseMetrics,
      
      // Example of a different leverage token with different metrics
      'wsteth-eth-10x': {
        'Leverage Settings': [
          { 
            label: 'Target Leverage', 
            value: '10.00x', 
            highlight: false,
            tooltip: 'The current leverage ratio of the token'
          },
          { 
            label: 'Target Leverage Range', 
            value: '9.50x - 10.50x', 
            highlight: false,
            tooltip: 'Target leverage range for this token'
          }
        ],
        'Fees': [
          { 
            label: 'Mint Fee', 
            value: '0.05%', 
            highlight: false,
            tooltip: 'Fee charged when minting new leverage tokens'
          },
          { 
            label: 'Redeem Fee', 
            value: '0.10%', 
            highlight: false,
            tooltip: 'Fee charged when redeeming leverage tokens'
          },
          { 
            label: 'Performance Fee', 
            value: '15%', 
            highlight: false,
            tooltip: 'Fee charged on profits above benchmark'
          }
        ],
        'Operations': [
          { 
            label: 'Rebalance Frequency', 
            value: '4 hours', 
            highlight: false,
            tooltip: 'Maximum time between rebalancing events'
          },
          { 
            label: 'Liquidation Threshold', 
            value: '11.00x', 
            highlight: false,
            tooltip: 'Leverage threshold that triggers liquidation protection'
          }
        ]
      }
    }

    return strategySpecificMetrics[strategyId] || baseMetrics
  }

  // FAQ data
  const leverageTokenFAQs = [
    {
      id: 'how-leverage-token-works',
      question: 'How does this Leverage Token work?',
      answer: 'This 17x leverage token amplifies the performance difference between weETH and WETH, allowing traders to benefit from relative price movements with enhanced returns.'
    },
    {
      id: 'risks',
      question: 'What are the risks involved?',
      answer: 'Leverage tokens carry amplified risks including higher volatility, potential for significant losses during adverse price movements, rebalancing costs, and smart contract risks.'
    }
  ]

  const vaultFAQs = [
    {
      id: 'how-it-works',
      question: 'How does this vault work?',
      answer: strategyData.longDescription + ' The vault automatically rebalances positions and manages risk to optimize yields while protecting user capital.'
    },
    {
      id: 'fees',
      question: 'Are there fees for using this vault?',
      answer: `This vault charges a ${strategyData.fees.managementFee}% annual management fee and a ${strategyData.fees.performanceFee}% performance fee on profits.`
    }
  ]

  const faqData = isLeverageToken ? leverageTokenFAQs : vaultFAQs

  // Get related resources based on strategy type and assets
  const getRelatedResources = (strategyId: string) => {
    const baseResources = {
      'Underlying Platforms & Markets': [
        {
          id: 'morpho-market',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this leverage token',
          url: 'https://app.morpho.org/market?id=0x123...',
          icon: Building2,
          iconColor: 'amber',
          badge: 'Primary Market',
          priority: 'high' // High priority items get featured styling
        },
        {
          id: 'ether-fi',
          title: 'Ether.fi Protocol',
          description: 'Learn more about the weETH liquid staking token',
          url: 'https://ether.fi/',
          icon: Globe,
          iconColor: 'blue',
          badge: 'Protocol Info',
          priority: 'medium'
        }
      ],
      'Additional Rewards & Yields': [
        {
          id: 'ether-fi-points',
          title: 'Ether.fi Points',
          description: 'Track your points and rewards from weETH staking activity',
          url: 'https://ether.fi/points',
          icon: Coins,
          iconColor: 'emerald',
          badge: 'Rewards Program',
          priority: 'high'
        },
        {
          id: 'merkl-rewards',
          title: 'Merkl Rewards',
          description: 'Additional DeFi rewards and incentive tracking',
          url: 'https://merkl.xyz/',
          icon: TrendingUp,
          iconColor: 'purple',
          badge: 'Incentives',
          priority: 'medium'
        }
      ]
    }

    // Strategy-specific resource configurations can override or extend base resources
    const strategySpecificResources: Record<string, any> = {
      'weeth-weth-17x': baseResources,
      'seamless-weeth-weth-17x': baseResources,
      'weeth-weth-leverage-token': baseResources,
      
      // Example: Different token might have different resources
      'wsteth-eth-10x': {
        'Underlying Platforms & Markets': [
          {
            id: 'morpho-market',
            title: 'Morpho Lending Market',
            description: 'View the underlying lending market for wstETH/ETH',
            url: 'https://app.morpho.org/market?id=0x456...',
            icon: Building2,
            iconColor: 'amber',
            badge: 'Primary Market',
            priority: 'high'
          },
          {
            id: 'lido',
            title: 'Lido Protocol',
            description: 'Learn more about the wstETH liquid staking token',
            url: 'https://lido.fi/',
            icon: Globe,
            iconColor: 'blue',
            badge: 'Protocol Info',
            priority: 'medium'
          }
        ],
        'Additional Rewards & Yields': [
          {
            id: 'lido-rewards',
            title: 'Lido Rewards',
            description: 'Track your staking rewards from wstETH',
            url: 'https://lido.fi/rewards',
            icon: Coins,
            iconColor: 'emerald',
            badge: 'Staking Rewards',
            priority: 'high'
          }
        ]
      }
    }

    return strategySpecificResources[strategyId] || baseResources
  }

  // Get icon color classes
  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'amber':
        return {
          bg: 'bg-amber-500/20 group-hover:bg-amber-500/30',
          icon: 'text-amber-400',
          hover: 'group-hover:text-amber-200',
          border: 'hover:border-amber-500/50'
        }
      case 'emerald':
        return {
          bg: 'bg-emerald-500/20 group-hover:bg-emerald-500/30',
          icon: 'text-emerald-400',
          hover: 'group-hover:text-emerald-200',
          border: 'hover:border-emerald-500/50'
        }
      case 'blue':
        return {
          bg: 'bg-blue-500/20 group-hover:bg-blue-500/30',
          icon: 'text-blue-400',
          hover: 'group-hover:text-blue-200',
          border: 'hover:border-blue-500/50'
        }
      case 'purple':
        return {
          bg: 'bg-purple-500/20 group-hover:bg-purple-500/30',
          icon: 'text-purple-400',
          hover: 'group-hover:text-purple-200',
          border: 'hover:border-purple-500/50'
        }
      default:
        return {
          bg: 'bg-slate-500/20 group-hover:bg-slate-500/30',
          icon: 'text-slate-400',
          hover: 'group-hover:text-slate-200',
          border: 'hover:border-slate-500/50'
        }
    }
  }

  // Get badge color classes
  const getBadgeColorClasses = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'primary market':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      case 'rewards program':
      case 'staking rewards':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      case 'incentives':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20'
      case 'protocol info':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20'
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20'
    }
  }

  return (
    <motion.div 
      className="min-h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <StrategyBreadcrumb
          items={breadcrumbItems}
          onBack={onBack}
        />
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Strategy Title and Description */}
          <motion.div 
            className="space-y-4 pb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-1">
                {strategyData.assets.map((asset, index) => (
                  <div 
                    key={asset.symbol} 
                    className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden"
                    style={{ zIndex: strategyData.assets.length - index }}
                  >
                    {renderCryptoLogo(asset, 32)}
                  </div>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {strategyData.name}
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-400/20 cursor-help flex items-center gap-1">
                      {strategyData.apy.toFixed(2)}% APY
                      <Info className="w-3 h-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent 
                    className="w-64 p-4 bg-slate-800 border border-slate-600 text-white shadow-xl" 
                    side="bottom" 
                    align="start"
                  >
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white">APY Breakdown</h4>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Base Yield:</span>
                          <span className="text-green-400 font-medium">4.23%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Leverage Multiplier:</span>
                          <span className="text-purple-400 font-medium">17x</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Borrow Cost:</span>
                          <span className="text-red-400 font-medium">-2.89%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Reward APY:</span>
                          <span className="text-cyan-400 font-medium">+3.58%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Points:</span>
                          <span className="text-yellow-400 font-medium">1,426/day</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-600 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total APY:</span>
                          <span className="text-green-400 font-semibold text-lg">{strategyData.apy.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {!isLeverageToken && (
                <Badge variant="outline" className={`${getRiskColor(strategyData.riskLevel)}`}>
                  <RiskIcon className="w-3 h-3 mr-1" />
                  {strategyData.riskLevel} Risk
                </Badge>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed">
              {strategyData.description}
            </p>
          </motion.div>

          {/* Strategy Metrics - Different layout for Vaults vs Leverage Tokens */}
          {isLeverageToken ? (
            /* Leverage Token Metrics Cards */
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* TVL */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">TVL</p>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-white">${formatCurrency(strategyData.tvl)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Collateral */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">Total Collateral</p>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-white">42.86K weETH</p>
                    <p className="text-slate-400 text-sm">~$106.75M</p>
                  </div>
                </CardContent>
              </Card>

              {/* Target Leverage */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">Target Leverage</p>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-white">17.00x</p>
                    <p className="text-slate-400 text-sm">Current: 17x</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Vault Metrics Cards */
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Vault TVL */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">Total Value Locked</p>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-white">${formatCurrency(strategyData.tvl)}</p>
                    <p className="text-slate-400 text-sm">{getVaultMetrics(strategyId).tvl.amount}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Curator */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">Curator</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{getVaultMetrics(strategyId).curator.icon}</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{getVaultMetrics(strategyId).curator.name}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Fee */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">Performance Fee</p>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-white">{getVaultMetrics(strategyId).performanceFee}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timelock Period */}
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm mb-1">Timelock Period</p>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-white">{getVaultMetrics(strategyId).timelockPeriod}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Price/Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg text-white">
                    {isLeverageToken ? 'Price History' : 'Price Performance'}
                  </CardTitle>
                  <p className="text-sm text-slate-400 mt-1">
                    {isLeverageToken ? 'Token price vs underlying assets' : 'Historical price and TVL data'}
                  </p>
                </div>

                {/* Timeframe Selector */}
                <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                  {timeframes.map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedTimeframe === timeframe 
                          ? 'bg-purple-600 text-white' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80 w-full">
                  {isLeverageToken ? (
                    /* Leverage Token Price Chart */
                    <>
                      {/* Chart Legend */}
                      <div className="flex items-center space-x-4 mb-4">
                        {chartLines.map((line) => (
                          <button
                            key={line.key}
                            onClick={() => toggleLineVisibility(line.key)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-md border transition-all ${
                              visibleLines[line.key as keyof typeof visibleLines]
                                ? 'border-slate-600 bg-slate-800/50'
                                : 'border-slate-700 bg-slate-900/50 opacity-50'
                            }`}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: line.color }}
                            />
                            <span className="text-sm text-slate-300">{line.name}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Price Comparison Chart */}
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceData}>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            tickFormatter={formatChartDate}
                          />
                          <YAxis {...getYAxisProps('price', formatPrice)} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1E293B',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              color: '#F8FAFC'
                            }}
                            formatter={(value, name) => [
                              `$${Number(value).toFixed(2)}`,
                              name === 'weethPrice' ? 'weETH Price' : 'Leverage Token Price'
                            ]}
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
                    </>
                  ) : (
                    /* Vault TVL Chart */
                    renderTVLChart()
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Metrics Section - Only for Leverage Tokens */}
          {isLeverageToken && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="bg-slate-900/80 border-slate-700">
                <Collapsible 
                  open={isDetailedMetricsOpen} 
                  onOpenChange={setIsDetailedMetricsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors rounded-t-lg px-6 py-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-white">Detailed Metrics</CardTitle>
                          <p className="text-slate-400 text-sm">
                            Comprehensive leverage token parameters and settings
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className="bg-slate-800/50 text-slate-400 border-slate-600 text-xs"
                          >
                            {isDetailedMetricsOpen ? 'Hide Details' : 'Show Details'}
                          </Badge>
                          {isDetailedMetricsOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-6 pt-0">
                      {Object.entries(getLeverageTokenMetrics(strategyId)).map(([category, metrics]) => (
                        <div key={category} className="space-y-4">
                          {/* Category Header */}
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                              {category}
                            </h3>
                            <div className="flex-1 h-px bg-slate-700" />
                          </div>
                          
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(metrics as any[]).map((metric, index) => (
                              <div 
                                key={index}
                                className={`p-4 rounded-lg border transition-colors ${
                                  metric.highlight 
                                    ? 'bg-slate-800/70 border-slate-600' 
                                    : 'bg-slate-800/50 border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center space-x-1 cursor-help">
                                          <span className="text-slate-400 text-sm">{metric.label}</span>
                                          <Info className="w-3 h-3 text-slate-500" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs bg-slate-800 border border-slate-600 text-white">
                                        <p className="text-sm">{metric.tooltip}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <p className={`text-lg font-semibold ${
                                  metric.color || 'text-white'
                                }`}>
                                  {metric.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.div>
          )}

          {/* Related Resources Section */}
          {isLeverageToken && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="bg-slate-900/80 border-slate-700">
                <Collapsible 
                  open={isRelatedResourcesOpen} 
                  onOpenChange={setIsRelatedResourcesOpen}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors rounded-t-lg px-6 py-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-white">Related Resources</CardTitle>
                          <p className="text-slate-400 text-sm">
                            Explore external platforms and tools related to this strategy
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className="bg-slate-800/50 text-slate-400 border-slate-600 text-xs"
                          >
                            {isRelatedResourcesOpen ? 'Hide Resources' : 'Show Resources'}
                          </Badge>
                          {isRelatedResourcesOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-6 pt-0">
                      {Object.entries(getRelatedResources(strategyId)).map(([category, resources], categoryIndex) => (
                        <div key={category} className="space-y-4">
                          {/* Category Header */}
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                              {category}
                            </h3>
                            <div className="flex-1 h-px bg-slate-700" />
                          </div>
                          
                          {/* Resources Grid */}
                          <div className="grid grid-cols-1 gap-3">
                            {(resources as any[]).map((resource, resourceIndex) => {
                              const IconComponent = resource.icon
                              const colorClasses = getIconColorClasses(resource.iconColor)
                              const badgeClasses = getBadgeColorClasses(resource.badge)
                              const isPrimary = resource.priority === 'high'
                              
                              return (
                                <motion.a
                                  key={resource.id}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`group block p-4 border rounded-lg transition-all duration-200 ${
                                    isPrimary 
                                      ? 'bg-slate-800/70 hover:bg-slate-800/90 border-slate-600 hover:bg-slate-800 ring-1 ring-slate-600/50'
                                      : 'bg-slate-800/50 hover:bg-slate-800/70 border-slate-700'
                                  } hover:border-slate-600 ${colorClasses.border}`}
                                  whileHover={{ scale: 1.005, y: -1 }}
                                  whileTap={{ scale: 0.995 }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: categoryIndex * 0.1 + resourceIndex * 0.05 }}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${colorClasses.bg}`}>
                                      <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className={`font-medium text-white transition-colors ${colorClasses.hover}`}>
                                          {resource.title}
                                        </h4>
                                        <ExternalLink className={`w-4 h-4 text-slate-400 transition-all duration-200 ${colorClasses.hover.replace('group-hover:text-', 'group-hover:text-')} group-hover:translate-x-0.5`} />
                                      </div>
                                      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors mb-3 leading-relaxed">
                                        {resource.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className={`text-xs ${badgeClasses}`}>
                                          {resource.badge}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </motion.a>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.div>
          )}

          {/* FAQ Section */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqData.map((faq) => (
                  <Collapsible 
                    key={faq.id}
                    open={openFAQs.includes(faq.id)}
                    onOpenChange={() => toggleFAQ(faq.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-4 text-left bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 hover:border-slate-600 rounded-lg"
                      >
                        <span className="text-white font-medium">{faq.question}</span>
                        {openFAQs.includes(faq.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                        <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - User Actions & Position */}
        <div className="space-y-6">
          {/* Current Holdings/Position Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  {isLeverageToken ? 'Current Holdings' : 'Your Position'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  {/* Holdings Display - Conditional on Wallet Connection */}
                  {isConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-1">
                          {strategyData.assets.map((asset, index) => (
                            <div 
                              key={asset.symbol} 
                              className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden"
                              style={{ zIndex: strategyData.assets.length - index }}
                            >
                              {renderCryptoLogo(asset, 32)}
                            </div>
                          ))}
                        </div>
                        <div className="text-xl font-medium text-white">
                          {isLeverageToken ? '0.00 WEETH-WETH-17x' : `0.00 ${userPosition.shareToken}`}
                        </div>
                      </div>
                      
                      <div className="text-slate-400">~$0.00</div>
                      
                      <div className="text-white">
                        <span className="font-medium">$0.00</span>
                        <span className="text-slate-400 ml-2">(0.00%)</span>
                        <span className="text-slate-500 ml-2">All time</span>
                      </div>
                    </div>
                  ) : (
                    /* Wallet Not Connected - Holdings Preview */
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                          {isLeverageToken ? (
                            <Zap className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Target className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Connect Your Wallet</h3>
                          <p className="text-sm text-slate-400">
                            {isLeverageToken ? 'View holdings and start minting' : 'View position and start earning'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Always Visible */}
                  <div className="flex space-x-3">
                    {isLeverageToken ? (
                      <>
                        <Button
                          onClick={handleMintClick}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex-1"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Mint
                        </Button>
                        <Button
                          onClick={handleRedeemClick}
                          variant="outline"
                          disabled={isConnected && !userPosition.hasPosition}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          Redeem
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleDepositClick}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex-1"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Deposit
                        </Button>
                        <Button
                          onClick={handleWithdrawClick}
                          variant="outline"
                          disabled={isConnected && !userPosition.hasPosition}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          Withdraw
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      {isLeverageToken ? (
        <>
          <LeverageTokenMintModal
            isOpen={showMintModal}
            onClose={() => setShowMintModal(false)}
            strategyData={strategyData}
          />
          <LeverageTokenRedeemModal
            isOpen={showRedeemModal}
            onClose={() => setShowRedeemModal(false)}
            strategyData={strategyData}
          />
        </>
      ) : (
        <>
          <StrategyDepositModal
            isOpen={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            strategyData={strategyData}
          />
          <StrategyWithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            strategyData={strategyData}
            userPosition={userPosition}
          />
        </>
      )}
    </motion.div>
  )
}