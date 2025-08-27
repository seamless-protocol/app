import { Widget } from '@kyberswap/widgets'
import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useAccount, useChainId, useConnectorClient } from 'wagmi'

export function KyberSwapWidget() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: client } = useConnectorClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Handle click when wallet is not connected
  const handleSwapClick = () => {
    if (!isConnected || !client || !address) {
      toast.info('Please connect your wallet first', {
        description: 'You need to connect a wallet to use swap and bridge features',
      })
      return
    }
    setIsModalOpen(true)
  }

  // Show a clickable button when wallet is not connected
  if (!isConnected || !client || !address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        tabIndex={0}
      >
        <button
          type="button"
          onClick={handleSwapClick}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors px-3 h-9 sm:h-10 border border-slate-700 hover:border-purple-500/50"
          aria-label="Open swap and bridge interface (Alt+S)"
          title="Swap & Bridge"
        >
          <ArrowUpDown className="lucide lucide-arrow-up-down h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline font-medium">Swap/Bridge</span>
        </button>
      </motion.div>
    )
  }

  // Default token configuration - can be customized based on chain
  const defaultTokenOut: Record<string, string> = {
    '1': '0xA0b86a33E6441E88A6c6a5b5b4F2C6c7b8c3c3c3', // Example ETH mainnet token
    '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    // Add more chains as needed
  }

  return (
    <>
      {/* Swap Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        tabIndex={0}
      >
        <button
          type="button"
          onClick={handleSwapClick}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors px-3 h-9 sm:h-10 border border-slate-700 hover:border-purple-500/50"
          aria-label="Open swap and bridge interface (Alt+S)"
          title="Swap & Bridge"
        >
          <ArrowUpDown className="lucide lucide-arrow-up-down h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline font-medium">Swap/Bridge</span>
        </button>
      </motion.div>

      {/* Modal */}
      {isModalOpen &&
        createPortal(
          <div
            data-state="open"
            data-slot="dialog-overlay"
            className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
            style={{ pointerEvents: 'auto' }}
            data-aria-hidden="true"
            aria-hidden="true"
            onClick={(e) => {
              // Close modal when clicking backdrop
              if (e.target === e.currentTarget) {
                setIsModalOpen(false)
              }
            }}
          >
            <div className="flex items-center justify-center min-h-screen p-4 relative">
              {/* Close Button - positioned relative to screen */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 flex items-center justify-center text-xl font-light"
                aria-label="Close swap widget"
              >
                ×
              </button>

              {/* Widget Container */}
              <div className="kyber-swap-widget">
                {/* @ts-ignore - KyberSwap widget types are complex */}
                <Widget
                  client="seamless-protocol"
                  chainId={chainId}
                  connectedAccount={{ address, chainId }}
                  onSubmitTx={async (tx: unknown) => {
                    console.log('Transaction submitted:', tx)
                    return (tx as { hash?: string })?.hash || ''
                  }}
                  theme={{
                    text: '#ffffff',
                    subText: '#d1d5db',
                    primary: '#0f172aF2',
                    dialog: '#2a2a30',
                    secondary: '#1e293b80',
                    interactive: '#374151',
                    stroke: '#2f2f35',
                    accent: '#9333ea',
                    success: '#10b981',
                    warning: '#facc15',
                    error: '#ef4444',
                    fontFamily: 'Satoshi Variable, Satoshi, sans-serif',
                    borderRadius: '12px',
                    buttonRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  tokenList={[]}
                  enableRoute={true}
                  enableDexes="kyberswap-elastic,uniswapv3,uniswap"
                  defaultTokenOut={defaultTokenOut[chainId.toString()] || undefined}
                  title={<div className="text-white font-medium">Swap</div>}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
