"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner@2.0.3"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string) => void
}

interface WalletOption {
  id: string
  name: string
  icon: string
  category: 'popular' | 'more'
  isInstalled?: boolean
  downloadUrl?: string
}

const walletOptions: WalletOption[] = [
  // Popular wallets
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    category: 'popular',
    downloadUrl: 'https://rainbow.me/'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    category: 'popular',
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    category: 'popular',
    isInstalled: typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
    downloadUrl: 'https://metamask.io/'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    category: 'popular'
  },
  // More wallets
  {
    id: 'argent',
    name: 'Argent',
    icon: '🔺',
    category: 'more',
    downloadUrl: 'https://www.argent.xyz/'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '🛡️',
    category: 'more',
    downloadUrl: 'https://trustwallet.com/'
  },
  {
    id: 'omni',
    name: 'Omni',
    icon: '⚫',
    category: 'more'
  },
  {
    id: 'imtoken',
    name: 'imToken',
    icon: '💎',
    category: 'more',
    downloadUrl: 'https://token.im/'
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '🔐',
    category: 'more',
    downloadUrl: 'https://www.ledger.com/'
  }
]

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)

  const handleWalletSelect = async (wallet: WalletOption) => {
    if (isConnecting) return

    setIsConnecting(true)
    setConnectingWallet(wallet.id)

    try {
      // Check if wallet is installed
      if (wallet.id === 'metamask' && !(window as any).ethereum?.isMetaMask) {
        toast.error('MetaMask not found', {
          description: 'Please install MetaMask extension to continue',
          action: {
            label: 'Download',
            onClick: () => window.open(wallet.downloadUrl, '_blank')
          }
        })
        return
      }

      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate mock wallet address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`
      
      onConnect(mockAddress)
      
      toast.success(`Connected to ${wallet.name}`, {
        description: `Successfully connected your ${wallet.name} wallet`
      })

    } catch (error) {
      toast.error('Connection failed', {
        description: `Failed to connect to ${wallet.name}. Please try again.`
      })
    } finally {
      setIsConnecting(false)
      setConnectingWallet(null)
    }
  }

  const popularWallets = walletOptions.filter(w => w.category === 'popular')
  const moreWallets = walletOptions.filter(w => w.category === 'more')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-md backdrop-blur-sm p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Connect a Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Seamless Protocol and access DeFi features
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="p-6"
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Connect a Wallet</h2>
          </div>

          {/* Popular Wallets */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
              Popular
            </h3>
            <div className="space-y-2">
              {popularWallets.map((wallet, index) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleWalletSelect(wallet)}
                    disabled={isConnecting}
                    className="w-full h-14 px-4 justify-start hover:bg-slate-800/60 transition-all duration-200 rounded-xl group"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-2xl shrink-0 group-hover:bg-slate-700/50 transition-colors">
                        {wallet.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{wallet.name}</span>
                          {wallet.isInstalled && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                              Installed
                            </Badge>
                          )}
                        </div>
                      </div>
                      {connectingWallet === wallet.id && (
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* More Wallets */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
              More
            </h3>
            <div className="space-y-2">
              {moreWallets.map((wallet, index) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: (popularWallets.length + index) * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleWalletSelect(wallet)}
                    disabled={isConnecting}
                    className="w-full h-14 px-4 justify-start hover:bg-slate-800/60 transition-all duration-200 rounded-xl group"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-2xl shrink-0 group-hover:bg-slate-700/50 transition-colors">
                        {wallet.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{wallet.name}</span>
                          {wallet.isInstalled && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                              Installed
                            </Badge>
                          )}
                        </div>
                      </div>
                      {connectingWallet === wallet.id && (
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="flex items-center justify-between pt-4 border-t border-slate-700/50"
          >
            <span className="text-sm text-slate-400">New to Ethereum wallets?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 h-8 rounded-lg font-medium"
            >
              Learn More
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}