"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Switch } from "./ui/switch"
import { Separator } from "./ui/separator"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { 
  Settings, 
  Copy, 
  Check, 
  LogOut, 
  Sun, 
  Moon, 
  Wallet,
  Shield,
  Palette,
  ExternalLink,
  User
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
  isDarkMode: boolean
  onThemeToggle: () => void
  onDisconnectWallet: () => void
  isWalletConnected: boolean
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  walletAddress = "0x1234...5678",
  isDarkMode,
  onThemeToggle,
  onDisconnectWallet,
  isWalletConnected 
}: SettingsModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (!walletAddress) return
    
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success("Address copied to clipboard")
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy address")
      console.error('Copy failed:', error)
    }
  }

  const handleDisconnect = () => {
    onDisconnectWallet()
    onClose()
    toast.success("Wallet disconnected")
  }

  const formatWalletAddress = (address: string) => {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage your wallet connection and app preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Section */}
          {isWalletConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-purple-400" />
                  <h3 className="font-medium text-white">Wallet</h3>
                </div>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Connected Wallet</p>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            Connected
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-slate-300 font-mono">
                          {formatWalletAddress(walletAddress)}
                        </code>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyAddress}
                          className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                          aria-label="Copy wallet address"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
                          className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                          aria-label="View on Etherscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={handleDisconnect}
                      className="w-full mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Appearance Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-purple-400" />
                <h3 className="font-medium text-white">Appearance</h3>
              </div>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                        {isDarkMode ? (
                          <Moon className="h-5 w-5 text-slate-300" />
                        ) : (
                          <Sun className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {isDarkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={onThemeToggle}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Security</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Always verify transaction details before signing. Never share your private keys or seed phrase.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="pt-2"
          >
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
            >
              Done
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}