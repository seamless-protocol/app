import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatCurrency, getRiskLevelColor } from '@/lib/utils/formatting'
import { type SortConfig, sortData, toggleSortDirection } from '@/lib/utils/table-utils'
import { CHAIN_IDS, type ChainId, getChainLogo } from '../lib/utils/chain-logos'
import { AssetDisplay } from './ui/asset-display'
import { Badge } from './ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export interface VaultStrategy {
  id: string
  name: string
  description: string
  apy: number
  tvl: number
  riskLevel: string
  participants?: number
  performance7d?: number
  asset: {
    symbol: string
    name?: string
  }
  chainId: number
}

interface VaultTableProps {
  strategies: Array<VaultStrategy>
  onStrategyClick?: (strategy: VaultStrategy) => void
  className?: string
}

export function VaultTable({ strategies, onStrategyClick, className }: VaultTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'apy', direction: 'desc' })

  const sortedData = useMemo(() => {
    return sortData(strategies, sortConfig)
  }, [strategies, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((prev) => toggleSortDirection(prev, key))
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 text-slate-500" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-purple-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-purple-400" />
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Vault Strategies</h2>
        <p className="text-slate-400">Browse and invest in curated DeFi strategies</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-300 font-medium py-4 px-6">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <span>Vault</span>
                    {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors"
                    onClick={() => handleSort('asset')}
                  >
                    <span>Assets</span>
                    {getSortIcon('asset')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                    onClick={() => handleSort('apy')}
                  >
                    <span>APY</span>
                    {getSortIcon('apy')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                    onClick={() => handleSort('tvl')}
                  >
                    <span>TVL</span>
                    {getSortIcon('tvl')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-center">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors mx-auto"
                    onClick={() => handleSort('riskLevel')}
                  >
                    <span>Risk</span>
                    {getSortIcon('riskLevel')}
                  </button>
                </TableHead>
                <TableHead className="text-slate-300 font-medium py-4 px-6 text-right">
                  <button
                    type="button"
                    className="flex items-center space-x-2 hover:text-white transition-colors ml-auto"
                    onClick={() => handleSort('participants')}
                  >
                    <span>Participants</span>
                    {getSortIcon('participants')}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableEmpty colSpan={6} />
              ) : (
                sortedData.map((strategy, index) => (
                  <motion.tr
                    key={strategy.id}
                    className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}
                    onClick={() => onStrategyClick?.(strategy)}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-white text-sm">{strategy.name}</h4>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-slate-800/60 hover:bg-slate-700/60 border-slate-600/50 text-slate-300"
                          >
                            <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center mr-1">
                              {getChainLogo(strategy.chainId as ChainId) ? (
                                <div className="relative size-full">
                                  {(() => {
                                    const LogoComponent = getChainLogo(strategy.chainId as ChainId)
                                    return LogoComponent ? (
                                      <LogoComponent className="block size-full" />
                                    ) : null
                                  })()}
                                </div>
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white">
                                  {strategy.chainId === CHAIN_IDS.BASE ? 'B' : 'E'}
                                </div>
                              )}
                            </div>
                            {strategy.chainId === CHAIN_IDS.BASE ? 'Base' : 'Ethereum'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {strategy.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <AssetDisplay asset={strategy.asset} size="md" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-green-400 font-medium text-sm">
                          {strategy.apy.toFixed(2)}%
                        </span>
                        {strategy.performance7d && (
                          <span className="text-xs text-green-400">
                            +{strategy.performance7d.toFixed(1)}% 7d
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className="text-slate-300 font-medium text-sm">
                        {formatCurrency(strategy.tvl, { includeDollarSign: true })}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Badge
                        className={`text-xs px-2 py-1 ${getRiskLevelColor(strategy.riskLevel)}`}
                      >
                        {strategy.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-300 text-sm">
                          {strategy.participants?.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
