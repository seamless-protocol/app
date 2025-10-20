import { useSyncWagmiConfig } from '@lifi/wallet-management'
import type { ExtendedChain } from '@lifi/widget'
import type { Config } from 'wagmi'
import { connectors } from '@/lib/config/wagmi.config'

interface LiFiSyncProps {
  config: Config
  children: React.ReactNode
}

export function LiFiSync({ config, children }: LiFiSyncProps) {
  // IMPORTANT: Restrict chains to our app's supported set
  // Passing LiFi's available chains here causes the wallet UI to expose many networks.
  // We intentionally sync only the chains defined in our wagmi config (Base + Mainnet).
  // Cast to a mutable array to satisfy differing type sources across dependencies
  const supportedChains = [...config.chains] as unknown as Array<ExtendedChain>
  useSyncWagmiConfig(config, connectors, supportedChains)

  return <>{children}</>
}
