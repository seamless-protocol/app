import { describe, expect, it } from 'vitest'
import { bpsToDecimalString } from '@/domain/shared/adapters/constants'

describe('bpsToDecimalString', () => {
  it('converts basis points to decimal string', () => {
    expect(bpsToDecimalString(50)).toBe('0.005') // 50 bps = 0.5%
  })
})