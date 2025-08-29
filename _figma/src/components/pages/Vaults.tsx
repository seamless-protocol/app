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
  Target,
  Vault,
  Users,
  DollarSign,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { StreamlinedFilterBar } from "../StreamlinedFilterBar"
import { getStrategiesByCategory, type Strategy as RawStrategy } from "../data/mockStrategyData"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import BaseLogo from "../../imports/BaseLogo"

interface VaultsProps {
  onViewStrategy: (strategyId: string) => void
}

export function Vaults({ onViewStrategy }: VaultsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState('all')
  const [riskLevelFilter, setRiskLevelFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [sortField, setSortField] = useState<string>('apy')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
      rewards: strategy.rewards,
      chain: strategy.chain,
      isInWallet: Math.random() > 0.6 // Mock wallet ownership
    }))
  }, [])

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let filtered = allStrategies

    // Filter by asset type
    if (assetTypeFilter !== 'all') {
      filtered = filtered.filter(strategy => {
        if (assetTypeFilter === 'stablecoins') {
          return strategy.assets.some(asset => asset.symbol === 'USDC')
        }
        if (assetTypeFilter === 'crypto-assets') {
          return strategy.assets.some(asset => ['cbBTC', 'WETH'].includes(asset.symbol))
        }
        return true
      })
    }

    // Filter by risk level
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(strategy => 
        strategy.riskLevel.toLowerCase() === riskLevelFilter
      )
    }

    // Filter by availability
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(strategy => {
        if (availabilityFilter === 'active') {
          return strategy.isActive
        } else if (availabilityFilter === 'inactive') {
          return !strategy.isActive
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
        case 'risk':
          const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3 }
          const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder] || 0
          const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder] || 0
          result = aRisk - bRisk
          break
        case 'participants':
          result = (a.participants || 0) - (b.participants || 0)
          break
        case 'assets':
          // Sort by asset count, then by first asset symbol
          const assetCountDiff = a.assets.length - b.assets.length
          if (assetCountDiff !== 0) {
            result = assetCountDiff
          } else {
            result = (a.assets[0]?.symbol || '').localeCompare(b.assets[0]?.symbol || '')
          }
          break
        default:
          result = 0
      }
      
      return sortDirection === 'desc' ? -result : result
    })

    return filtered
  }, [allStrategies, assetTypeFilter, riskLevelFilter, availabilityFilter, searchQuery, sortField, sortDirection])

  // Handle column sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default direction
      setSortField(field)
      setSortDirection(['name', 'assets', 'risk'].includes(field) ? 'asc' : 'desc')
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
  }, [searchQuery, assetTypeFilter, riskLevelFilter, availabilityFilter, sortField, sortDirection])

  // Paginated strategies
  const paginatedStrategies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredStrategies.slice(startIndex, endIndex)
  }, [filteredStrategies, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredStrategies.length / itemsPerPage)

  // Filter options
  const assetTypeOptions = [
    { value: 'all', label: 'All Assets', count: allStrategies.length },
    { value: 'stablecoins', label: 'Stablecoins', count: allStrategies.filter(s => s.assets.some(asset => asset.symbol === 'USDC')).length },
    { value: 'crypto-assets', label: 'Crypto Assets', count: allStrategies.filter(s => s.assets.some(asset => ['cbBTC', 'WETH'].includes(asset.symbol))).length }
  ]

  const riskLevelOptions = [
    { value: 'all', label: 'All Risk Levels', count: allStrategies.length },
    { value: 'low', label: 'Low Risk', count: allStrategies.filter(s => s.riskLevel === 'Low').length },
    { value: 'medium', label: 'Medium Risk', count: allStrategies.filter(s => s.riskLevel === 'Medium').length },
    { value: 'high', label: 'High Risk', count: allStrategies.filter(s => s.riskLevel === 'High').length }
  ]

  const availabilityOptions = [
    { value: 'all', label: 'Both', count: allStrategies.length },
    { value: 'active', label: 'Active', count: allStrategies.filter(s => s.isActive).length },
    { value: 'inactive', label: 'Inactive', count: allStrategies.filter(s => !s.isActive).length }
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

  // Render chain logo component
  const renderChainLogo = (chain: { id: string; name: string; logo: React.ComponentType<any> }, size: number = 20) => {
    const LogoComponent = chain.logo
    return <LogoComponent size={size} />
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of table
    document.getElementById('vaults-table')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Table view component
  const TableView = () => (
    <TooltipProvider>
      <motion.div 
        id="vaults-table"
        className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800/50">
              <TableHead className="text-slate-300 font-medium py-4 px-6">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-2 hover:text-white transition-colors"
                >
                  <span>Vault</span>
                  {getSortIcon('name')}
                </button>
              </TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6">
                <button 
                  onClick={() => handleSort('assets')}
                  className="flex items-center space-x-2 hover:text-white transition-colors"
                >
                  <span>Assets</span>
                  {getSortIcon('assets')}
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
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                <button 
                  onClick={() => handleSort('tvl')}
                  className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                >
                  <span>TVL</span>
                  {getSortIcon('tvl')}
                </button>
              </TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">
                <button 
                  onClick={() => handleSort('risk')}
                  className="flex items-center space-x-2 hover:text-white transition-colors mx-auto"
                >
                  <span>Risk</span>
                  {getSortIcon('risk')}
                </button>
              </TableHead>
              <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                <button 
                  onClick={() => handleSort('participants')}
                  className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                >
                  <span>Participants</span>
                  {getSortIcon('participants')}
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
                <TableCell className="py-4 px-6">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white text-sm">{strategy.name}</h4>
                      {/* Chain Badge */}
                      {strategy.chain && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center space-x-1 bg-slate-800/60 hover:bg-slate-700/60 px-2 py-1 rounded-full border border-slate-600/50 transition-colors">
                              <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center">
                                {renderChainLogo(strategy.chain, 12)}
                              </div>
                              <span className="text-xs text-slate-300 font-medium">{strategy.chain.name}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Deployed on {strategy.chain.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          className="px-6 py-4 border-t border-slate-700 bg-slate-900/60"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStrategies.length)} of {filteredStrategies.length} results
              </span>
            </div>
            
            <Pagination className="mx-0 w-auto">
              <PaginationContent className="space-x-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={`h-9 px-3 ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-800 border-slate-600'}`}
                  />
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className={`h-9 w-9 ${
                          currentPage === pageNumber 
                            ? 'bg-purple-600 text-white border-purple-600' 
                            : 'hover:bg-slate-800 border-slate-600 text-slate-300'
                        }`}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis className="text-slate-400" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        className="h-9 w-9 hover:bg-slate-800 border-slate-600 text-slate-300"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={`h-9 px-3 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-slate-800 border-slate-600'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </motion.div>
      )}
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
      {/* Vault Overview Cards */}
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

      {/* Streamlined Filter Bar */}
      <StreamlinedFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter vaults"
        primaryFilter={{
          label: "Asset Type",
          value: assetTypeFilter,
          options: assetTypeOptions,
          onChange: setAssetTypeFilter
        }}
        secondaryFilter={{
          label: "Risk Level",
          value: riskLevelFilter,
          options: riskLevelOptions,
          onChange: setRiskLevelFilter
        }}
        tertiaryFilter={{
          label: "Status",
          value: availabilityFilter,
          options: availabilityOptions,
          onChange: setAvailabilityFilter
        }}
        resultsCount={filteredStrategies.length}
        totalCount={allStrategies.length}
        itemLabel="vaults"
      />

      {/* Vault Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {filteredStrategies.length > 0 ? (
            <TableView />
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
                    : 'No vaults match your current filters. Try adjusting your filter criteria.'
                  }
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setAssetTypeFilter('all')
                  setRiskLevelFilter('all')
                  setAvailabilityFilter('all')
                }}
                className="mt-6 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500"
              >
                Clear all filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}