import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'

const walletConnectProjectId = import.meta.env['VITE_WALLETCONNECT_PROJECT_ID']

if (!walletConnectProjectId) {
  console.warn(
    'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file',
  )
}

// Resolve RPC URLs with sensible fallbacks and support both naming conventions
const baseRpc = import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org'
const mainnetRpc =
  import.meta.env['VITE_MAINNET_RPC_URL'] ||
  import.meta.env['VITE_ETHEREUM_RPC_URL'] ||
  'https://eth.llamarpc.com'

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

// Type augmentation for wagmi
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
