import type { Address } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'

const ROUTER = '0x1111111111111111111111111111111111111111' as Address
const IN = '0x2222222222222222222222222222222222222222' as Address
const OUT = '0x3333333333333333333333333333333333333333' as Address

describe('LiFi adapter (exact-out URL)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch as any
  })

  it('uses toAmount and omits fromAmount when intent is exactOut', async () => {
    const step = {
      estimate: {
        toAmount: '1000',
        toAmountMin: '1000',
        fromAmount: '1234',
        approvalAddress: ROUTER,
      },
      transactionRequest: { to: ROUTER, data: '0xdeadbeef' },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(step), { status: 200 }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).fetch = fetchMock

    const quote = createLifiQuoteAdapter({ router: ROUTER })
    await quote({ inToken: IN, outToken: OUT, amountIn: 0n, amountOut: 10n, intent: 'exactOut' })

    const url = new URL((fetchMock.mock.calls[0] as Array<any>)[0])
    expect(url.pathname).toBe('/v1/quote/toAmount')
    expect(url.searchParams.get('toAmount')).toBe('10')
    expect(url.searchParams.get('fromAmount')).toBeNull()
  })
})
