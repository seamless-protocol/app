import { describe, it, expect, vi } from 'vitest'
import type { Address } from 'viem'
import { previewMint } from '../../../src/domain/mint-with-router/previewMint'

const manager = '0x0000000000000000000000000000000000000009' as Address
const token = '0x0000000000000000000000000000000000000008' as Address

describe('previewMint', () => {
  it('maps manager.previewMint result to PreviewMintResult', async () => {
    const publicClient = {
      readContract: vi.fn(async () => ({ shares: 123n, tokenFee: 2n, treasuryFee: 3n })),
    } as any

    const res = await previewMint({ publicClient }, manager, token, 1000n)
    expect(res).toEqual({ shares: 123n, tokenFee: 2n, treasuryFee: 3n })
    expect(publicClient.readContract).toHaveBeenCalled()
  })
})

