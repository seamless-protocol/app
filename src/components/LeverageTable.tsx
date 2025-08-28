import { motion } from 'framer-motion'
import { Info, Search, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatAPY, formatCurrency } from '@/lib/utils/formatting'
import { filterByRange, filterBySearch, parseSortString, sortData } from '@/lib/utils/table-utils'
import { APYBreakdown, type APYBreakdownData } from './APYBreakdown'
import { LeverageBadge } from './LeverageBadge'
import { SupplyCap } from './SupplyCap'
import { Badge } from './ui/badge'
import { FilterDropdown } from './ui/filter-dropdown'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface LeverageToken {
  id: string
  name: string
  collateralAsset: {
    symbol: string
    name: string
    address: string
  }
  debtAsset: {
    symbol: string
    name: string
    address: string
  }
  tvl: number
  apy: number
  leverage: number
  supplyCap: number
  currentSupply: number
  chainId: number
  chainName: string
  chainLogo: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export type { LeverageToken }

interface LeverageTableProps {
  tokens: Array<LeverageToken>
  onTokenClick?: (token: LeverageToken) => void
  className?: string
}

export function LeverageTable({ tokens, onTokenClick, className }: LeverageTableProps) {
  const [sortBy, setSortBy] = useState('apy-desc')
  const [filters, setFilters] = useState({
    leverageRange: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')

  const sortedAndFilteredData = useMemo(() => {
    // Apply search filter
    let filtered = filterBySearch(tokens, searchQuery, (token) => [token.name])

    // Apply leverage range filter
    filtered = filterByRange(filtered, 'leverage', filters.leverageRange)

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
          return item.supplyCap - item.currentSupply
        default:
          return (item as unknown as Record<string, unknown>)[key]
      }
    })

    return sorted
  }, [tokens, sortBy, filters, searchQuery])

  // Generate APY breakdown data for a token
  const getAPYBreakdown = (token: LeverageToken): APYBreakdownData => {
    // Calculate breakdown based on token data
    const baseYield = 5.12 // This would come from real data
    const borrowCost = -3.67 // This would be calculated from borrow rates
    const rewardAPY = 2.55 // This would come from reward programs
    const points = Math.floor(token.tvl / 1000) // Example calculation

    return {
      baseYield,
      leverageMultiplier: token.leverage,
      borrowCost,
      rewardAPY,
      points,
      totalAPY: token.apy,
    }
  }

  const getLeverageOptions = () => {
    const ranges = [
      { value: '1-5', label: '1x-5x', min: 1, max: 5 },
      { value: '5-10', label: '5x-10x', min: 5, max: 10 },
      { value: '10+', label: '10x+', min: 10, max: Infinity },
    ]

    const rangeCounts = ranges.map((range) => ({
      ...range,
      count: tokens.filter((token) => {
        const leverage = token.leverage
        return leverage >= range.min && (range.max === Infinity ? true : leverage <= range.max)
      }).length,
    }))

    return [{ value: 'all', label: 'All Leverage', count: tokens.length }, ...rangeCounts]
  }

  const getSortOptions = () => [
    { value: 'apy-desc', label: 'Highest APY' },
    { value: 'apy-asc', label: 'Lowest APY' },
    { value: 'tvl-desc', label: 'Highest TVL' },
    { value: 'tvl-asc', label: 'Lowest TVL' },
    { value: 'leverage-desc', label: 'Highest Leverage' },
    { value: 'leverage-asc', label: 'Lowest Leverage' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
  ]

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
            {/* Leverage Range Filter */}
            <FilterDropdown
              label="Leverage"
              value={filters.leverageRange}
              options={getLeverageOptions()}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, leverageRange: value }))}
            />

            {/* Sort By Dropdown */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <FilterDropdown
                label="Sort by"
                value={sortBy}
                options={getSortOptions()}
                onValueChange={setSortBy}
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-3 lg:ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Filter items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-slate-800 border border-slate-600 text-white h-8 px-3 py-1 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-300 font-medium py-4 px-6 min-w-[200px]">
                  <span>Leverage Token Name</span>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <span>TVL</span>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <span>APY</span>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">
                  <span>Leverage</span>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right min-w-[140px]">
                  <span>Supply Cap Available</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredData.length === 0 ? (
                <TableEmpty colSpan={5} />
              ) : (
                sortedAndFilteredData.map((token, index) => (
                  <motion.tr
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => onTokenClick?.(token)}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium text-sm">{token.name}</span>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-slate-800/60 hover:bg-slate-700/60 border-slate-600/50 text-slate-300"
                        >
                          <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center mr-1">
                            <token.chainLogo className="w-3 h-3" />
                          </div>
                          {token.chainName}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      <span className="text-slate-300 font-medium text-sm">
                        {formatCurrency(token.tvl)}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <span className="text-green-400 font-medium text-sm">
                          {formatAPY(token.apy)}
                        </span>
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
                            <APYBreakdown data={getAPYBreakdown(token)} compact />
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6 text-center">
                      <LeverageBadge leverage={token.leverage} size="md" />
                    </TableCell>

                    <TableCell className="py-4 px-6 text-right">
                      <SupplyCap currentSupply={token.currentSupply} supplyCap={token.supplyCap} />
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  )
}
