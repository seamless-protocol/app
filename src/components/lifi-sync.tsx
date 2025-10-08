import { useSyncWagmiConfig } from '@lifi/wallet-management'
import { useAvailableChains } from '@lifi/widget'
import type { Config } from 'wagmi'

interface LiFiSyncProps {
  config: Config
  children: React.ReactNode
}

export function LiFiSync({ config, children }: LiFiSyncProps) {
  const { chains } = useAvailableChains()
  useSyncWagmiConfig(config, [], chains)

  return <>{children}</>
}
