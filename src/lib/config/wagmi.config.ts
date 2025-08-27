import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'

const walletConnectProjectId = import.meta.env['VITE_WALLETCONNECT_PROJECT_ID']

if (!walletConnectProjectId) {
  console.warn(
    'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file',
  )
}

// Use RainbowKit's getDefaultConfig which handles connectors automatically
export const config = getDefaultConfig({
  appName: 'Seamless Protocol',
  projectId: walletConnectProjectId || 'YOUR_PROJECT_ID',
  chains: [base, mainnet],
  transports: {
    // In test mode, prioritize test RPC URLs over .env.local values
    [base.id]: http(
      import.meta.env['VITE_ANVIL_RPC_URL'] ||
        import.meta.env['VITE_BASE_RPC_URL'] ||
        'http://127.0.0.1:8545',
    ),
    [mainnet.id]: http(import.meta.env['VITE_MAINNET_RPC_URL'] || 'https://eth.llamarpc.com'),
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
