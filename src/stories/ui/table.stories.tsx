import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowUpDown, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { CHAIN_IDS, getChainLogo } from '../../lib/utils/chain-logos'

// Mock data for vault strategies
const mockVaultData = [
  {
    id: '1',
    name: 'Seamless USDC Vault',
    description: 'Earn stable yields on USDC through optimized lending strategies',
    apy: 12.34,
    tvl: 45200000,
    riskLevel: 'Low',
    participants: 2847,
    performance7d: 0.9,
    asset: 'USDC',
    chainId: CHAIN_IDS.BASE,
  },
  {
    id: '2',
    name: 'Seamless cbBTC Vault',
    description: 'Earn yield on Bitcoin through wrapped BTC strategies',
    apy: 10.56,
    tvl: 22100000,
    riskLevel: 'Medium',
    participants: 892,
    asset: 'cbBTC',
    chainId: CHAIN_IDS.BASE,
  },
  {
    id: '3',
    name: 'Seamless WETH Vault',
    description: 'Generate yield on ETH through advanced DeFi strategies',
    apy: 8.92,
    tvl: 28700000,
    riskLevel: 'Medium',
    participants: 1743,
    asset: 'WETH',
    chainId: CHAIN_IDS.ETHEREUM,
  },
]

// Helper function to format currency
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toLocaleString()}`
}

// Helper function to get risk level colors
const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel.toLowerCase()) {
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Active</TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>Inactive</TableCell>
            <TableCell className="text-right">$150.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Johnson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell>Active</TableCell>
            <TableCell className="text-right">$350.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}

export const VaultTable: Story = {
  render: () => {
    const [sortConfig, setSortConfig] = useState<{
      key: string
      direction: 'asc' | 'desc'
    }>({ key: 'apy', direction: 'desc' })

    const sortedData = useMemo(() => {
      const sorted = [...mockVaultData].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a]
        const bValue = b[sortConfig.key as keyof typeof b]

        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }

        // Handle string values
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        return 0
      })
      return sorted
    }, [sortConfig])

    const handleSort = (key: string) => {
      setSortConfig((prev) => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
      }))
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
      <div className="w-full max-w-7xl bg-slate-950 p-6 rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Vault Strategies</h2>
          <p className="text-slate-400">Browse and invest in curated DeFi strategies</p>
        </div>

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
              {sortedData.map((strategy, index) => (
                <motion.tr
                  key={strategy.id}
                  className="border-slate-700 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white text-sm">{strategy.name}</h4>
                        <Badge 
                          logo={getChainLogo(strategy.chainId) || (({ size }) => (
                            <div className="w-3 h-3 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white">
                              {strategy.chainId === CHAIN_IDS.BASE ? 'B' : 'E'}
                            </div>
                          ))}
                          logoSize={12}
                          className="bg-slate-800/60 hover:bg-slate-700/60 px-2 py-1 rounded-full border border-slate-600/50 transition-colors"
                        >
                          {strategy.chainId === CHAIN_IDS.BASE ? 'Base' : 'Ethereum'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{strategy.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge 
                      logo={({ size }) => (
                        <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white">
                          {strategy.asset.charAt(0)}
                        </div>
                      )}
                      logoSize={20}
                    >
                      {strategy.asset}
                    </Badge>
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
                      {formatCurrency(strategy.tvl)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                    <Badge className={`text-xs px-2 py-1 ${getRiskLevelColor(strategy.riskLevel)}`}>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  },
}

export const SimpleTable: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Laptop Pro</TableCell>
            <TableCell>Electronics</TableCell>
            <TableCell className="text-right">$1,299.00</TableCell>
            <TableCell className="text-right">12</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Wireless Mouse</TableCell>
            <TableCell>Accessories</TableCell>
            <TableCell className="text-right">$49.99</TableCell>
            <TableCell className="text-right">45</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Mechanical Keyboard</TableCell>
            <TableCell>Accessories</TableCell>
            <TableCell className="text-right">$199.00</TableCell>
            <TableCell className="text-right">8</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}
