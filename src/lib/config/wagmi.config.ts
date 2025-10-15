import { connectorsForWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { fallback, http } from 'viem'
import type { Config } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { createLogger } from '@/lib/logger'

const logger = createLogger('wagmi-config')

const walletConnectProjectId = import.meta.env['VITE_WALLETCONNECT_PROJECT_ID']

if (!walletConnectProjectId) {
  logger.warn(
    'WalletConnect Project ID not found. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file',
  )
}

export const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [rainbowWallet, metaMaskWallet, coinbaseWallet],
    },
    {
      groupName: 'Others',
      wallets: [walletConnectWallet, injectedWallet, safeWallet],
    },
  ],
  {
    appName: 'Seamless Protocol',
    projectId: walletConnectProjectId || 'YOUR_PROJECT_ID',
  },
)

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

// Single Alchemy key for simplicity
const alchemyKey = import.meta.env['VITE_ALCHEMY_API_KEY']

// Build ordered endpoint candidates per chain
const baseCandidates = [
  // Test/VNet overrides (kept first when enabled)
  rpcMap?.['8453'] || rpcMap?.['base'],
  useTenderlyVNet ? testRpcCandidate : undefined,
  // Alchemy (preferred when available)
  alchemyKey ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}` : undefined,
  // Custom env override
  import.meta.env['VITE_BASE_RPC_URL'],
  // Public fallbacks
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.meowrpc.com',
  'https://1rpc.io/base',
].filter(Boolean) as Array<string>

const mainnetCandidates = [
  // Map override (if provided)
  rpcMap?.['1'] || rpcMap?.['mainnet'],
  // Alchemy (preferred when available)
  alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : undefined,
  // Custom env overrides
  import.meta.env['VITE_MAINNET_RPC_URL'] || import.meta.env['VITE_ETHEREUM_RPC_URL'],
  // Public fallbacks
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
  'https://1rpc.io/eth',
].filter(Boolean) as Array<string>

// Debug logging for Tenderly VNet mode
if (useTenderlyVNet) {
  logger.info('Tenderly VNet mode enabled', { baseRpc: baseCandidates[0] })
}

export const config = getDefaultConfig({
  appName: 'Seamless Protocol',
  projectId: walletConnectProjectId || 'YOUR_PROJECT_ID',
  chains: [base, mainnet],
  transports: {
    [base.id]: fallback(baseCandidates.map((u) => http(u))),
    [mainnet.id]: fallback(mainnetCandidates.map((u) => http(u))),
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
