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
  seamStaking: import.meta.env['VITE_DISABLE_SEAM_STAKING'] !== 'true',

  // Testing
  // Enable test mode when explicitly set via VITE_TEST_MODE=mock
  // or when running E2E (VITE_E2E=1) to ensure MockConnector is available.
  testMode: (() => {
    const mode = import.meta.env['VITE_TEST_MODE']
    const e2e = import.meta.env['VITE_E2E']
    const isMock = mode === 'mock'
    const isE2E = e2e === '1'
    const enabled = isMock || isE2E
    console.log(
      '[features.ts] VITE_TEST_MODE:',
      JSON.stringify(mode),
      'VITE_E2E:',
      JSON.stringify(e2e),
      '=> testMode:',
      enabled,
    )
    return enabled
  })(),
} as const

// Expose for debugging in E2E tests (typed)
declare global {
  interface Window {
    __FEATURES__?: typeof features
    __VITE_TEST_MODE__?: string
  }
}

if (typeof window !== 'undefined') {
  window.__FEATURES__ = features
  window.__VITE_TEST_MODE__ = import.meta.env['VITE_TEST_MODE']
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature]
}
