import { RouterVersion } from '../planner/types'

/**
 * Router version selection policy:
 * - Always returns V2 (router v1 has been removed).
 */
export function detectRouterVersion(): RouterVersion {
  return RouterVersion.V2
}
