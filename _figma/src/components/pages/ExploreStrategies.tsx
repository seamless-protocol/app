"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination"

import { 
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  DollarSign,
  ExternalLink,
  Info,
  BarChart3,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { StreamlinedFilterBar } from "../StreamlinedFilterBar"
import { getStrategiesByCategory, type Strategy as RawStrategy } from "../data/mockStrategyData"
import BaseLogo from "../../imports/BaseLogo"

interface ExploreStrategiesProps {
  onViewStrategy: (strategyId: string) => void
}

export function ExploreStrategies({ onViewStrategy }: ExploreStrategiesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [collateralFilter, setCollateralFilter] = useState('all')
  const [debtFilter, setDebtFilter] = useState('all')
  const [supplyCapFilter, setSupplyCapFilter] = useState('all')
  const [sortField, setSortField] = useState<string>('apy')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
      leverageToken: strategy.leverageToken ? {
        ...strategy.leverageToken,
        // Add mock reward APY and points data
        apyBreakdown: {
          ...strategy.leverageToken.apyBreakdown,
          rewardAPY: Math.random() * 5 + 2, // Mock reward APY between 2-7%
          points: Math.floor(Math.random() * 1000 + 500) // Mock points between 500-1500
        }
      } : undefined,
      isInWallet: Math.random() > 0.7 // Mock wallet ownership
    }))
  }, [])

  // Get featured leverage tokens (highest APY and most rewards)
  const featuredTokens = useMemo(() => {
    return allStrategies
      .filter(strategy => strategy.leverageToken)
      .sort((a, b) => {
        // Sort by combined score of APY and reward APY
        const aScore = a.apy + (a.leverageToken?.apyBreakdown?.rewardAPY || 0)
        const bScore = b.apy + (b.leverageToken?.apyBreakdown?.rewardAPY || 0)
        return bScore - aScore
      })
      .slice(0, 3) // Top 3 featured tokens
  }, [allStrategies])

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let filtered = allStrategies

    // Filter by collateral asset
    if (collateralFilter !== 'all') {
      filtered = filtered.filter(strategy =>
        strategy.leverageToken?.collateralAsset.symbol === collateralFilter
      )
    }

    // Filter by debt asset
    if (debtFilter !== 'all') {
      filtered = filtered.filter(strategy =>
        strategy.leverageToken?.debtAsset.symbol === debtFilter
      )
    }

    // Filter by supply cap availability
    if (supplyCapFilter !== 'all') {
      filtered = filtered.filter(strategy => {
        if (!strategy.leverageToken) return false
        const available = strategy.leverageToken.supplyCap - strategy.leverageToken.currentSupply
        
        if (supplyCapFilter === 'available') {
          return available > 0
        } else if (supplyCapFilter === 'not-available') {
          return available <= 0
        }
        return true // 'both' option shows all
      })
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
      let result = 0
      
      switch (sortField) {
        case 'name':
          result = a.name.localeCompare(b.name)
          break
        case 'tvl':
          result = a.tvl - b.tvl
          break
        case 'apy':
          result = a.apy - b.apy
          break
        case 'leverage':
          const aLeverage = a.leverageToken?.leverageAmount || 0
          const bLeverage = b.leverageToken?.leverageAmount || 0
          result = aLeverage - bLeverage
          break
        case 'supplyCap':
          const aAvailable = a.leverageToken ? (a.leverageToken.supplyCap - a.leverageToken.currentSupply) : 0
          const bAvailable = b.leverageToken ? (b.leverageToken.supplyCap - b.leverageToken.currentSupply) : 0
          result = aAvailable - bAvailable
          break
        default:
          result = 0
      }
      
      return sortDirection === 'desc' ? -result : result
    })

    return filtered
  }, [allStrategies, collateralFilter, debtFilter, supplyCapFilter, searchQuery, sortField, sortDirection])

  // Handle column sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default direction
      setSortField(field)
      setSortDirection(['name'].includes(field) ? 'asc' : 'desc')
    }
  }

  // Get sort icon for column header
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-500" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-purple-400" />
      : <ArrowDown className="h-3 w-3 text-purple-400" />
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, collateralFilter, debtFilter, supplyCapFilter, sortField, sortDirection])

  // Paginated strategies
  const paginatedStrategies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredStrategies.slice(startIndex, endIndex)
  }, [filteredStrategies, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredStrategies.length / itemsPerPage)

  // Filter options
  const collateralOptions = [
    { value: 'all', label: 'All Assets', count: allStrategies.length },
    { value: 'weETH', label: 'weETH', count: allStrategies.filter(s => s.leverageToken?.collateralAsset.symbol === 'weETH').length },
    { value: 'WETH', label: 'WETH', count: allStrategies.filter(s => s.leverageToken?.collateralAsset.symbol === 'WETH').length }
  ]

  const debtOptions = [
    { value: 'all', label: 'All Debt Assets', count: allStrategies.length },
    { value: 'WETH', label: 'WETH', count: allStrategies.filter(s => s.leverageToken?.debtAsset.symbol === 'WETH').length },
    { value: 'USDC', label: 'USDC', count: allStrategies.filter(s => s.leverageToken?.debtAsset.symbol === 'USDC').length }
  ]

  const supplyCapOptions = [
    { value: 'all', label: 'Both', count: allStrategies.length },
    { value: 'available', label: 'Available', count: allStrategies.filter(s => {
      if (!s.leverageToken) return false
      return (s.leverageToken.supplyCap - s.leverageToken.currentSupply) > 0
    }).length },
    { value: 'not-available', label: 'Not Available', count: allStrategies.filter(s => {
      if (!s.leverageToken) return false
      return (s.leverageToken.supplyCap - s.leverageToken.currentSupply) <= 0
    }).length }
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

  // Render crypto logo component
  const renderAssetLogo = (asset: { symbol: string; logo: React.ComponentType<any> }, size: number = 20) => {
    const LogoComponent = asset.logo
    return <LogoComponent size={size} />
  }

  // Render chain logo component
  const renderChainLogo = (chain: { id: string; name: string; logo: React.ComponentType<any> }, size: number = 20) => {
    const LogoComponent = chain.logo
    return <LogoComponent size={size} />
  }

  // Enhanced APY breakdown tooltip with better spacing and additional fields
  const APYBreakdownTooltip = ({ leverageToken }: { leverageToken: any }) => (
    <div className="space-y-4 p-4 min-w-[240px]">
      <div className="font-semibold text-white text-sm">APY Breakdown</div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-300">Base Yield:</span>
          <span className="text-green-400 font-medium">{leverageToken.apyBreakdown.baseYield.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Leverage Multiplier:</span>
          <span className="text-purple-400 font-medium">{leverageToken.apyBreakdown.leverageMultiplier}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Borrow Cost:</span>
          <span className="text-red-400 font-medium">-{leverageToken.apyBreakdown.borrowCost.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Reward APY:</span>
          <span className="text-cyan-400 font-medium">+{leverageToken.apyBreakdown.rewardAPY.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Points:</span>
          <span className="text-yellow-400 font-medium">{leverageToken.apyBreakdown.points.toLocaleString()}/day</span>
        </div>
        <div className="border-t border-slate-600 pt-3 mt-3">
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total APY:</span>
            <span className="text-green-400">{leverageToken.apyBreakdown.netAPY.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of table
    document.getElementById('leverage-tokens-table')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Featured Leverage Tokens Section */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span>Featured High-Reward Tokens</span>
          </h2>
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
            Top Rewards
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {featuredTokens.map((token, index) => (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-slate-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
                onClick={() => onViewStrategy(token.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-1">
                        {token.assets.map((asset, assetIndex) => (
                          <div
                            key={asset.symbol}
                            className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center p-0.5"
                            style={{ zIndex: token.assets.length - assetIndex }}
                          >
                            {renderAssetLogo(asset, 20)}
                          </div>
                        ))}
                      </div>
                      <h3 className="font-medium text-white text-sm truncate">{token.name}</h3>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">APY</span>
                      <span className="text-green-400 font-medium">{token.apy.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Reward APY</span>
                      <span className="text-cyan-400 font-medium">+{token.leverageToken?.apyBreakdown?.rewardAPY.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Points/Day</span>
                      <span className="text-yellow-400 font-medium">{token.leverageToken?.apyBreakdown?.points.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                      <span className="text-slate-400 text-sm">Leverage</span>
                      <span className="text-purple-400 font-medium">{token.leverageToken?.leverageAmount}x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <StreamlinedFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search leverage tokens..."
          primaryFilter={{
            label: "Collateral",
            value: collateralFilter,
            options: collateralOptions,
            onChange: setCollateralFilter
          }}
          secondaryFilter={{
            label: "Debt Asset",
            value: debtFilter,
            options: debtOptions,
            onChange: setDebtFilter
          }}
          tertiaryFilter={{
            label: "Supply Cap",
            value: supplyCapFilter,
            options: supplyCapOptions,
            onChange: setSupplyCapFilter
          }}
          resultsCount={filteredStrategies.length}
          totalCount={allStrategies.length}
          itemLabel="leverage tokens"
        />
      </motion.div>

      {/* Table View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <TooltipProvider>
          <motion.div 
            id="leverage-tokens-table"
            className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300 font-medium py-4 px-6 min-w-[250px]">
                      <button 
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-2 hover:text-white transition-colors"
                      >
                        <span>Leverage Token Name</span>
                        {getSortIcon('name')}
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                      <button 
                        onClick={() => handleSort('tvl')}
                        className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                      >
                        <span>TVL</span>
                        {getSortIcon('tvl')}
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                      <button 
                        onClick={() => handleSort('apy')}
                        className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                      >
                        <span>APY</span>
                        {getSortIcon('apy')}
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">
                      <button 
                        onClick={() => handleSort('leverage')}
                        className="flex items-center space-x-2 hover:text-white transition-colors mx-auto"
                      >
                        <span>Leverage</span>
                        {getSortIcon('leverage')}
                      </button>
                    </TableHead>
                    <TableHead className="text-slate-300 font-medium py-4 px-6 text-right min-w-[140px]">
                      <button 
                        onClick={() => handleSort('supplyCap')}
                        className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                      >
                        <span>Supply Cap</span>
                        {getSortIcon('supplyCap')}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStrategies.map((strategy, index) => (
                    <motion.tr
                      key={strategy.id}
                      className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => onViewStrategy(strategy.id)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(100, 116, 139, 0.1)" }}
                    >
                      {/* Token Name/Symbol with Enhanced Asset Logos */}
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-3">
                            {/* Asset Logos with Tooltips and Etherscan Links */}
                            <div className="flex -space-x-1">
                              {strategy.leverageToken && (
                                <>
                                  {/* Collateral Asset Logo */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center p-0.5 hover:border-purple-500/50 transition-all duration-200 group z-20"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(`https://etherscan.io/token/${strategy.leverageToken?.collateralAsset.symbol}`, '_blank')
                                        }}
                                      >
                                        {renderAssetLogo({
                                          symbol: strategy.leverageToken.collateralAsset.symbol,
                                          logo: strategy.leverageToken.collateralAsset.logo
                                        }, 20)}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black border-slate-600 text-white shadow-lg shadow-black/25">
                                      <p className="font-medium">
                                        {strategy.leverageToken.collateralAsset.name} (Collateral)
                                        <br />
                                        <span className="text-slate-400 text-sm">Click to view on Etherscan</span>
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* Debt Asset Logo */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center p-0.5 hover:border-purple-500/50 transition-all duration-200 group z-10"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(`https://etherscan.io/token/${strategy.leverageToken?.debtAsset.symbol}`, '_blank')
                                        }}
                                      >
                                        {renderAssetLogo({
                                          symbol: strategy.leverageToken.debtAsset.symbol,
                                          logo: strategy.leverageToken.debtAsset.logo
                                        }, 20)}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black border-slate-600 text-white shadow-lg shadow-black/25">
                                      <p className="font-medium">
                                        {strategy.leverageToken.debtAsset.name} (Debt)
                                        <br />
                                        <span className="text-slate-400 text-sm">Click to view on Etherscan</span>
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <h4 className="font-medium text-white text-sm truncate">{strategy.name}</h4>
                              {/* Chain Badge */}
                              {strategy.leverageToken && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center space-x-1 bg-slate-800/60 hover:bg-slate-700/60 px-2 py-1 rounded-full border border-slate-600/50 transition-colors">
                                      <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center">
                                        {renderChainLogo(strategy.leverageToken.chain, 12)}
                                      </div>
                                      <span className="text-xs text-slate-300 font-medium">{strategy.leverageToken.chain.id === 'ethereum' ? 'Ethereum' : strategy.leverageToken.chain.name}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-black border-slate-600 text-white shadow-lg shadow-black/25">
                                    <p className="font-medium">Deployed on {strategy.leverageToken.chain.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* TVL */}
                      <TableCell className="py-4 px-6 text-right">
                        <span className="text-slate-300 font-medium text-sm">{formatCurrency(strategy.tvl)}</span>
                      </TableCell>

                      {/* APY with Tooltip */}
                      <TableCell className="py-4 px-6 text-right">
                        {strategy.leverageToken ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center space-x-1 cursor-help">
                                <span className="text-green-400 font-medium">{strategy.apy.toFixed(2)}%</span>
                                <Info className="h-3 w-3 text-slate-500 hover:text-purple-400 transition-colors" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black border-slate-600 text-white shadow-lg shadow-black/25">
                              <APYBreakdownTooltip leverageToken={strategy.leverageToken} />
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-green-400 font-medium">{strategy.apy.toFixed(2)}%</span>
                        )}
                      </TableCell>

                      {/* Leverage */}
                      <TableCell className="py-4 px-6 text-center">
                        {strategy.leverageToken && (
                          <Badge 
                            variant="outline" 
                            className="text-purple-400 border-purple-400/30 bg-purple-400/10 text-sm font-medium"
                          >
                            {strategy.leverageToken.leverageAmount}x
                          </Badge>
                        )}
                      </TableCell>

                      {/* Supply Cap */}
                      <TableCell className="py-4 px-6 text-right">
                        {strategy.leverageToken && (
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-slate-300 font-medium text-sm">
                              {formatCurrency(strategy.leverageToken.supplyCap - strategy.leverageToken.currentSupply)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min(100, (strategy.leverageToken.currentSupply / strategy.leverageToken.supplyCap) * 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">
                                {Math.round((strategy.leverageToken.currentSupply / strategy.leverageToken.supplyCap) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-slate-700 py-4 px-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) handlePageChange(currentPage - 1)
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-800'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(pageNum)
                            }}
                            isActive={currentPage === pageNum}
                            className={currentPage === pageNum 
                              ? 'bg-purple-600 text-white' 
                              : 'hover:bg-slate-800 text-slate-300'
                            }
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis className="text-slate-500" />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(totalPages)
                            }}
                            className="hover:bg-slate-800 text-slate-300"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) handlePageChange(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-slate-800'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </motion.div>
        </TooltipProvider>
      </motion.div>

      {/* Empty State */}
      {filteredStrategies.length === 0 && (
        <motion.div
          className="text-center py-12 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-center">
            <Search className="h-12 w-12 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-400">No leverage tokens found</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Try adjusting your search query or filters to find leverage tokens that match your criteria.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('')
              setCollateralFilter('all')
              setDebtFilter('all')
              setSupplyCapFilter('all')
            }}
            className="border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Clear all filters
          </Button>
        </motion.div>
      )}
    </div>
  )
}