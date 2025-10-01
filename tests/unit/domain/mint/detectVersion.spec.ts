import { describe, expect, it } from 'vitest'
import { RouterVersion } from '@/domain/mint/planner/types'
import { detectRouterVersion } from '@/domain/mint/utils/detectVersion'

describe('detectRouterVersion', () => {
  it('defaults to V2 when no env present', () => {
    expect(detectRouterVersion({})).toBe(RouterVersion.V2)
  })

  it('honors VITE_ROUTER_VERSION=v2 override', () => {
    expect(detectRouterVersion({ VITE_ROUTER_VERSION: 'v2' })).toBe(RouterVersion.V2)
  })

  it('allows forcing V1 when explicitly requested', () => {
    expect(detectRouterVersion({ VITE_ROUTER_VERSION: 'v1' })).toBe(RouterVersion.V1)
  })

  it('prefers V2 when both V2 addresses present', () => {
    expect(
      detectRouterVersion({
        VITE_ROUTER_V2_ADDRESS: '0xrouter',
        VITE_MANAGER_V2_ADDRESS: '0xmanager',
      }),
    ).toBe(RouterVersion.V2)
  })
})
