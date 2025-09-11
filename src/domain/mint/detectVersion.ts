import { RouterVersion } from './types'

/**
 * Router version selection policy:
 * - Default to V1 for safety.
 * - Allow explicit override via `VITE_ROUTER_VERSION=v2` to flip the switch.
 */
export async function detectRouterVersion(): Promise<RouterVersion> {
  const v = (import.meta.env['VITE_ROUTER_VERSION'] ?? 'v1').toString().toLowerCase()
  if (v === 'v2') return RouterVersion.V2
  return RouterVersion.V1
}
