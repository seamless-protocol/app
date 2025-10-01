/**
 * Environment variable validation and helpers
 */

// Required environment variables that must be present
const REQUIRED_ENV_VARS = [
  'VITE_WALLETCONNECT_PROJECT_ID',
    'VITE_THEGRAPH_API_KEY',
] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

// Typed feature flags
export type FeatureFlag = 'LEVERAGE_TOKENS' | 'VAULTS' | 'STAKING' | 'GOVERNANCE' | 'TOKEN_CREATION'

/**
 * Validates that all required environment variables are present
 * Throws an error with helpful message if any are missing
 */
export function validateEnv(): void {
  const missing: Array<string> = []

  for (const key of REQUIRED_ENV_VARS) {
    if (!import.meta.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
Missing required environment variables:
${missing.map((key) => `  - ${key}`).join('\n')}

Please check your .env.local file and ensure all required variables are set.
See .env.example for the complete list.
    `.trim()

    throw new Error(errorMessage)
  }
}

/**
 * Get an environment variable value with type safety
 */
export function getEnvVar(key: RequiredEnvVar): string
export function getEnvVar(key: string, defaultValue?: string): string | undefined
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  // Safe dynamic access with nullish coalescing
  const dynamicEnv = import.meta.env as unknown as Record<string, string | undefined>
  return dynamicEnv[key] ?? defaultValue
}

/**
 * Check if a feature flag is enabled
 * Feature flags are considered enabled if set to 'true' (case-insensitive)
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Safe dynamic access with proper typing
  const dynamicEnv = import.meta.env as unknown as Record<string, string | undefined>
  const value = dynamicEnv[`VITE_ENABLE_${feature}`]
  return value?.toLowerCase() === 'true'
}

/**
 * Get the current environment (development, production, etc.)
 */
export function getEnvironment(): string {
  return import.meta.env.MODE || 'development'
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD
}
