import { Settings } from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { CustomAccountModal } from './CustomAccountModal'

export function ModeToggle() {
  const { isConnected, address, chain } = useAccount()
  const [customModalOpen, setCustomModalOpen] = useState(false)

  const handleSettingsClick = () => {
    // Always open the custom modal, regardless of wallet state
    setCustomModalOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSettingsClick}
        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 rounded-md gap-1.5 has-[>svg]:px-2.5 text-[var(--nav-text)] hover:text-[var(--text-primary)] transition-colors p-2 h-9 w-9 sm:h-10 sm:w-10 cursor-pointer bg-[var(--nav-surface)] border border-[var(--nav-border)] hover:border-[var(--nav-border-active)] hover:bg-[var(--nav-surface-hover)]"
        aria-label="Open settings"
      >
        <Settings className="lucide lucide-settings h-4 w-4" aria-hidden="true" />
      </button>

      {/* Custom Account Modal - Always show when clicked */}
      {customModalOpen && (
        <CustomAccountModal
          isOpen={customModalOpen}
          onClose={() => setCustomModalOpen(false)}
          account={
            isConnected && address
              ? {
                  address,
                  displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
                }
              : undefined
          }
          chain={
            isConnected && chain
              ? {
                  id: (chain as { id: number; name?: string }).id,
                  name:
                    (chain as { id: number; name?: string }).name ||
                    `Chain ${(chain as { id: number; name?: string }).id}`,
                }
              : undefined
          }
        />
      )}
    </>
  )
}
