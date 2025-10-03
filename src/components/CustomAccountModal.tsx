import { Copy, ExternalLink, LogOut, Moon, Palette, Settings, Sun, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDisconnect } from 'wagmi'
import { useTheme } from '@/components/theme-provider'
import { useExplorer } from '@/lib/hooks/useExplorer'
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
  const { theme, setTheme } = useTheme()
  const getSystemTheme = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? getSystemTheme : () => theme,
  )
  const { disconnect } = useDisconnect()
  const explorer = useExplorer()

  // Keep resolvedTheme in sync with current theme and system preference
  useEffect(() => {
    if (theme === 'system') {
      if (typeof window === 'undefined') return
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')

      handleChange()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    setResolvedTheme(theme)
    return undefined
  }, [theme])

  const isDarkMode = resolvedTheme === 'dark'
  const appearanceTitle =
    theme === 'system' ? 'System Theme' : isDarkMode ? 'Dark Mode' : 'Light Mode'
  const appearanceDescription =
    theme === 'system'
      ? `System preference currently ${resolvedTheme === 'dark' ? 'dark' : 'light'}`
      : isDarkMode
        ? 'Dark theme is enabled'
        : 'Light theme is enabled'

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
    if (!account?.address) return
    const url = explorer.addressUrl(account.address)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDisconnect = () => {
    if (account) {
      disconnect()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="relative sm:max-w-lg max-w-md backdrop-blur-sm bg-card border border-border text-foreground">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="cursor-pointer absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--divider-line)] bg-[var(--surface-card)] text-secondary-foreground shadow-sm transition-colors hover:text-foreground hover:bg-accent"
        >
          ×
        </button>
        <DialogHeader className="flex flex-col gap-2 text-center sm:text-left">
          <DialogTitle className="text-lg leading-none font-semibold flex items-center space-x-3 text-foreground">
            <div className="w-8 h-8 bg-[var(--cta-gradient)] rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-[var(--cta-text)]" />
            </div>
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mb-3">
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
                <Wallet className="h-4 w-4 text-brand-purple" />
                <h3 className="font-medium text-foreground">Wallet</h3>
              </div>
              <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-accent border-border">
                <div className="[&:last-child]:pb-6 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Connected Wallet</p>
                        <Badge
                          variant="success"
                          className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-xs"
                        >
                          <div className="w-2 h-2 bg-[var(--tag-success-text)] rounded-full mr-1"></div>
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-accent rounded-lg p-3 border border-border">
                    <div className="flex flex-col">
                      {/* Prefer ENS name when available, fallback to address */}
                      <span className="text-sm text-foreground">
                        {account.displayName && !account.displayName.startsWith('0x')
                          ? account.displayName
                          : `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                      </span>
                      <code className="text-xs text-secondary-foreground font-mono">
                        {account.address.slice(0, 6)}...{account.address.slice(-4)}
                      </code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAddress}
                        className="h-8 w-8 p-0 text-secondary-foreground hover:text-foreground hover:bg-accent"
                        aria-label="Copy wallet address"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={viewOnExplorer}
                        className="h-8 w-8 p-0 text-secondary-foreground hover:text-foreground hover:bg-accent"
                        aria-label={`View on ${explorer.name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="w-full mt-3 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
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
              <Palette className="h-4 w-4 text-brand-purple" />
              <h3 className="font-medium text-foreground">Appearance</h3>
            </div>
            <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-accent border-border">
              <div className="[&:last-child]:pb-6 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      {isDarkMode ? (
                        <Moon className="h-5 w-5 text-secondary-foreground" />
                      ) : (
                        <Sun className="h-5 w-5 text-[var(--state-warning-text)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{appearanceTitle}</p>
                      <p className="text-sm text-muted-foreground">{appearanceDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-6">
          <Button onClick={onClose} className="w-full" variant="gradient">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
