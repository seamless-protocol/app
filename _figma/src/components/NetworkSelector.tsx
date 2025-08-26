"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu"
import { 
  Check, 
  AlertTriangle,
  Loader2 
} from "lucide-react"
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
  onNetworkChange: (network: Network) => void
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
  onNetworkChange, 
  isConnecting = false 
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleNetworkSelect = async (network: Network) => {
    if (network.id === currentNetwork.id) {
      setIsOpen(false)
      return
    }

    if (!network.isSupported) {
      // Could show a toast or alert here
      console.warn(`${network.name} is not yet supported`)
      setIsOpen(false)
      return
    }

    try {
      await onNetworkChange(network)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
      // Could show error toast here
    }
  }

  const supportedNetworks = AVAILABLE_NETWORKS.filter(network => network.isSupported)
  const unsupportedNetworks = AVAILABLE_NETWORKS.filter(network => !network.isSupported)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8" disabled={isConnecting}>
          <div className="flex items-center space-x-2">
            {currentNetwork.id === 'base' ? (
              <div className="w-3 h-3">
                <BaseLogo />
              </div>
            ) : (
              <div className={`w-2 h-2 rounded-full ${currentNetwork.color}`} />
            )}
            <span className="text-xs">{currentNetwork.displayName}</span>
            {isConnecting && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <span>Select Network</span>
          {isConnecting && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {supportedNetworks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => handleNetworkSelect(network)}
            className="flex items-center justify-between cursor-pointer p-3"
            disabled={isConnecting}
          >
            <div className="flex items-center space-x-3">
              {network.id === 'base' ? (
                <div className="w-4 h-4">
                  <BaseLogo />
                </div>
              ) : (
                <div className={`w-4 h-4 rounded-full ${network.color}`} />
              )}
              <div>
                <p className="font-medium">{network.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  Chain ID: {network.chainId} • {network.nativeCurrency.symbol}
                </p>
              </div>
            </div>
            {network.id === currentNetwork.id && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
        
        {unsupportedNetworks.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Coming Soon
            </DropdownMenuLabel>
            {unsupportedNetworks.map((network) => (
              <DropdownMenuItem
                key={network.id}
                disabled
                className="flex items-center justify-between opacity-50"
              >
                <div className="flex items-center space-x-3">
                  {network.id === 'base' ? (
                    <div className="w-3 h-3">
                      <BaseLogo />
                    </div>
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${network.color}`} />
                  )}
                  <div>
                    <p className="font-medium">{network.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Chain ID: {network.chainId}
                    </p>
                  </div>
                </div>
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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