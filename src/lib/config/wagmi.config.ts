import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'

const walletConnectProjectId = import.meta.env['VITE_WALLETCONNECT_PROJECT_ID']

if (!walletConnectProjectId) {
  console.warn(
    'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file',
  )
}

// Test mode detection - use Tenderly VNet for all operations when in test mode
const isTestMode =
  import.meta.env['VITE_TEST_MODE'] === 'true' ||
  import.meta.env['VITE_MINT_REDEEM_TEST_MODE'] === 'true' ||
  import.meta.env['VITE_MINT_TEST_MODE'] === 'true'

// Resolve RPC URLs with test mode support
const baseRpc = isTestMode
  ? import.meta.env['VITE_TEST_RPC_URL'] || import.meta.env['TEST_RPC_URL']
  : import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org'

const mainnetRpc =
  import.meta.env['VITE_MAINNET_RPC_URL'] ||
  import.meta.env['VITE_ETHEREUM_RPC_URL'] ||
  'https://eth.llamarpc.com'

// Debug logging for test mode
if (isTestMode) {
  console.log('🧪 Test mode enabled - using Tenderly VNet for all operations')
  console.log('🌐 Base RPC:', baseRpc)
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

// Type augmentation for wagmi
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
