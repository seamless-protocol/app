/**
 * Feature flags for controlling feature visibility
 * Uses DISABLE environment variables - features are enabled by default unless explicitly disabled
 * Set VITE_DISABLE_FEATURE_NAME=true to disable a feature
 */
export const features = {
  // Main Features
  leverageTokens: import.meta.env['VITE_DISABLE_LEVERAGE_TOKENS'] !== 'true',
  morphoVaults: import.meta.env['VITE_DISABLE_VAULTS'] !== 'true',
  portfolio: import.meta.env['VITE_DISABLE_PORTFOLIO'] !== 'true',
  analytics: import.meta.env['VITE_DISABLE_ANALYTICS'] !== 'true',
  staking: import.meta.env['VITE_DISABLE_STAKING'] !== 'true',
  governance: import.meta.env['VITE_DISABLE_GOVERNANCE'] !== 'true',

  // UI Display Features
  featuredTokensSection: import.meta.env['VITE_DISABLE_FEATURED_LEVERAGE_TOKENS'] !== 'true',

  // Portfolio Features
  availableRewards: import.meta.env['VITE_DISABLE_AVAILABLE_REWARDS'] !== 'true',
  seamStaking: import.meta.env['VITE_DISABLE_SEAM_STAKING'] !== 'true',

  // Testing
  testMode: import.meta.env['VITE_TEST_MODE'] === 'mock',
} as const

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature]
}
