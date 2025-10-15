import { useSyncWagmiConfig } from '@lifi/wallet-management'
import { useAvailableChains } from '@lifi/widget'
import type { Config } from 'wagmi'
import { connectors } from '@/lib/config/wagmi.config'

interface LiFiSyncProps {
  config: Config
  children: React.ReactNode
}

export function LiFiSync({ config, children }: LiFiSyncProps) {
  const { chains } = useAvailableChains()
  // Pass the existing connectors from the config instead of empty array
  // This prevents LiFi from overriding RainbowKit's wallet configuration
  useSyncWagmiConfig(config, connectors as any, chains)

  return <>{children}</>
}
