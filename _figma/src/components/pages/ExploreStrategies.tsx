"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

import { 
  Search, 
  Filter, 
  TrendingUp,
  Shield,
  AlertTriangle,
  Target,
  Zap,
  Users,
  DollarSign,
  Grid3X3,
  TableProperties,
  ExternalLink,
  Info,
  BarChart3,
  TrendingDown
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { StrategyCard } from "../StrategyCard"
import { PillFilter } from "../PillFilter"
import { getStrategiesByCategory, type Strategy as RawStrategy } from "../data/mockStrategyData"

interface ExploreStrategiesProps {
  onViewStrategy: (strategyId: string) => void
}

export function ExploreStrategies({ onViewStrategy }: ExploreStrategiesProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('apy-desc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table') // Default to table view

  // Get strategies data and convert to StrategyCard format (only leverage tokens)
  const allStrategies = useMemo(() => {
    const leverageStrategies = getStrategiesByCategory('Leverage Tokens')
    const allRawStrategies = [...leverageStrategies]
    
    // Convert to StrategyCard format
    return allRawStrategies.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      apy: strategy.apy,
      tvl: strategy.tvl,
      riskLevel: strategy.riskLevel as 'Low' | 'Medium' | 'High',
      category: strategy.category,
      assets: strategy.assets.map(asset => ({
        symbol: asset.symbol,
        logo: asset.logo,
        allocation: undefined // Leverage tokens don't typically show allocation percentages
      })),
      isActive: strategy.isActive,
      isPopular: strategy.tags.includes('Popular'),
      participants: strategy.metrics.participants,
      performance7d: Math.random() > 0.5 ? (Math.random() * 10 - 5) : undefined, // Mock 7d performance
      curator: strategy.curator,
      collateral: strategy.collateral,
      rewards: strategy.rewards,
      leverageToken: strategy.leverageToken // Include leverage token data
    }))
  }, [])

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let filtered = allStrategies

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(strategy => 
        strategy.category.toLowerCase().replace(/\s+/g, '-') === activeCategory
      )
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(strategy =>
        strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.assets.some(asset => 
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Sort strategies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'apy-desc':
          return b.apy - a.apy
        case 'apy-asc':
          return a.apy - b.apy
        case 'tvl-desc':
          return b.tvl - a.tvl
        case 'tvl-asc':
          return a.tvl - b.tvl
        case 'name-asc':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [allStrategies, activeCategory, searchQuery, sortBy])

  const categories = [
    { 
      id: 'all', 
      name: 'All Leverage Tokens', 
      count: allStrategies.length,
      icon: <Target className="h-4 w-4" />
    },
    { 
      id: 'leverage-tokens', 
      name: 'Leverage Tokens', 
      count: getStrategiesByCategory('Leverage Tokens').length,
      icon: <Zap className="h-4 w-4" />
    }
  ]

  const sortOptions = [
    { value: 'apy-desc', label: 'Highest APY' },
    { value: 'apy-asc', label: 'Lowest APY' },
    { value: 'tvl-desc', label: 'Highest TVL' },
    { value: 'tvl-asc', label: 'Lowest TVL' },
    { value: 'name-asc', label: 'Name (A-Z)' }
  ]

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    } else {
      return `${amount.toFixed(0)}`
    }
  }

  // Get risk level color
  const getRiskLevelColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'high': return 'text-red-400 bg-red-400/10'
      default: return 'text-slate-400 bg-slate-400/10'
    }
  }

  // Render crypto logo component
  const renderAssetLogo = (asset: { symbol: string; logo: React.ComponentType<any> }, size: number = 20) => {
    const LogoComponent = asset.logo
    return <LogoComponent size={size} />
  }

  // Create APY breakdown tooltip content
  const APYBreakdownTooltip = ({ leverageToken }: { leverageToken: any }) => (
    <div className="space-y-2 p-2">
      <div className="font-medium text-white">APY Breakdown</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-300">Base Yield:</span>
          <span className="text-green-400">{leverageToken.apyBreakdown.baseYield.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Leverage Multiplier:</span>
          <span className="text-purple-400">{leverageToken.apyBreakdown.leverageMultiplier}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Borrow Cost:</span>
          <span className="text-red-400">-{leverageToken.apyBreakdown.borrowCost.toFixed(2)}%</span>
        </div>
        <div className="border-t border-slate-600 pt-1 mt-1">
          <div className="flex justify-between font-medium">
            <span className="text-white">Net APY:</span>
            <span className="text-green-400">{leverageToken.apyBreakdown.netAPY.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Table view component with leverage token specific data
  const TableView = () => (
    <TooltipProvider>
      <motion.div 
        className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-300 font-medium py-4 px-6 min-w-[200px]">Token Name/Symbol</TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">TVL</TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center min-w-[120px]">Collateral Asset</TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center min-w-[120px]">Debt Asset</TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">APY</TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">Leverage</TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right min-w-[140px]">Supply Cap Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStrategies.map((strategy, index) => (
                <motion.tr
                  key={strategy.id}
                  className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => onViewStrategy(strategy.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "rgba(100, 116, 139, 0.1)" }}
                >
                  {/* Token Name/Symbol */}
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-3">
                        {/* Asset Logos */}
                        <div className="flex -space-x-1">
                          {strategy.assets.map((asset, index) => (
                            <div
                              key={asset.symbol}
                              className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center p-0.5"
                              style={{ zIndex: strategy.assets.length - index }}
                            >
                              {renderAssetLogo(asset, 20)}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <h4 className="font-medium text-white text-sm truncate">{strategy.name}</h4>
                          {strategy.isPopular && (
                            <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 px-2 py-0.5 shrink-0">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* TVL */}
                  <TableCell className="py-4 px-6 text-right">
                    <span className="text-slate-300 font-medium text-sm">{formatCurrency(strategy.tvl)}</span>
                  </TableCell>

                  {/* Collateral Asset */}
                  <TableCell className="py-4 px-6 text-center">
                    {strategy.leverageToken && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="flex items-center space-x-2 mx-auto p-1 rounded hover:bg-slate-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`https://etherscan.io/token/${strategy.leverageToken?.collateralAsset.symbol}`, '_blank')
                            }}
                          >
                            <div className="w-6 h-6 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center p-0.5">
                              {renderAssetLogo({
                                symbol: strategy.leverageToken.collateralAsset.symbol,
                                logo: strategy.leverageToken.collateralAsset.logo
                              }, 20)}
                            </div>
                            <span className="text-slate-300 text-sm font-medium">{strategy.leverageToken.collateralAsset.symbol}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View {strategy.leverageToken.collateralAsset.name} on Etherscan</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Debt Asset */}
                  <TableCell className="py-4 px-6 text-center">
                    {strategy.leverageToken && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="flex items-center space-x-2 mx-auto p-1 rounded hover:bg-slate-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`https://etherscan.io/token/${strategy.leverageToken?.debtAsset.symbol}`, '_blank')
                            }}
                          >
                            <div className="w-6 h-6 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center p-0.5">
                              {renderAssetLogo({
                                symbol: strategy.leverageToken.debtAsset.symbol,
                                logo: strategy.leverageToken.debtAsset.logo
                              }, 20)}
                            </div>
                            <span className="text-slate-300 text-sm font-medium">{strategy.leverageToken.debtAsset.symbol}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View {strategy.leverageToken.debtAsset.name} on Etherscan</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* APY with Breakdown */}
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className="text-green-400 font-medium text-sm">{strategy.apy.toFixed(2)}%</span>
                      {strategy.leverageToken && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-300 transition-colors" onClick={(e) => e.stopPropagation()}>
                              <Info className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-slate-800 border-slate-700">
                            <APYBreakdownTooltip leverageToken={strategy.leverageToken} />
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  {/* Leverage Amount */}
                  <TableCell className="py-4 px-6 text-center">
                    {strategy.leverageToken && (
                      <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-2 py-1 rounded border border-purple-500/30">
                        <BarChart3 className="h-3 w-3 text-purple-400" />
                        <span className="text-purple-400 font-medium text-sm">{strategy.leverageToken.leverageAmount}x</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Supply Cap Available */}
                  <TableCell className="py-4 px-6 text-right">
                    {strategy.leverageToken && (() => {
                      const fillPercentage = (strategy.leverageToken.currentSupply / strategy.leverageToken.supplyCap) * 100;
                      const isNearCapacity = fillPercentage >= 90;
                      
                      return (
                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-2">
                            {isNearCapacity && (
                              <AlertTriangle className="w-3 h-3 text-warning-yellow" />
                            )}
                            <span className={`text-sm ${isNearCapacity ? 'text-warning-yellow' : 'text-slate-300'}`}>
                              {(strategy.leverageToken.supplyCap - strategy.leverageToken.currentSupply).toLocaleString()}
                            </span>
                            <span className="text-slate-500 text-xs">/ {strategy.leverageToken.supplyCap.toLocaleString()}</span>
                          </div>
                          <div className="w-20 bg-slate-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                isNearCapacity 
                                  ? 'bg-gradient-to-r from-warning-yellow to-error-red' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
                              }`}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`text-xs ${isNearCapacity ? 'text-warning-yellow font-medium' : 'text-slate-400'}`}>
                              {fillPercentage.toFixed(1)}% filled
                            </span>
                            {isNearCapacity && (
                              <span className="text-xs text-warning-yellow font-medium">⚠</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </TooltipProvider>
  )

  return (
    <motion.div 
      className="space-y-6 sm:space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Mobile Optimized */}
      <motion.div 
        className="flex flex-col space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Leverage Tokens</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">Discover leverage token opportunities tailored to your risk profile</p>
        </div>
      </motion.div>

      {/* Strategy Overview Cards - Mobile Optimized */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Leverage Tokens</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{allStrategies.length}</p>
                <p className="text-xs text-slate-400 mt-1">Available now</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Average APY</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {(allStrategies.reduce((sum, s) => sum + s.apy, 0) / allStrategies.length).toFixed(2)}%
                </p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Across all leverage tokens
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total TVL</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  ${(allStrategies.reduce((sum, s) => sum + s.tvl, 0) / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-slate-400 mt-1">Locked value</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Unified Controls Module */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-medium text-white">Find Leverage Tokens</h3>
                  <p className="text-sm text-slate-400">Search, filter, and organize leverage tokens to match your strategy</p>
                </div>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-600"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Results for "{searchQuery}"
                  </motion.div>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search leverage tokens, assets, or strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white h-12 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Category Filters */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Categories</span>
                </div>
                <div className="overflow-x-auto pb-2">
                  <PillFilter
                    options={categories}
                    activeValue={activeCategory}
                    onValueChange={setActiveCategory}
                    size="md"
                    showCounts={true}
                  />
                </div>
              </div>

              {/* Sort and View Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pt-4 border-t border-slate-700">
                {/* Sort Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Sort by</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-800 border border-slate-600 text-white px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-10 w-full sm:w-48"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-slate-300">View</span>
                  <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-600">
                    <Button
                      size="sm"
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('table')}
                      className={`h-8 px-3 text-xs transition-all duration-200 ${
                        viewMode === 'table' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-md' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      aria-label="Table view"
                    >
                      <TableProperties className="h-3 w-3 mr-1" />
                      Table
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'cards' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('cards')}
                      className={`h-8 px-3 text-xs transition-all duration-200 ${
                        viewMode === 'cards' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-md' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      aria-label="Card view"
                    >
                      <Grid3X3 className="h-3 w-3 mr-1" />
                      Cards
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strategy Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {filteredStrategies.length > 0 ? (
              <div className="space-y-6">
                {/* Results Summary */}
                <motion.div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <h4 className="text-lg font-medium text-white">
                      {filteredStrategies.length} {filteredStrategies.length === 1 ? 'Leverage Token' : 'Leverage Tokens'}
                    </h4>
                    {activeCategory !== 'all' && (
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 w-fit">
                        {categories.find(c => c.id === activeCategory)?.name}
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600 w-fit">
                        Search: "{searchQuery}"
                      </Badge>
                    )}
                  </div>
                  
                  <motion.div 
                    className="text-sm text-slate-400 flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Sorted by {sortOptions.find(s => s.value === sortBy)?.label}</span>
                  </motion.div>
                </motion.div>

                {/* Strategy Display - Table or Cards */}
                {viewMode === 'table' ? (
                  <TableView />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredStrategies.map((strategy, index) => (
                      <motion.div
                        key={strategy.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <StrategyCard 
                          strategy={strategy}
                          onViewStrategy={onViewStrategy}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                className="text-center py-16 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-20 h-20 mx-auto bg-slate-800/60 rounded-full flex items-center justify-center border-2 border-slate-700">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white mb-3">No leverage tokens found</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    {searchQuery 
                      ? `No results found for "${searchQuery}". Try adjusting your search terms or filters.`
                      : 'No leverage tokens match your current filters. Try selecting a different category.'
                    }
                  </p>
                </div>
                {(searchQuery || activeCategory !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setActiveCategory('all')
                    }}
                    className="mt-6 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}