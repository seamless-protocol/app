import { describe, it, expect } from 'vitest'
import {
  mintWithRouter,
  previewMint,
  checkAllowance,
} from '@/domain/mint-with-router'

describe('mint-with-router API surface (slice 1)', () => {
  it('exports functions with expected types', () => {
    expect(typeof mintWithRouter).toBe('function')
    expect(typeof previewMint).toBe('function')
    expect(typeof checkAllowance).toBe('function')
  })
})
