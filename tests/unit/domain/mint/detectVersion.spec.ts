import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterVersion } from '@/domain/mint/planner/types'
import { detectRouterVersion } from '@/domain/mint/utils/detectVersion'

describe('detectRouterVersion', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    ;(import.meta as any).env = {}
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    ;(import.meta as any).env = {}
  })

  it('defaults to V1 when no env present', () => {
    expect(detectRouterVersion()).toBe(RouterVersion.V1)
  })

  it('honors VITE_ROUTER_VERSION=v2 override', () => {
    vi.stubEnv('VITE_ROUTER_VERSION', 'v2')
    ;(import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_ROUTER_VERSION: 'v2',
    }
    expect(detectRouterVersion()).toBe(RouterVersion.V2)
  })

  it('prefers V2 when both V2 addresses present', () => {
    vi.stubEnv('VITE_ROUTER_V2_ADDRESS', '0xrouter')
    vi.stubEnv('VITE_MANAGER_V2_ADDRESS', '0xmanager')
    ;(import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_ROUTER_V2_ADDRESS: '0xrouter',
      VITE_MANAGER_V2_ADDRESS: '0xmanager',
    }
    expect(detectRouterVersion()).toBe(RouterVersion.V2)
  })
})
