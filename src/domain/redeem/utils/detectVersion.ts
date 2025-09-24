import { RouterVersion } from '../../mint/planner/types'

/**
 * Redeem router version selection policy:
 * - Always returns V2 (router v1 has been removed).
 *
 * Note: Redeem uses the same router versions as mint since they share the same infrastructure.
 */
export function detectRedeemRouterVersion(): RouterVersion {
  return RouterVersion.V2
}
