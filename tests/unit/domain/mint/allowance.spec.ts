import type { Address, Hash } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { ensureAllowance } from '@/domain/mint/utils/allowance'

function makePublicClient(allowance: bigint) {
  return {
    readContract: vi.fn(async () => allowance),
    simulateContract: vi.fn(async (req: any) => ({ request: req })),
  } as any
}

function makeWalletClient() {
  return {
    writeContract: vi.fn(async (_req: any) => '0xhash' as Hash),
  } as any
}

const TOKEN = '0x0000000000000000000000000000000000000001' as Address
const OWNER = '0x0000000000000000000000000000000000000002' as Address
const SPENDER = '0x0000000000000000000000000000000000000003' as Address

describe('ensureAllowance', () => {
  it('returns early when allowance is sufficient', async () => {
    const pc = makePublicClient(2000n)
    const wc = makeWalletClient()
    const res = await ensureAllowance({
      publicClient: pc as any,
      walletClient: wc as any,
      token: TOKEN,
      owner: OWNER,
      spender: SPENDER,
      minAmount: 1000n,
    })
    expect(res.changed).toBe(false)
    expect((pc.readContract as any).mock.calls.length).toBe(1)
    expect((wc.writeContract as any).mock.calls.length).toBe(0)
  })

  it('approves max when insufficient', async () => {
    const pc = makePublicClient(0n)
    const wc = makeWalletClient()
    const res = await ensureAllowance({
      publicClient: pc as any,
      walletClient: wc as any,
      token: TOKEN,
      owner: OWNER,
      spender: SPENDER,
      minAmount: 1000n,
    })
    expect(res.changed).toBe(true)
    expect(res.hash).toBeDefined()
    // One write for approve(max)
    expect((wc.writeContract as any).mock.calls.length).toBe(1)
  })

  it('resets to zero then approves max when resetThenMax=true', async () => {
    const pc = makePublicClient(10n)
    const wc = makeWalletClient()
    const res = await ensureAllowance({
      publicClient: pc as any,
      walletClient: wc as any,
      token: TOKEN,
      owner: OWNER,
      spender: SPENDER,
      minAmount: 1000n,
      resetThenMax: true,
    })
    expect(res.changed).toBe(true)
    // Two writes: approve(0) then approve(max)
    expect((wc.writeContract as any).mock.calls.length).toBe(2)
  })
})
