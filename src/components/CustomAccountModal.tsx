import { Copy, ExternalLink, LogOut, Moon, Palette, Settings, Sun, Wallet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDisconnect } from 'wagmi'
import { getAddressExplorerUrl } from '../lib/utils/block-explorer'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Switch } from './ui/switch'

interface CustomAccountModalProps {
  account?:
    | {
        address: string
        displayName: string
      }
    | undefined
  chain?:
    | {
        id: number
        name: string
      }
    | undefined
  isOpen: boolean
  onClose: () => void
}

export function CustomAccountModal({ account, chain, isOpen, onClose }: CustomAccountModalProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { disconnect } = useDisconnect()

  const copyAddress = async () => {
    if (!account?.address) return
    try {
      await navigator.clipboard.writeText(account.address)
      toast.success('Address copied to clipboard', {
        icon: '✓',
        position: 'top-center',
      })
    } catch (_err) {
      toast.error('Failed to copy address')
    }
  }

  const viewOnExplorer = () => {
    if (!account?.address || !chain?.id) return
    const explorerUrl = getAddressExplorerUrl(chain.id, account.address)
    window.open(explorerUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDisconnect = () => {
    if (account) {
      disconnect()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 border-slate-700 max-w-md backdrop-blur-sm">
        <DialogHeader className="flex flex-col gap-2 text-center sm:text-left">
          <DialogTitle className="text-lg leading-none font-semibold flex items-center space-x-3 text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400 mb-3">
            {account
              ? 'Manage your wallet connection and app preferences'
              : 'Manage your app preferences'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Info Card - Only show when connected */}
          {account && chain && (
            <div className="space-y-3 mt-3">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-purple-400" />
                <h3 className="font-medium text-white">Wallet</h3>
              </div>
              <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-800/50 border-slate-700">
                <div className="[&:last-child]:pb-6 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Connected Wallet</p>
                        <Badge className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-secondary/90 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-600">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm text-slate-300 font-mono">
                        {account.address.slice(0, 6)}...{account.address.slice(-4)}
                      </code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAddress}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        aria-label="Copy wallet address"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={viewOnExplorer}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        aria-label="View on Etherscan"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="w-full mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings - Always show */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-purple-400" />
              <h3 className="font-medium text-white">Appearance</h3>
            </div>
            <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-800/50 border-slate-700">
              <div className="[&:last-child]:pb-6 p-4">
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
                  <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-6">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
