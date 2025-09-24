import { describe, expect, it } from 'vitest'
import { RouterVersion } from '@/domain/mint/planner/types'
import { detectRouterVersion } from '@/domain/mint/utils/detectVersion'

describe('detectRouterVersion', () => {
  it('always returns V2 (router v1 has been removed)', () => {
    expect(detectRouterVersion()).toBe(RouterVersion.V2)
  })
})
