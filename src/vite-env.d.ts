/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Required environment variables
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_BASE_RPC_URL: string
  readonly VITE_ETHEREUM_RPC_URL: string

  // Optional environment variables
  readonly VITE_SENTRY_DSN?: string

  // Feature flags
  readonly VITE_DISABLE_LEVERAGE_TOKENS?: string
  readonly VITE_DISABLE_VAULTS?: string
  readonly VITE_DISABLE_PORTFOLIO?: string
  readonly VITE_DISABLE_ANALYTICS?: string
  readonly VITE_DISABLE_STAKING?: string
  readonly VITE_DISABLE_GOVERNANCE?: string
  readonly VITE_DISABLE_FEATURED_LEVERAGE_TOKENS?: string
  readonly VITE_DISABLE_AVAILABLE_REWARDS?: string
  readonly VITE_DISABLE_SEAM_STAKING?: string

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
