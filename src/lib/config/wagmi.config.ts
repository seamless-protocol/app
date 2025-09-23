import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { type Config, http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'

const walletConnectProjectId = import.meta.env['VITE_WALLETCONNECT_PROJECT_ID']

if (!walletConnectProjectId) {
  console.warn(
    'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file',
  )
}

// Tenderly VNet mode detection - enable whenever the flag or a test RPC is present
const testRpcCandidate =
  import.meta.env['VITE_TEST_RPC_URL'] ||
  import.meta.env['VITE_TENDERLY_VNET_PRIMARY_RPC'] ||
  import.meta.env['VITE_TENDERLY_RPC_URL']

const useTenderlyVNet =
  import.meta.env['VITE_USE_TENDERLY_VNET'] === 'true' || Boolean(testRpcCandidate)

// Resolve RPC URLs with Tenderly VNet support
const baseRpc = useTenderlyVNet
  ? testRpcCandidate || import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org'
  : import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org'

const mainnetRpc =
  import.meta.env['VITE_MAINNET_RPC_URL'] ||
  import.meta.env['VITE_ETHEREUM_RPC_URL'] ||
  'https://eth.llamarpc.com'

// Debug logging for Tenderly VNet mode
if (useTenderlyVNet) {
  console.log('[wagmi] Tenderly VNet mode enabled')
  console.log('[wagmi] Base RPC:', baseRpc)
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
