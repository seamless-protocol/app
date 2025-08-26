"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import { ChevronDown } from "lucide-react"

interface Network {
  id: string
  name: string
  displayName: string
  chainId: number
  color: string
}

interface NetworkSelectorSimpleProps {
  networks: Network[]
  selectedNetwork: Network
  onNetworkChange: (network: Network) => void
  label?: string
}

export function NetworkSelectorSimple({ 
  networks, 
  selectedNetwork, 
  onNetworkChange, 
  label = "Network" 
}: NetworkSelectorSimpleProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleNetworkSelect = (network: Network) => {
    onNetworkChange(network)
    setIsOpen(false)
  }

  const getNetworkIcon = (id: string) => {
    const colors: { [key: string]: string } = {
      'ethereum': 'bg-blue-500',
      'base': 'bg-blue-600',
      'arbitrum': 'bg-blue-700',
      'polygon': 'bg-purple-600',
      'optimism': 'bg-red-500'
    }
    return colors[id] || 'bg-gray-500'
  }

  return (
    <>
      <div>
        <label className="text-sm text-dark-muted mb-2 block">{label}</label>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full justify-between h-auto p-3 border-divider-line hover:bg-dark-elevated"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getNetworkIcon(selectedNetwork.id)}`}>
              <span className="text-xs font-medium text-white">
                {selectedNetwork.displayName.slice(0, 1)}
              </span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-dark-primary">{selectedNetwork.displayName}</div>
              <div className="text-xs text-dark-muted">Chain ID: {selectedNetwork.chainId}</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-dark-muted" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-dark-card border-divider-line max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-dark-primary">Select {label}</DialogTitle>
            <DialogDescription className="text-dark-secondary">
              Choose the blockchain network you want to use
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-64">
            <div className="space-y-1">
              {networks.map((network) => (
                <Button
                  key={network.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-dark-elevated"
                  onClick={() => handleNetworkSelect(network)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getNetworkIcon(network.id)}`}>
                    <span className="text-sm font-medium text-white">
                      {network.displayName.slice(0, 1)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-dark-primary">{network.displayName}</div>
                    <div className="text-xs text-dark-muted">Chain ID: {network.chainId}</div>
                  </div>
                  {network.id === selectedNetwork.id && (
                    <Badge variant="outline" className="text-xs bg-brand-purple/20 text-brand-purple border-brand-purple/30">
                      Selected
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}