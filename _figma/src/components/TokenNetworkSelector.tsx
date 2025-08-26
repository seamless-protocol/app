"use client"

import { useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { ChevronDown, Search, Check } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { getCryptoLogo } from "./ui/crypto-logos"
import BaseLogo from "../imports/BaseLogo"

interface Token {
  symbol: string
  name: string
  balance: string
  value: string
  logo: React.ComponentType<any>
}

interface Network {
  id: string
  name: string
  displayName: string
  chainId: number
  color: string
}

interface TokenNetworkSelectorProps {
  tokens: Token[]
  networks: Network[]
  selectedToken: Token
  selectedNetwork: Network
  onTokenChange: (token: Token) => void
  onNetworkChange: (network: Network) => void
  label?: string
}

export function TokenNetworkSelector({ 
  tokens, 
  networks,
  selectedToken, 
  selectedNetwork,
  onTokenChange,
  onNetworkChange,
  label = "Asset"
}: TokenNetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'tokens' | 'networks'>('tokens')

  // Filter tokens based on search term
  const filteredTokens = useMemo(() => {
    return tokens.filter(token =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tokens, searchTerm])

  // Filter networks based on search term
  const filteredNetworks = useMemo(() => {
    return networks.filter(network =>
      network.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      network.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [networks, searchTerm])

  const handleTokenSelect = (token: Token) => {
    onTokenChange(token)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleNetworkSelect = (network: Network) => {
    onNetworkChange(network)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Render token logo component
  const renderTokenLogo = (token: Token, size: number = 24) => {
    const LogoComponent = token.logo
    return <LogoComponent size={size} />
  }

  // Render network logo
  const renderNetworkLogo = (network: Network, size: number = 24) => {
    if (network.id === 'base') {
      return <BaseLogo />
    }
    
    // For other networks, use colored circles with initials as fallback
    return (
      <div 
        className={`w-${size === 20 ? '5' : size === 24 ? '6' : '8'} h-${size === 20 ? '5' : size === 24 ? '6' : '8'} rounded-full flex items-center justify-center ${network.color}`}
      >
        <span className="text-xs font-medium text-white">
          {network.displayName.slice(0, 1)}
        </span>
      </div>
    )
  }

  const popularTokens = ['ETH', 'USDC', 'USDT', 'DAI']

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full h-auto p-3 hover:bg-slate-800/50 border border-slate-700 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          {/* Network Icon */}
          <div className="w-6 h-6 flex items-center justify-center">
            {renderNetworkLogo(selectedNetwork, 24)}
          </div>
          
          {/* Token Icon */}
          <div className="w-8 h-8 flex items-center justify-center">
            {renderTokenLogo(selectedToken, 32)}
          </div>
          
          {/* Token Info */}
          <div className="text-left">
            <div className="text-sm font-medium text-white">{selectedToken.symbol}</div>
            <div className="text-xs text-slate-400">{selectedNetwork.displayName}</div>
          </div>
        </div>
        
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900/95 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Select {label}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose a network and token for this transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tokens and networks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-500"
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <Button
                variant={activeTab === 'tokens' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tokens')}
                className={`flex-1 ${activeTab === 'tokens' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Tokens
              </Button>
              <Button
                variant={activeTab === 'networks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('networks')}
                className={`flex-1 ${activeTab === 'networks' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Networks
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'tokens' ? (
                <motion.div
                  key="tokens"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Current Network Context */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 flex items-center justify-center">
                        {renderNetworkLogo(selectedNetwork, 20)}
                      </div>
                      <span className="text-sm text-slate-300">{selectedNetwork.displayName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('networks')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Change Network
                    </Button>
                  </div>

                  {!searchTerm && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Popular Tokens</h4>
                      <div className="flex flex-wrap gap-2">
                        {popularTokens.map((symbol) => {
                          const token = tokens.find(t => t.symbol === symbol)
                          if (!token) return null
                          
                          const isSelected = selectedToken.symbol === symbol
                          
                          return (
                            <motion.div
                              key={symbol}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' 
                                    : 'hover:bg-slate-700 bg-slate-800 text-slate-300 border-slate-600'
                                }`}
                                onClick={() => handleTokenSelect(token)}
                              >
                                <div className="flex items-center space-x-1">
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {renderTokenLogo(token, 16)}
                                  </div>
                                  <span>{symbol}</span>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </Badge>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Token List */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">All Tokens</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {filteredTokens.map((token, index) => {
                          const isSelected = selectedToken.symbol === token.symbol
                          
                          return (
                            <motion.div
                              key={token.symbol}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <Button
                                variant="ghost"
                                className={`w-full justify-start h-auto p-3 transition-all ${
                                  isSelected 
                                    ? 'bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30' 
                                    : 'hover:bg-slate-800'
                                }`}
                                onClick={() => handleTokenSelect(token)}
                              >
                                <div className="w-8 h-8 flex items-center justify-center mr-3">
                                  {renderTokenLogo(token, 32)}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <div className={`text-sm font-medium ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                                      {token.symbol}
                                    </div>
                                    <div className="text-sm text-slate-300">{token.balance}</div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-slate-400">{token.name}</div>
                                    <div className="text-xs text-slate-400">{token.value}</div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-2"
                                  >
                                    <Check className="h-4 w-4 text-purple-400" />
                                  </motion.div>
                                )}
                              </Button>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="networks"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Current Token Context */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {renderTokenLogo(selectedToken, 24)}
                      </div>
                      <div>
                        <div className="text-sm text-slate-300">{selectedToken.symbol}</div>
                        <div className="text-xs text-slate-400">{selectedToken.name}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('tokens')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Change Token
                    </Button>
                  </div>

                  {/* Network List */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Available Networks</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {filteredNetworks.map((network, index) => {
                          const isSelected = selectedNetwork.id === network.id
                          
                          return (
                            <motion.div
                              key={network.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <Button
                                variant="ghost"
                                className={`w-full justify-start h-auto p-3 transition-all ${
                                  isSelected 
                                    ? 'bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30' 
                                    : 'hover:bg-slate-800'
                                }`}
                                onClick={() => handleNetworkSelect(network)}
                              >
                                <div className="w-8 h-8 flex items-center justify-center mr-3">
                                  {renderNetworkLogo(network, 32)}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`text-sm font-medium ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                                    {network.displayName}
                                  </div>
                                  <div className="text-xs text-slate-400">Chain ID: {network.chainId}</div>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-2"
                                  >
                                    <Check className="h-4 w-4 text-purple-400" />
                                  </motion.div>
                                )}
                              </Button>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}