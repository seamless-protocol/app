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
  Vault,
  Users,
  DollarSign,
  Grid3X3,
  TableProperties,
  ExternalLink
} from "lucide-react"
import { StrategyCard } from "../StrategyCard"
import { PillFilter } from "../PillFilter"
import { getStrategiesByCategory, type Strategy as RawStrategy } from "../data/mockStrategyData"

interface VaultsProps {
  onViewStrategy: (strategyId: string) => void
}

export function Vaults({ onViewStrategy }: VaultsProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('apy-desc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table') // Default to table view

  // Get vault strategies data and convert to StrategyCard format
  const allStrategies = useMemo(() => {
    const vaultStrategies = getStrategiesByCategory('Vaults')
    
    // Convert to StrategyCard format
    return vaultStrategies.map(strategy => ({
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
        allocation: undefined // Vaults don't typically show allocation percentages
      })),
      isActive: strategy.isActive,
      isPopular: strategy.tags.includes('Popular'),
      participants: strategy.metrics.participants,
      performance7d: Math.random() > 0.5 ? (Math.random() * 10 - 5) : undefined, // Mock 7d performance
      curator: strategy.curator,
      collateral: strategy.collateral,
      rewards: strategy.rewards
    }))
  }, [])

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let filtered = allStrategies

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(strategy => {
        if (activeCategory === 'stablecoins') {
          return strategy.assets.some(asset => asset.symbol === 'USDC')
        }
        if (activeCategory === 'crypto-assets') {
          return strategy.assets.some(asset => ['cbBTC', 'WETH'].includes(asset.symbol))
        }
        return true
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
      name: 'All Vaults', 
      count: allStrategies.length,
      icon: <Target className="h-4 w-4" />
    },
    { 
      id: 'stablecoins', 
      name: 'Stablecoins', 
      count: allStrategies.filter(s => s.assets.some(asset => asset.symbol === 'USDC')).length,
      icon: <Shield className="h-4 w-4" />
    },
    { 
      id: 'crypto-assets', 
      name: 'Crypto Assets', 
      count: allStrategies.filter(s => s.assets.some(asset => ['cbBTC', 'WETH'].includes(asset.symbol))).length,
      icon: <Vault className="h-4 w-4" />
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
  const renderAssetLogo = (asset: { symbol: string; logo: React.ComponentType<any> }, size: number = 24) => {
    const LogoComponent = asset.logo
    return <LogoComponent size={size} />
  }

  // Table view component
  const TableView = () => (
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
              <TableHead className="text-slate-300 font-medium py-4 px-6">Vault</TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6">Assets</TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">APY</TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">TVL</TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">Risk</TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">Participants</TableHead>
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
                <TableCell className="py-4 px-6">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white text-sm">{strategy.name}</h4>
                      {strategy.isPopular && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 px-2 py-0.5">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{strategy.description}</p>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-1">
                    {strategy.assets.slice(0, 3).map((asset, idx) => (
                      <div key={idx} className="flex items-center space-x-1">
                        <div className="w-6 h-6 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center p-0.5">
                          {renderAssetLogo(asset, 20)}
                        </div>
                        {idx < Math.min(strategy.assets.length - 1, 2) && (
                          <span className="text-slate-500 text-xs">/</span>
                        )}
                      </div>
                    ))}
                    {strategy.assets.length > 3 && (
                      <span className="text-xs text-slate-400">+{strategy.assets.length - 3}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-green-400 font-medium text-sm">{strategy.apy.toFixed(2)}%</span>
                    {strategy.performance7d && (
                      <span className={`text-xs ${strategy.performance7d > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {strategy.performance7d > 0 ? '+' : ''}{strategy.performance7d.toFixed(1)}% 7d
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <span className="text-slate-300 font-medium text-sm">{formatCurrency(strategy.tvl)}</span>
                </TableCell>
                <TableCell className="py-4 px-6 text-center">
                  <Badge className={`text-xs px-2 py-1 ${getRiskLevelColor(strategy.riskLevel)}`}>
                    {strategy.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Users className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-300 text-sm">{strategy.participants?.toLocaleString()}</span>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
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
          <h1 className="text-xl sm:text-2xl font-bold text-white">Secure Vaults</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">Automated yield strategies with institutional-grade security</p>
        </div>
      </motion.div>

      {/* Vault Overview Cards - Mobile Optimized */}
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
                <p className="text-sm text-slate-400">Total Vaults</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{allStrategies.length}</p>
                <p className="text-xs text-slate-400 mt-1">Available now</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Vault className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
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
                  Across all vaults
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
                  <h3 className="text-lg font-medium text-white">Find Vaults</h3>
                  <p className="text-sm text-slate-400">Search, filter, and organize vaults to match your investment strategy</p>
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
                  placeholder="Search vaults, assets, or strategies..."
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

      {/* Vault Results */}
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
                      {filteredStrategies.length} {filteredStrategies.length === 1 ? 'Vault' : 'Vaults'}
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

                {/* Vault Display - Table or Cards */}
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
                  <h3 className="text-xl font-medium text-white mb-3">No vaults found</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    {searchQuery 
                      ? `No results found for "${searchQuery}". Try adjusting your search terms or filters.`
                      : 'No vaults match your current filters. Try selecting a different category.'
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