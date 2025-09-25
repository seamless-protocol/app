import { motion } from 'framer-motion'
import { Info, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('leverage-token-table')

// Helper function to get network name from chain ID
const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 8453:
      return 'Base'
    case 1:
      return 'Ethereum'
    case 137:
      return 'Polygon'
    case 42161:
      return 'Arbitrum'
    case 10:
      return 'Optimism'
    case 43114:
      return 'Avalanche'
    default:
      return 'Unknown'
  }
}

import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { getTokenExplorerInfo } from '@/lib/utils/block-explorer'
import { cn } from '@/lib/utils/cn'
import { formatAPY, formatCurrency } from '@/lib/utils/formatting'
import { filterBySearch, parseSortString, sortData } from '@/lib/utils/table-utils'
import { SortArrowDown, SortArrowNeutral, SortArrowUp } from '../../../../components/icons'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Badge } from '../../../../components/ui/badge'
import { FilterDropdown } from '../../../../components/ui/filter-dropdown'
import { Skeleton } from '../../../../components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TablePagination,
  TableRow,
  usePagination,
} from '../../../../components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip'
import type { LeverageTokenConfig } from '../../leverageTokens.config'
import { LeverageBadge } from '../LeverageBadge'
import { SupplyCap } from '../SupplyCap'
import { LeverageTokenMobileCard } from './LeverageTokenMobileCard'

interface LeverageToken extends LeverageTokenConfig {
  // Optional metrics (can be undefined if not available)
  tvl?: number
  tvlUsd?: number
  supplyCap?: number
  currentSupply?: number
  rank?: number
  // Optional: warning/note when data is partial (e.g., manager not deployed)
  dataWarning?: string
}

export type { LeverageToken }

interface LeverageTokenTableProps {
  tokens: Array<LeverageToken>
  onTokenClick?: (token: LeverageToken) => void
  className?: string
  apyData?: APYBreakdownData // APY data for the first token (can be extended for multiple tokens)
  isApyLoading?: boolean
  isApyError?: boolean
}

export function LeverageTokenTable({
  tokens,
  onTokenClick,
  className,
  apyData,
  isApyLoading,
  isApyError,
}: LeverageTokenTableProps) {
  const [sortBy, setSortBy] = useState('apy-desc')
  const [filters, setFilters] = useState({
    collateralAsset: 'all',
    debtAsset: 'all',
    network: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize] = useState(10) // Default page size, could be made configurable

  const handleSort = (field: string) => {
    const currentField = sortBy.split('-')[0]
    const currentDirection = sortBy.split('-')[1]

    if (currentField === field) {
      // Toggle direction if same field
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc'
      setSortBy(`${field}-${newDirection}`)
    } else {
      // Default to desc for new field
      setSortBy(`${field}-desc`)
    }
  }

  const getSortIcon = (field: string) => {
    const currentField = sortBy.split('-')[0]
    const currentDirection = sortBy.split('-')[1]

    if (currentField !== field) {
      // Not currently sorting by this field - show double arrow
      return <SortArrowNeutral />
    }

    // Currently sorting by this field - show single arrow
    if (currentDirection === 'asc') {
      return <SortArrowUp />
    } else {
      return <SortArrowDown />
    }
  }

  const sortedAndFilteredData = useMemo(() => {
    // Apply search filter
    let filtered = filterBySearch(tokens, searchQuery, (token) => [token.name])

    // Apply collateral asset filter
    if (filters.collateralAsset !== 'all') {
      filtered = filtered.filter(
        (token) => token.collateralAsset.symbol === filters.collateralAsset,
      )
    }

    // Apply debt asset filter
    if (filters.debtAsset !== 'all') {
      filtered = filtered.filter((token) => token.debtAsset.symbol === filters.debtAsset)
    }

    // Apply network filter
    if (filters.network !== 'all') {
      filtered = filtered.filter((token) => {
        const networkName = getNetworkName(token.chainId)
        return networkName === filters.network
      })
    }

    // Sort the filtered data
    const sortConfig = parseSortString(sortBy)
    const sorted = sortData(filtered, sortConfig, (item, key) => {
      // Handle special sorting cases
      switch (key) {
        case 'collateralAsset':
          return item.collateralAsset.symbol
        case 'debtAsset':
          return item.debtAsset.symbol
        case 'available':
          return (item.supplyCap ?? 0) - (item.currentSupply ?? 0)
        case 'tvl':
          // Prefer USD value for sorting when available for cross-asset comparability
          return item.tvlUsd ?? 0
        case 'name':
          return item.name
        case 'apy':
          // Per-row APY is not modeled here; neutral sort value
          return 0
        case 'leverage':
          return item.leverageRatio
        case 'currentSupply':
          return item.currentSupply
        case 'supplyCap':
          return item.supplyCap
        default:
          logger.warn('Unknown sort key', { sortKey: key })
          return 0
      }
    })

    return sorted
  }, [tokens, sortBy, filters, searchQuery])

  // Apply pagination to the filtered data
  const { currentItems, currentPage, totalPages, goToPage } = usePagination(
    sortedAndFilteredData,
    pageSize,
  )

  const getCollateralAssetOptions = () => {
    const assets = Array.from(new Set(tokens.map((token) => token.collateralAsset.symbol)))
    const options = assets.map((asset) => ({
      value: asset,
      label: asset,
      count: tokens.filter((token) => token.collateralAsset.symbol === asset).length,
    }))

    return [{ value: 'all', label: 'All Assets', count: sortedAndFilteredData.length }, ...options]
  }

  const getDebtAssetOptions = () => {
    const assets = Array.from(new Set(tokens.map((token) => token.debtAsset.symbol)))
    const options = assets.map((asset) => ({
      value: asset,
      label: asset,
      count: tokens.filter((token) => token.debtAsset.symbol === asset).length,
    }))

    return [
      { value: 'all', label: 'All Debt Assets', count: sortedAndFilteredData.length },
      ...options,
    ]
  }

  const getNetworkOptions = () => {
    const networkCounts = tokens.reduce(
      (acc, token) => {
        const networkName = getNetworkName(token.chainId)
        acc[networkName] = (acc[networkName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const options = [{ value: 'all', label: 'All Networks', count: tokens.length }]

    // Add network options sorted by count (descending)
    Object.entries(networkCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([networkName, count]) => {
        options.push({ value: networkName, label: networkName, count })
      })

    return options
  }

  return (
    <div className={cn('max-w-7xl mx-auto space-y-6', className)}>
      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 border border-slate-700 rounded-lg p-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Collateral Asset Filter */}
            <FilterDropdown
              label="Collateral"
              value={filters.collateralAsset}
              options={getCollateralAssetOptions()}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, collateralAsset: value }))}
            />

            {/* Debt Asset Filter */}
            <FilterDropdown
              label="Debt Asset"
              value={filters.debtAsset}
              options={getDebtAssetOptions()}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, debtAsset: value }))}
            />

            {/* Network Filter */}
            <FilterDropdown
              label="Network"
              value={filters.network}
              options={getNetworkOptions()}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, network: value }))}
            />
          </div>

          {/* Search */}
          <div className="flex items-center space-x-3 lg:ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search leverage tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex min-w-0 rounded-md border px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 w-64 bg-slate-800 border-slate-600 text-white h-8 transition-all duration-200 focus:w-80"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No leverage tokens found</div>
        ) : (
          currentItems.map((token) => (
            <LeverageTokenMobileCard
              key={token.address}
              token={token}
              {...(onTokenClick && { onTokenClick })}
              apyData={apyData}
              isApyLoading={isApyLoading}
              isApyError={isApyError}
            />
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedAndFilteredData.length}
              pageSize={pageSize}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Desktop Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:block bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden w-full"
      >
        <div className="overflow-x-auto w-full max-w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-300 font-medium py-4 px-6 min-w-[200px]">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <span>Leverage Token Name</span>
                    {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors ml-auto cursor-pointer"
                    onClick={() => handleSort('tvl')}
                  >
                    <span>TVL (USD)</span>
                    {getSortIcon('tvl')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors ml-auto cursor-pointer"
                    onClick={() => handleSort('apy')}
                  >
                    <span>APY</span>
                    {getSortIcon('apy')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors mx-auto cursor-pointer"
                    onClick={() => handleSort('leverage')}
                  >
                    <span>Leverage</span>
                    {getSortIcon('leverage')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">
                  <span>Network</span>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right min-w-[140px]">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors ml-auto cursor-pointer"
                    onClick={() => handleSort('available')}
                  >
                    <span>Supply Cap</span>
                    {getSortIcon('available')}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableEmpty colSpan={6} />
              ) : (
                currentItems.map((token, index) => (
                  <motion.tr
                    key={token.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => onTokenClick?.(token)}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-1">
                          <AssetDisplay
                            asset={token.collateralAsset}
                            size="md"
                            variant="logo-only"
                            tooltipContent={
                              <p className="font-medium">
                                {token.collateralAsset.name || token.collateralAsset.symbol}{' '}
                                (Collateral)
                                <br />
                                <span className="text-slate-400 text-sm">
                                  Click to view on{' '}
                                  {
                                    getTokenExplorerInfo(
                                      token.chainId,
                                      token.collateralAsset.address,
                                    ).name
                                  }
                                </span>
                              </p>
                            }
                            onClick={() =>
                              window.open(
                                getTokenExplorerInfo(token.chainId, token.collateralAsset.address)
                                  .url,
                                '_blank',
                              )
                            }
                          />
                          <AssetDisplay
                            asset={token.debtAsset}
                            size="md"
                            variant="logo-only"
                            tooltipContent={
                              <p className="font-medium">
                                {token.debtAsset.name || token.debtAsset.symbol} (Debt)
                                <br />
                                <span className="text-slate-400 text-sm">
                                  Click to view on{' '}
                                  {
                                    getTokenExplorerInfo(token.chainId, token.debtAsset.address)
                                      .name
                                  }
                                </span>
                              </p>
                            }
                            onClick={() =>
                              window.open(
                                getTokenExplorerInfo(token.chainId, token.debtAsset.address).url,
                                '_blank',
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium text-sm">{token.name}</span>
                          {token.dataWarning && (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-400 border-amber-400/30 text-[10px] px-1.5 py-0.5"
                              title={token.dataWarning}
                            >
                              Partial data
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      {typeof token.tvlUsd === 'number' && Number.isFinite(token.tvlUsd) ? (
                        <span className="text-slate-300 font-medium text-sm">
                          {formatCurrency(token.tvlUsd)}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {apyData?.totalAPY ? (
                          <span className="text-green-400 font-medium text-sm">
                            {formatAPY(apyData.totalAPY, 2)}
                          </span>
                        ) : (
                          <Skeleton className="h-6 w-20" />
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-300 transition-colors"
                            >
                              <Info className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-0 bg-slate-800 border-slate-700 text-sm">
                            <APYBreakdownTooltip
                              token={token}
                              compact
                              {...(apyData && { apyData })}
                              isLoading={isApyLoading ?? false}
                              isError={isApyError ?? false}
                            />
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-center">
                      <LeverageBadge leverage={token.leverageRatio} size="md" />
                    </TableCell>

                    <TableCell className="py-4 px-6 text-center">
                      <div className="inline-flex items-center space-x-1 bg-slate-800/60 hover:bg-slate-700/60 px-2 py-1 rounded-full border border-slate-600/50 transition-colors">
                        <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center">
                          <token.chainLogo className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-slate-300 font-medium">
                          {token.chainName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      <SupplyCap
                        currentSupply={token.currentSupply ?? 0}
                        supplyCap={token.supplyCap ?? 0}
                      />
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer - Always visible */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedAndFilteredData.length}
            pageSize={pageSize}
            onPageChange={goToPage}
          />
        </div>
      </motion.div>
    </div>
  )
}
