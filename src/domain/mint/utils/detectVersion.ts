import { RouterVersion } from '../planner/types'

/**
 * Router version selection policy:
 * - If explicitly set via `VITE_ROUTER_VERSION`, honor it.
 * - Else, if V2 env addresses are present, prefer V2.
 * - Else, default to V1.
 */
type EnvMap = Record<string, string | undefined>

export function detectRouterVersion(envOverride?: EnvMap): RouterVersion {
  const read = (key: string) => (envOverride ? envOverride[key] : readEnv(key))

  const forced = read('VITE_ROUTER_VERSION')?.toLowerCase() ?? ''
  if (forced === 'v2') return RouterVersion.V2
  if (forced === 'v1') return RouterVersion.V1

  return RouterVersion.V2
}

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined') {
    const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env
    if (metaEnv && Object.hasOwn(metaEnv, key)) {
      const value = metaEnv[key]
      return typeof value === 'string' ? value : value != null ? String(value) : undefined
    }

    // When running under Vite/Vitest, treat import.meta.env as the source of truth even if empty.
    if (metaEnv) return undefined
  }

  if (typeof import.meta === 'undefined' && typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }

  return undefined
}
