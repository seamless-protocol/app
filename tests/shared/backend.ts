/**
 * Centralized backend detection and RPC URL resolution for tests
 */

export type TestBackend = 'anvil' | 'tenderly-jit'

export interface BackendConfig {
  backend: TestBackend
  rpcUrl: string
}

/**
 * Detect which test backend to use based on environment
 * Priority: TEST_RPC_URL (explicit) > Tenderly secrets (JIT) > Anvil (default)
 */
export function detectTestBackend(): BackendConfig {
  // 1. Explicit override - use provided RPC URL directly
  const explicitRpcUrl = process.env['TEST_RPC_URL']
  if (explicitRpcUrl) {
    // Could be either anvil or tenderly, but we don't need to distinguish
    return {
      backend: explicitRpcUrl.includes('tenderly') ? 'tenderly-jit' : 'anvil',
      rpcUrl: explicitRpcUrl,
    }
  }

  // 2. Check for Tenderly configuration
  const hasTenderlyConfig = !!(
    process.env['TENDERLY_ACCESS_KEY'] &&
    (process.env['TENDERLY_ACCOUNT'] || process.env['TENDERLY_ACCOUNT_SLUG']) &&
    (process.env['TENDERLY_PROJECT'] || process.env['TENDERLY_PROJECT_SLUG'])
  )

  if (hasTenderlyConfig) {
    return {
      backend: 'tenderly-jit',
      rpcUrl: '', // Will be created JIT
    }
  }

  // 3. Default to Anvil
  return {
    backend: 'anvil',
    rpcUrl: 'http://127.0.0.1:8545',
  }
}

/**
 * Check if we should skip Anvil startup (when using Tenderly or explicit RPC)
 */
export function shouldSkipAnvilStartup(): boolean {
  const config = detectTestBackend()
  return config.backend === 'tenderly-jit' || !!process.env['TEST_RPC_URL']
}

/**
 * Get the RPC URL that should be used for tests
 * This handles the case where TEST_RPC_URL might be set at runtime (e.g., by scripts)
 */
export function getTestRpcUrl(): string {
  // Always prefer TEST_RPC_URL if set (could be set by scripts at runtime)
  return process.env['TEST_RPC_URL'] || detectTestBackend().rpcUrl
}