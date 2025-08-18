/**
 * Feature flags for controlling feature visibility
 * Uses environment variables for configuration
 */
export const features = {
  // Phase II - Currently in development
  leverageTokens: import.meta.env['VITE_ENABLE_LEVERAGE_TOKENS'] !== 'false',
  // Token creation is an advanced feature within Phase II - disabled by default
  leverageTokenCreation: import.meta.env['VITE_ENABLE_LEVERAGE_TOKEN_CREATION'] === 'true',

  // Phase III - Not started
  morphoVaults: import.meta.env['VITE_ENABLE_VAULTS'] === 'true',
  dashboard: import.meta.env['VITE_ENABLE_DASHBOARD'] === 'true',

  // Phase V - Not started
  staking: import.meta.env['VITE_ENABLE_STAKING'] === 'true',

  // Phase VI - Not started
  governance: import.meta.env['VITE_ENABLE_GOVERNANCE'] === 'true',

  // Phase VII - Advanced features - Not started
  advancedFilters: import.meta.env['VITE_ENABLE_ADVANCED_FILTERS'] === 'true',
  portfolioPnl: import.meta.env['VITE_ENABLE_PORTFOLIO_PNL'] === 'true',

  // Testing
  testMode: import.meta.env['VITE_TEST_MODE'] === 'mock',
} as const

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature]
}
