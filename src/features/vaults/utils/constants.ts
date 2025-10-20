export const STALE_TIME = {
  // DeFiLlama TVL for Seamless Vaults (latest datapoint)
  tvl: 15 * 60 * 1000, // 15 minutes
  apy: 15 * 60 * 1000, // 15 minutes
} as const

export const REFRESH_INTERVAL = {
  // Keep TVL fresh roughly every 15 minutes
  tvl: 15 * 60 * 1000, // 15 minutes
  apy: 15 * 60 * 1000, // 15 minutes
} as const
