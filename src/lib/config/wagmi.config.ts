import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { type Config, http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { createLogger } from '@/lib/logger'

const logger = createLogger('wagmi-config')

const walletConnectProjectId = import.meta.env['VITE_WALLETCONNECT_PROJECT_ID']

if (!walletConnectProjectId) {
  logger.warn(
    'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file',
  )
}

// Optional JSON map to direct chain RPCs in mock/test modes
// Example: {"8453":"https://virtual.base...","1":"https://virtual.mainnet..."}
function readTestRpcUrlMap(): Record<string, string> | undefined {
  const raw = import.meta.env['VITE_TEST_RPC_URL_MAP']
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return undefined
    return parsed as Record<string, string>
  } catch {
    return undefined
  }
}

// Tenderly VNet mode detection - enable whenever the flag, a test RPC, or a URL map is present
const testRpcCandidate =
  import.meta.env['VITE_TEST_RPC_URL'] ||
  import.meta.env['VITE_TENDERLY_VNET_PRIMARY_RPC'] ||
  import.meta.env['VITE_TENDERLY_RPC_URL']
const rpcMap = readTestRpcUrlMap()

const useTenderlyVNet =
  import.meta.env['VITE_USE_TENDERLY_VNET'] === 'true' || Boolean(testRpcCandidate || rpcMap)

// Resolve RPC URLs (prefer map if provided)
const baseRpc =
  (rpcMap?.['8453'] || rpcMap?.['base']) ??
  (useTenderlyVNet
    ? testRpcCandidate || import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org'
    : import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org')

const mainnetRpc =
  (rpcMap?.['1'] || rpcMap?.['mainnet']) ??
  (import.meta.env['VITE_MAINNET_RPC_URL'] ||
    import.meta.env['VITE_ETHEREUM_RPC_URL'] ||
    'https://eth.llamarpc.com')

// Debug logging for Tenderly VNet mode
if (useTenderlyVNet) {
  logger.info('Tenderly VNet mode enabled', { baseRpc })
}

// Use RainbowKit's getDefaultConfig which handles connectors automatically
export const config = getDefaultConfig({
  appName: 'Seamless Protocol',
  projectId: walletConnectProjectId || 'YOUR_PROJECT_ID',
  chains: [base, mainnet],
  transports: {
    [base.id]: http(baseRpc),
    [mainnet.id]: http(mainnetRpc),
  },
  ssr: false, // Critical for IPFS deployment - we're a pure client-side app
  // Improve wallet connection behavior
  syncConnectedChain: true, // Sync chain changes immediately
})

export type AppWagmiConfig = Config

// Type augmentation for wagmi
declare module 'wagmi' {
  interface Register {
    config: AppWagmiConfig
  }
}
