import { LiFiWidget as LiFiWidgetComponent, type WidgetConfig } from '@lifi/widget'
import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useAccount, useConnectorClient } from 'wagmi'

export function LiFiWidget() {
  const { isConnected, address } = useAccount()
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

  // LI.FI Widget configuration with custom theme matching app design
  const widgetConfig: WidgetConfig = useMemo(
    () => ({
      integrator: 'seamless-protocol',
      variant: 'wide',
      subvariant: 'split',
      appearance: 'light',
      theme: {
        colorSchemes: {
          light: {
            palette: {
              primary: {
                main: '#2A65C3',
              },
              secondary: {
                main: '#7C3AED',
              },
              background: {
                default: '#FAFAFB',
                paper: '#FFFFFF',
              },
              text: {
                primary: '#111827',
                secondary: '#4B5563',
              },
              common: {
                black: '#0B0D12',
              },
              grey: {
                200: '#E5E7EB',
                300: '#CBD5F5',
                700: '#4B5563',
                800: '#1D2432',
              },
            },
          },
          dark: {
            palette: {
              primary: {
                main: '#506BDF',
              },
              secondary: {
                main: '#7C3AED',
              },
              background: {
                default: '#0B0D12',
                paper: '#151A26',
              },
              text: {
                primary: '#F5F7FA',
                secondary: '#C7CFD9',
              },
            },
          },
        },
        typography: {
          fontFamily: '"Satoshi Variable", "Satoshi", sans-serif',
          // fontSize: 14,
          // fontWeightLight: 300,
          // fontWeightRegular: 400,
          // fontWeightMedium: 500,
          // fontWeightBold: 600,
        },
        container: {
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
          borderRadius: '16px',
        },
        shape: {
          borderRadiusSecondary: 8,
          borderRadius: 8,
        },
      },
      // Hide some UI elements to keep it clean
      hiddenUI: ['appearance', 'language'],
    }),
    [],
  )

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
          className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded-md gap-1.5 has-[>svg]:px-2.5 text-[var(--nav-text)] hover:text-[var(--text-primary)] transition-colors px-3 h-9 sm:h-10 border border-[var(--nav-border)] hover:border-[var(--nav-border-active)] bg-[var(--nav-surface)] hover:bg-[var(--nav-surface-hover)]"
          aria-label="Open swap and bridge interface (Alt+S)"
          title="Swap & Bridge"
        >
          <ArrowUpDown className="lucide lucide-arrow-up-down h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline font-medium">Swap/Bridge</span>
        </button>
      </motion.div>
    )
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
          className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded-md gap-1.5 has-[>svg]:px-2.5 text-[var(--nav-text)] hover:text-[var(--text-primary)] transition-colors px-3 h-9 sm:h-10 border border-[var(--nav-border)] hover:border-[var(--nav-border-active)] bg-[var(--nav-surface)] hover:bg-[var(--nav-surface-hover)]"
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
            className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
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
            <div className="relative">
              {/* Close Button - positioned relative to widget container */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer absolute -top-4 -right-4 w-10 h-10 rounded-full backdrop-blur-sm text-[var(--nav-text)] hover:text-[var(--text-primary)] transition-colors z-50 flex items-center justify-center text-xl font-light shadow-lg bg-[color-mix(in_srgb,var(--surface-card) 85%,transparent)] hover:bg-[var(--nav-surface-hover)]"
                aria-label="Close swap widget"
              >
                ×
              </button>

              {/* Widget Container */}
              <div className="lifi-widget">
                <LiFiWidgetComponent integrator="seamless-protocol" config={widgetConfig} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
