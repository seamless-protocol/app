"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import { ChevronDown, Search } from "lucide-react"

interface Token {
  symbol: string
  name: string
  balance: string
  value: string
  icon?: string
}

interface TokenSelectorProps {
  tokens: Token[]
  selectedToken: Token
  onTokenChange: (token: Token) => void
}

export function TokenSelector({ tokens, selectedToken, onTokenChange }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTokenSelect = (token: Token) => {
    onTokenChange(token)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getTokenIcon = (symbol: string) => {
    const colors: { [key: string]: string } = {
      'ETH': 'bg-blue-500',
      'USDC': 'bg-blue-600',
      'USDT': 'bg-green-500',
      'DAI': 'bg-yellow-500',
      'WBTC': 'bg-orange-500'
    }
    return colors[symbol] || 'bg-gray-500'
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 h-auto p-2 hover:bg-dark-elevated"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTokenIcon(selectedToken.symbol)}`}>
          <span className="text-xs font-medium text-white">
            {selectedToken.symbol.slice(0, 2)}
          </span>
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-dark-primary">{selectedToken.symbol}</div>
          <div className="text-xs text-dark-muted">{selectedToken.name}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-dark-muted" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-dark-card border-divider-line max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-dark-primary">Select Token</DialogTitle>
            <DialogDescription className="text-dark-secondary">
              Choose a token from your wallet to use in this transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-elevated border-divider-line text-dark-primary"
              />
            </div>

            {/* Popular Tokens */}
            <div>
              <h4 className="text-sm font-medium text-dark-muted mb-2">Popular</h4>
              <div className="flex flex-wrap gap-2">
                {['ETH', 'USDC', 'USDT', 'DAI'].map((symbol) => {
                  const token = tokens.find(t => t.symbol === symbol)
                  if (!token) return null
                  
                  return (
                    <Badge
                      key={symbol}
                      variant="secondary"
                      className="cursor-pointer hover:bg-brand-purple/20 bg-dark-elevated text-dark-secondary border border-divider-line"
                      onClick={() => handleTokenSelect(token)}
                    >
                      {symbol}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Token List */}
            <div>
              <h4 className="text-sm font-medium text-dark-muted mb-2">All Tokens</h4>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {filteredTokens.map((token) => (
                    <Button
                      key={token.symbol}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-dark-elevated"
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getTokenIcon(token.symbol)}`}>
                        <span className="text-xs font-medium text-white">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-dark-primary">{token.symbol}</div>
                          <div className="text-sm text-dark-primary">{token.balance}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-dark-muted">{token.name}</div>
                          <div className="text-xs text-dark-secondary">{token.value}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}