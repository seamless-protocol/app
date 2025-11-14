/**
 * Centralized test configuration logic
 * Consolidates scattered environment variable and test token inclusion logic
 */

import type { BackendMode } from './backend'

/**
 * Determines whether test-only tokens should be included
 *
 * Priority:
 * 1. Explicit VITE_INCLUDE_TEST_TOKENS environment variable
 * 2. Auto-enable for Tenderly backends (deterministic test tokens)
 * 3. Default to false for Anvil/production (use production tokens)
 */
export function shouldIncludeTestTokens(backend?: BackendMode): boolean {
  // Explicit env var takes precedence
  const explicit = process.env['VITE_INCLUDE_TEST_TOKENS']
  if (explicit !== undefined) {
    return explicit === 'true'
  }

  // If no backend specified, check if we're in a test environment
  if (!backend) {
    // Default: include test tokens if we're running in a test context
    const isTestEnv = process.env['NODE_ENV'] === 'test' || process.env['VITEST'] === 'true'
    return isTestEnv
  }

  // Auto-enable for Tenderly backends (which use deterministic test token configs)
  return backend === 'tenderly-jit' || backend === 'tenderly-static'
}

/**
 * Determines which token source to use based on backend
 *
 * @param backend - The backend mode being used
 * @returns 'tenderly' for Tenderly backends, 'prod' for Anvil/production
 */
export function getTokenSource(backend: BackendMode): 'prod' | 'tenderly' {
  if (backend === 'tenderly-jit' || backend === 'tenderly-static') {
    return 'tenderly'
  }
  return 'prod'
}
