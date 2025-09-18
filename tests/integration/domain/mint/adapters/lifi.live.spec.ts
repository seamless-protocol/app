import type { Address } from 'viem'
import { describe, expect, it } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'
import { BASE_WETH } from '@/lib/contracts/addresses'
import { ADDR, CHAIN_ID } from '../../../../shared/env'

// Opt-in live test: requires network access
const LIVE = process.env['LIFI_LIVE'] === '1'

// Base tokens
const WEETH = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address

describe.skipIf(!LIVE || !ADDR.router)('LiFi adapter live smoke', () => {
  it('returns approvalTarget, calldata, and out > 0', async () => {
    const router = (ADDR.routerV2 ?? ADDR.router) as Address
    const quote = createLifiQuoteAdapter({ chainId: CHAIN_ID, router })
    const amountIn = 10n ** 16n // 0.01 WETH
    const res = await quote({ inToken: BASE_WETH, outToken: WEETH, amountIn })
    expect(res.calldata.startsWith('0x')).toBe(true)
    expect(/^0x[a-fA-F0-9]{40}$/.test(res.approvalTarget)).toBe(true)
    expect(res.out).toBeGreaterThan(0n)
  })
})
