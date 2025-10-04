import { motion } from 'framer-motion'
import { Info, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  apyDataMap?: Map<string, APYBreakdownData> | undefined
  isApyLoading?: boolean
  isApyError?: boolean
}

export function LeverageTokenTable({
  tokens,
  onTokenClick,
  className,
  apyDataMap,
  isApyLoading,
  isApyError,
}: LeverageTokenTableProps) {
  const [sortBy, setSortBy] = useState('apy-desc')
  const [filters, setFilters] = useState({
    collateralAsset: 'all',
    debtAsset: 'all',
    supplyCap: 'both',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize] = useState(10) // Default page size, could be made configurable

  const apyLoading = isApyLoading ?? false
  const apyError = isApyError ?? false

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

    // Apply supply cap filter
    if (filters.supplyCap !== 'both') {
      const isNearCapacity = (token: LeverageToken) =>
        token.currentSupply && token.supplyCap
          ? (token.currentSupply / token.supplyCap) * 100 >= 90
          : false
      if (filters.supplyCap === 'near-capacity') {
        filtered = filtered.filter(isNearCapacity)
      } else if (filters.supplyCap === 'available') {
        filtered = filtered.filter((token) => !isNearCapacity(token))
      }
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
          return apyDataMap?.get(item.address)?.totalAPY ?? 0
        case 'leverage':
          return item.leverageRatio
        case 'currentSupply':
          return item.currentSupply
        case 'supplyCap':
          return item.supplyCap
        default:
          console.warn(`Unknown sort key: ${key}`)
          return 0
      }
    })

    return sorted
  }, [tokens, sortBy, filters, searchQuery, apyDataMap])

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

    return [{ value: 'all', label: 'All', count: sortedAndFilteredData.length }, ...options]
  }

  const getDebtAssetOptions = () => {
    const assets = Array.from(new Set(tokens.map((token) => token.debtAsset.symbol)))
    const options = assets.map((asset) => ({
      value: asset,
      label: asset,
      count: tokens.filter((token) => token.debtAsset.symbol === asset).length,
    }))

    return [{ value: 'all', label: 'All', count: sortedAndFilteredData.length }, ...options]
  }

  const getSupplyCapOptions = () => {
    const nearCapacityCount = tokens.filter((token) =>
      token.currentSupply && token.supplyCap
        ? (token.currentSupply / token.supplyCap) * 100 >= 90
        : false,
    ).length
    const availableCount = tokens.length - nearCapacityCount

    return [
      { value: 'both', label: 'Both', count: sortedAndFilteredData.length },
      { value: 'available', label: 'Available', count: availableCount },
      { value: 'near-capacity', label: 'Near Capacity', count: nearCapacityCount },
    ]
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Collateral Asset Filter */}
            <FilterDropdown
              label="Collateral Asset"
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

            {/* Supply Cap Filter */}
            <FilterDropdown
              label="Supply Cap"
              value={filters.supplyCap}
              options={getSupplyCapOptions()}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, supplyCap: value }))}
            />
          </div>

          {/* Search */}
          <div className="flex items-center space-x-3 lg:ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                placeholder="Search leverage tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-w-0 rounded-md border px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[var(--brand-secondary)] focus-visible:ring-opacity-50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive pl-10 w-64 h-8 transition-all duration-200 focus:w-80 bg-input border-[var(--divider-line)] text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-secondary)]">
            No leverage tokens found
          </div>
        ) : (
          currentItems.map((token) => {
            const tokenApyData = apyDataMap?.get(token.address)
            const tokenApyError = apyError || (!apyLoading && !apyDataMap?.has(token.address))

            return (
              <LeverageTokenMobileCard
                key={token.address}
                token={token}
                {...(onTokenClick && { onTokenClick })}
                apyData={tokenApyData}
                isApyLoading={apyLoading}
                isApyError={tokenApyError}
              />
            )
          })
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
        className="hidden w-full overflow-hidden rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] lg:block"
      >
        <div className="overflow-x-auto w-full max-w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--divider-line)] hover:bg-accent">
                <TableHead className="py-4 px-6 min-w-[200px] text-[var(--text-secondary)] font-medium">
                  <button
                    type="button"
                    className="flex items-center space-x-2 transition-colors cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('name')}
                  >
                    <span>Leverage Token Name</span>
                    {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 text-right text-[var(--text-secondary)] font-medium">
                  <button
                    type="button"
                    className="ml-auto flex items-center space-x-2 transition-colors cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('tvl')}
                  >
                    <span>TVL (USD)</span>
                    {getSortIcon('tvl')}
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 text-right text-[var(--text-secondary)] font-medium">
                  <button
                    type="button"
                    className="ml-auto flex items-center space-x-2 transition-colors cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('apy')}
                  >
                    <span>APY</span>
                    {getSortIcon('apy')}
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 text-center text-[var(--text-secondary)] font-medium">
                  <button
                    type="button"
                    className="mx-auto flex items-center space-x-2 transition-colors cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('leverage')}
                  >
                    <span>Leverage</span>
                    {getSortIcon('leverage')}
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 text-center text-[var(--text-secondary)] font-medium">
                  <span>Network</span>
                </TableHead>
                <TableHead className="py-4 px-6 text-right text-[var(--text-secondary)] font-medium min-w-[140px]">
                  <button
                    type="button"
                    className="ml-auto flex items-center space-x-2 transition-colors cursor-pointer hover:text-[var(--text-primary)]"
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
                currentItems.map((token, index) => {
                  const tokenApyData = apyDataMap?.get(token.address)
                  const tokenApyError = apyError || (!apyLoading && !apyDataMap?.has(token.address))

                  return (
                    <motion.tr
                      key={token.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="cursor-pointer border-[var(--divider-line)] transition-colors hover:bg-accent"
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
                                  <span className="text-sm text-[var(--text-secondary)]">
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
                                  <span className="text-sm text-[var(--text-secondary)]">
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
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {token.name}
                            </span>
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
                          <span className="text-sm font-medium text-[var(--text-secondary)]">
                            {formatCurrency(token.tvlUsd)}
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--text-muted)]">—</span>
                        )}
                      </TableCell>

                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {tokenApyError ? (
                            <span className="text-sm font-medium text-[var(--text-muted)]">
                              N/A
                            </span>
                          ) : apyLoading || !tokenApyData ? (
                            <Skeleton variant="pulse" className="h-6 w-20" />
                          ) : (
                            <span className="text-sm font-medium text-[var(--state-success-text)]">
                              {formatAPY(tokenApyData.totalAPY, 2)}
                            </span>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                              >
                                <Info className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="p-0 text-sm border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]">
                              <APYBreakdownTooltip
                                token={token}
                                compact
                                {...(tokenApyData && { apyData: tokenApyData })}
                                isLoading={apyLoading}
                                isError={tokenApyError}
                              />
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-center">
                        <LeverageBadge leverage={token.leverageRatio} size="md" />
                      </TableCell>

                      <TableCell className="py-4 px-6 text-center">
                        <div className="inline-flex items-center space-x-1 rounded-full border border-[var(--divider-line)] px-2 py-1 transition-colors bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 55%,transparent)]">
                          <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center">
                            <token.chainLogo className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
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
                  )
                })
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
