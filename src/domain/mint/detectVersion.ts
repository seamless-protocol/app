import type { Address, PublicClient } from 'viem'
import { leverageRouterV2Abi } from '@/lib/contracts'
import { RouterVersion } from './types'

/**
 * Cache of router address -> detected version to avoid repeated RPC probes.
 */
const cache = new Map<Address, RouterVersion>()

/**
 * Reads `VITE_ROUTER_VERSION` and returns a forced version when set.
 * Accepts: 'v1' | 'v2' | 'auto' (default). Returns null when not forced.
 */
function forcedVersionFromEnv(): RouterVersion | null {
  const v = (import.meta.env['VITE_ROUTER_VERSION'] ?? 'auto').toString().toLowerCase()
  if (v === 'v1') return RouterVersion.V1
  if (v === 'v2') return RouterVersion.V2
  return null
}

/**
 * Detects router version for a given router address.
 * - Honors `VITE_ROUTER_VERSION` when explicitly set.
 * - Caches detections per router address.
 * - Probes for V2 by simulating the V2-only `mintWithCalls` function; falls back to V1 on error.
 */
export async function detectRouterVersion(
  publicClient: PublicClient,
  router: Address,
): Promise<RouterVersion> {
  const f = forcedVersionFromEnv()
  if (f) return f
  const hit = cache.get(router)
  if (hit) return hit

  try {
    await publicClient.simulateContract({
      address: router,
      abi: leverageRouterV2Abi,
      functionName: 'mintWithCalls',
      args: ['0x0000000000000000000000000000000000000000', 0n, 0n, 0n, []],
      account: '0x0000000000000000000000000000000000000001',
    })
    cache.set(router, RouterVersion.V2)
    return RouterVersion.V2
  } catch {
    cache.set(router, RouterVersion.V1)
    return RouterVersion.V1
  }
}
