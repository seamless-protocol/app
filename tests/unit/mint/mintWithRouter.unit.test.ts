import { describe, expect, it } from 'vitest'
import { checkAllowance, mintWithRouter, previewMint } from '@/domain/mint-with-router'

describe('mint-with-router API surface (slice 1)', () => {
  it('exports functions with expected types', () => {
    expect(typeof mintWithRouter).toBe('function')
    expect(typeof previewMint).toBe('function')
    expect(typeof checkAllowance).toBe('function')
  })
})
