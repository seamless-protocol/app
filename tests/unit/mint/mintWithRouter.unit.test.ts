import { describe, expect, it } from 'vitest'
import { ensureAllowance, orchestrateMint, previewMint } from '@/domain/mint'

describe('mint orchestrator API surface', () => {
  it('exports functions with expected types', () => {
    expect(typeof orchestrateMint).toBe('function')
    expect(typeof previewMint).toBe('function')
    expect(typeof ensureAllowance).toBe('function')
  })
})
