/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Required environment variables
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_BASE_RPC_URL: string
  readonly VITE_ETHEREUM_RPC_URL: string

  // Optional environment variables
  readonly VITE_SENTRY_DSN?: string

  // Feature flags
  readonly VITE_ENABLE_LEVERAGE_TOKENS?: string
  readonly VITE_ENABLE_VAULTS?: string
  readonly VITE_ENABLE_STAKING?: string
  readonly VITE_ENABLE_GOVERNANCE?: string
  readonly VITE_ENABLE_TOKEN_CREATION?: string
  readonly VITE_ENABLE_FEATURED_LEVERAGE_TOKENS?: string

  // API endpoint overrides (optional - defaults in config)
  readonly VITE_MORPHO_API_URL?: string
  readonly VITE_SEAMLESS_SUBGRAPH_URL?: string
  readonly VITE_FUUL_API_URL?: string
  readonly VITE_FUUL_SUBGRAPH_URL?: string
  readonly VITE_COINGECKO_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
