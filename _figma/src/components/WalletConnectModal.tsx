"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Alert, AlertDescription } from "./ui/alert"
import { 
  Wallet, 
  Smartphone, 
  Monitor, 
  Shield, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  QrCode,
  RefreshCw,
  Info,
  Chrome,
  Globe,
  Download
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface WalletOption {
  id: string
  name: string
  icon: string
  description: string
  type: 'browser' | 'mobile' | 'hardware'
  installed?: boolean
  downloadUrl?: string
  popular?: boolean
}

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (walletAddress: string) => void
}

const walletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using browser extension',
    type: 'browser',
    downloadUrl: 'https://metamask.io/download/',
    popular: true
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Scan with mobile wallet',
    type: 'mobile',
    popular: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Connect with Coinbase',
    type: 'browser',
    downloadUrl: 'https://wallet.coinbase.com/',
    popular: true
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '🔒',
    description: 'Connect hardware wallet',
    type: 'hardware',
    downloadUrl: 'https://www.ledger.com/'
  }
]

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [detectedWallets, setDetectedWallets] = useState<Set<string>>(new Set())

  // Detect installed wallets
  useEffect(() => {
    const detected = new Set<string>()
    
    if (typeof window !== 'undefined') {
      // Check for MetaMask
      if (window.ethereum?.isMetaMask) {
        detected.add('metamask')
      }
      
      // Check for Coinbase Wallet
      if (window.ethereum?.isCoinbaseWallet) {
        detected.add('coinbase')
      }
    }
    
    setDetectedWallets(detected)
  }, [isOpen])

  const handleWalletConnect = async (walletId: string) => {
    setConnectingWallet(walletId)
    setConnectionError(null)
    
    try {
      // Simulate wallet connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (walletId === 'walletconnect') {
        setShowQrCode(true)
        // Simulate QR code scanning
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      // Mock successful connection
      const mockAddress = '0x742d35Cc6634C0532925a3b8D85435ca2E38c72f'
      onConnect(mockAddress)
      onClose()
      
      toast.success('Wallet connected successfully', {
        description: `Connected with ${walletOptions.find(w => w.id === walletId)?.name}`
      })
      
    } catch (error) {
      setConnectionError(`Failed to connect to ${walletOptions.find(w => w.id === walletId)?.name}. Please try again.`)
      toast.error('Connection failed', {
        description: 'Please check your wallet and try again'
      })
    } finally {
      setConnectingWallet(null)
      setShowQrCode(false)
    }
  }

  const handleRetry = () => {
    setConnectionError(null)
    setConnectingWallet(null)
    setShowQrCode(false)
  }

  const getWalletStatus = (wallet: WalletOption) => {
    if (detectedWallets.has(wallet.id)) {
      return 'installed'
    }
    if (wallet.type === 'browser') {
      return 'not-installed'
    }
    return 'available'
  }

  const renderWalletOption = (wallet: WalletOption) => {
    const status = getWalletStatus(wallet)
    const isConnecting = connectingWallet === wallet.id
    const isDisabled = connectingWallet !== null && connectingWallet !== wallet.id

    return (
      <motion.div
        key={wallet.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      >
        <Card 
          className={`
            cursor-pointer transition-all duration-200 border-slate-700 bg-slate-800/50 hover:bg-slate-800
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isConnecting ? 'border-purple-500 bg-purple-500/10' : 'hover:border-purple-500/50'}
          `}
          onClick={() => !isDisabled && handleWalletConnect(wallet.id)}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="text-2xl sm:text-3xl flex-shrink-0">{wallet.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <h3 className="font-medium text-white text-sm sm:text-base truncate">{wallet.name}</h3>
                    {wallet.popular && (
                      <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 w-fit">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{wallet.description}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ml-2">
                {status === 'installed' && (
                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Installed</span>
                    <span className="sm:hidden">✓</span>
                  </Badge>
                )}
                
                {status === 'not-installed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-slate-600 text-slate-400 hover:text-white h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(wallet.downloadUrl, '_blank')
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Install</span>
                    <span className="sm:hidden">Get</span>
                  </Button>
                )}
                
                {isConnecting ? (
                  <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center">
                    {wallet.type === 'browser' && <Chrome className="h-4 w-4 text-slate-400" />}
                    {wallet.type === 'mobile' && <Smartphone className="h-4 w-4 text-slate-400" />}
                    {wallet.type === 'hardware' && <Shield className="h-4 w-4 text-slate-400" />}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-md w-[95vw] sm:w-full backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span>Connect Wallet</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose how you'd like to connect your wallet to Seamless Protocol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Security Notice */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Shield className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              We do not store any personal information. Your wallet stays secure and private.
            </AlertDescription>
          </Alert>

          {/* Connection Error */}
          {connectionError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200 flex items-center justify-between">
                  <span className="text-sm">{connectionError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="text-red-400 hover:text-red-300 p-1 h-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* QR Code Display */}
          {showQrCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-slate-800" />
                  </div>
                  <h3 className="font-medium text-white mb-2">Scan QR Code</h3>
                  <p className="text-sm text-slate-400">
                    Open your mobile wallet and scan the QR code to connect
                  </p>
                  <div className="flex justify-center mt-4">
                    <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Wallet Options */}
          {!showQrCode && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Available Wallets</h3>
              
              {/* Popular wallets first */}
              {walletOptions
                .filter(wallet => wallet.popular)
                .map(renderWalletOption)}
              
              {/* Other wallets */}
              {walletOptions
                .filter(wallet => !wallet.popular)
                .map(renderWalletOption)}
            </div>
          )}

          {/* Help Section */}
          {!showQrCode && !connectingWallet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="pt-4 border-t border-slate-700"
            >
              <div className="flex items-start space-x-3 text-sm">
                <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-300 mb-2">New to crypto wallets?</p>
                  <Button
                    variant="link"
                    className="text-purple-400 hover:text-purple-300 p-0 h-auto text-sm"
                    onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
                  >
                    Learn about wallets
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Cancel Button */}
          {!connectingWallet && !showQrCode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 h-10"
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}