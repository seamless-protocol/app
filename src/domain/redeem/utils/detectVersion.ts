import { RouterVersion } from '../../mint/planner/types'

/**
 * Redeem router version selection policy:
 * - If explicitly set via `VITE_ROUTER_VERSION`, honor it.
 * Otherwise, default to V2.
 *
 * Note: Redeem uses the same router versions as mint since they share the same infrastructure.
 */
export function detectRedeemRouterVersion(): RouterVersion {
  const forced =
    (import.meta.env['VITE_ROUTER_VERSION'] as string | undefined) ?? ''.toString().toLowerCase()
  if (forced === 'v2') return RouterVersion.V2
  if (forced === 'v1') return RouterVersion.V1

  return RouterVersion.V2
}
