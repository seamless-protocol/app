import { RouterVersion } from '../planner/types'

/**
 * Router version selection policy:
 * - If explicitly set via `VITE_ROUTER_VERSION`, honor it.
 * - Else, if V2 env addresses are present, prefer V2.
 * - Else, default to V1.
 */
export function detectRouterVersion(): RouterVersion {
  const env: Record<string, string | undefined> = (() => {
    if (typeof import.meta !== 'undefined') {
      const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      if (metaEnv) return metaEnv
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env as Record<string, string | undefined>
    }
    return {}
  })()

  const forced = (env['VITE_ROUTER_VERSION'] ?? '').toString().toLowerCase()
  if (forced === 'v2') return RouterVersion.V2
  if (forced === 'v1') return RouterVersion.V1

  const hasV2Router = Boolean(env['VITE_ROUTER_V2_ADDRESS'])
  const hasV2Manager = Boolean(env['VITE_MANAGER_V2_ADDRESS'])
  if (hasV2Router && hasV2Manager) return RouterVersion.V2

  return RouterVersion.V1
}
