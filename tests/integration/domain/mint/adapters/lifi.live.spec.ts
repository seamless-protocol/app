import type { Address } from 'viem'
import { describe, expect, it } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'

// Opt-in live test: requires network and TEST_ROUTER
const LIVE = process.env['LIFI_LIVE'] === '1'
const ROUTER = process.env['TEST_ROUTER'] as Address | undefined

// Base tokens
const WETH = '0x4200000000000000000000000000000000000006' as Address
const WEETH = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address

describe.skipIf(!LIVE || !ROUTER)('LiFi adapter live smoke', () => {
  it('returns approvalTarget, calldata, and out > 0', async () => {
    const router = ROUTER as Address
    const quote = createLifiQuoteAdapter({ chainId: 8453, router })
    const amountIn = 10n ** 16n // 0.01 WETH
    const res = await quote({ inToken: WETH, outToken: WEETH, amountIn })
    expect(res.calldata.startsWith('0x')).toBe(true)
    expect(/^0x[a-fA-F0-9]{40}$/.test(res.approvalTarget)).toBe(true)
    expect(res.out).toBeGreaterThan(0n)
  })
})
