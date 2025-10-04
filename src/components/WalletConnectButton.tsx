import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'
import { useRef, useState } from 'react'
import { useWalletGA } from '@/lib/config/ga4.config'
import { CustomAccountModal } from './CustomAccountModal'
import { Button } from './ui/button'

export function WalletConnectButton() {
  const [customAccountModalOpen, setCustomAccountModalOpen] = useState(false)
  const { trackWalletConnected } = useWalletGA()
  const hasTrackedConnection = useRef(false)

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        // Track wallet connection state changes
        if (connected && account && !hasTrackedConnection.current) {
          // Determine wallet type from account displayName or use generic
          const walletType = account.displayName || 'Unknown'
          trackWalletConnected(walletType)
          hasTrackedConnection.current = true
        } else if (!connected) {
          hasTrackedConnection.current = false
        }

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 rounded-md gap-1.5 has-[>svg]:px-2.5 h-9 px-3 sm:h-10 sm:px-4 cursor-pointer bg-cta-gradient hover:bg-cta-hover-gradient active:bg-cta-active-gradient text-[var(--cta-text)] border-0"
                  >
                    <Wallet className="lucide lucide-wallet h-4 w-4 sm:mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    size="lg"
                    className="px-6 py-2"
                  >
                    Wrong network
                  </Button>
                )
              }

              return (
                <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
                  {/* Network Indicator - Clickable for switching */}
                  <div className="hidden md:block">
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="flex items-center space-x-2 px-3 h-9 sm:h-10 rounded-lg border transition-all cursor-pointer bg-card border-border text-secondary-foreground hover:bg-accent hover:text-foreground hover:border-brand-purple"
                      aria-label="Switch network"
                    >
                      {chain.hasIcon && (
                        <div className="w-3 h-3">
                          <div
                            className="relative size-full rounded-full overflow-hidden"
                            style={{
                              background: chain.iconBackground,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="block size-full"
                              />
                            )}
                          </div>
                        </div>
                      )}
                      <span className="text-xs text-secondary-foreground group-hover:text-foreground">
                        {chain.name}
                      </span>
                    </button>
                  </div>

                  {/* Wallet Button */}
                  <button
                    type="button"
                    onClick={() => setCustomAccountModalOpen(true)}
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 h-9 sm:h-10 cursor-pointer bg-card border border-border text-secondary-foreground hover:text-foreground hover:bg-accent hover:border-brand-purple"
                  >
                    <div className="flex items-center space-x-2">
                      <Wallet
                        className="lucide lucide-wallet h-4 w-4 text-green-500"
                        aria-hidden="true"
                      />
                      <span className="items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-xs hidden sm:inline-flex border-border bg-accent text-foreground">
                        {account.displayName}
                      </span>
                    </div>
                  </button>
                </div>
              )
            })()}
            {/* Custom Account Modal */}
            {connected && (
              <CustomAccountModal
                isOpen={customAccountModalOpen}
                onClose={() => setCustomAccountModalOpen(false)}
                account={account}
                chain={{
                  id: chain.id,
                  name: chain.name || `Chain ${chain.id}`,
                }}
              />
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
