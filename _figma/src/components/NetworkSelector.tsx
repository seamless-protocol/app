"use client"

import { Loader2 } from "lucide-react"
import BaseLogo from "../imports/BaseLogo"

export interface Network {
  id: string
  name: string
  displayName: string
  chainId: number
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  color: string
  isTestnet?: boolean
  isSupported: boolean
}

interface NetworkSelectorProps {
  currentNetwork: Network
  isConnecting?: boolean
}

const AVAILABLE_NETWORKS: Network[] = [
  {
    id: 'base',
    name: 'Base',
    displayName: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: 'bg-blue-500',
    isSupported: true
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: 'bg-gray-600',
    isSupported: true
  },
  {
    id: 'polygon',
    name: 'Polygon',
    displayName: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    color: 'bg-purple-500',
    isSupported: true
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    displayName: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: 'bg-blue-400',
    isSupported: true
  },
  {
    id: 'optimism',
    name: 'Optimism',
    displayName: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: 'bg-red-500',
    isSupported: true
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    displayName: 'Avalanche',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    color: 'bg-red-600',
    isSupported: false
  }
]

export function NetworkSelector({ 
  currentNetwork, 
  isConnecting = false 
}: NetworkSelectorProps) {
  return (
    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
      {currentNetwork.id === 'base' ? (
        <div className="w-3 h-3">
          <BaseLogo />
        </div>
      ) : (
        <div className={`w-2 h-2 rounded-full ${currentNetwork.color}`} />
      )}
      <span className="text-xs text-slate-300">{currentNetwork.displayName}</span>
      {isConnecting && (
        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
      )}
    </div>
  )
}

// Helper function to get network by ID
export function getNetworkById(networkId: string): Network | undefined {
  return AVAILABLE_NETWORKS.find(network => network.id === networkId)
}

// Helper function to get default network
export function getDefaultNetwork(): Network {
  return AVAILABLE_NETWORKS.find(network => network.id === 'base') || AVAILABLE_NETWORKS[0]
}