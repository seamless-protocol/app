import { base } from 'viem/chains'
import { createConfig, http } from 'wagmi'
import { RPC } from './env'

// Single source of truth for Wagmi config in integration tests.
// Uses the TEST_RPC_URL (Tenderly VNet) when provided; otherwise falls back to Anvil.
export const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http(RPC.primary) },
  ssr: false,
})
