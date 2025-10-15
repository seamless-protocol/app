import type { Address } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'

const ROUTER = '0x1111111111111111111111111111111111111111' as Address
const IN = '0x2222222222222222222222222222222222222222' as Address
const OUT = '0x3333333333333333333333333333333333333333' as Address

describe('createLifiQuoteAdapter', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch as any
  })

  it('maps toAmountMin, approvalAddress, and transactionRequest.data', async () => {
    const step = {
      estimate: { toAmount: '1000', toAmountMin: '900', approvalAddress: ROUTER },
      transactionRequest: { to: ROUTER, data: '0xdeadbeef' },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(step), { status: 200 }))
    global.fetch = fetchMock as any

    const quote = createLifiQuoteAdapter({
      router: ROUTER,
      slippageBps: 50,
      baseUrl: 'https://li.quest',
    })
    const res = await quote({ inToken: IN, outToken: OUT, amountIn: 123n })
    expect(res.out).toBe(1000n)
    expect(res.approvalTarget.toLowerCase()).toBe(ROUTER.toLowerCase())
    expect(res.calldata).toBe('0xdeadbeef')

    const url = new URL((fetchMock.mock.calls[0] as Array<any>)[0])
    expect(url.pathname).toBe('/v1/quote')
    expect(url.searchParams.get('slippage')).toBe('0.005')
    expect(url.searchParams.get('fromAddress')?.toLowerCase()).toBe(ROUTER.toLowerCase())
  })

  it('falls back to toAmount when toAmountMin missing', async () => {
    const step = {
      estimate: { toAmount: '777' },
      transactionRequest: { to: ROUTER, data: '0x00' },
    }
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(step), { status: 200 })) as any

    const quote = createLifiQuoteAdapter({ router: ROUTER })
    const res = await quote({ inToken: IN, outToken: OUT, amountIn: 1n })
    expect(res.out).toBe(777n)
  })

  // No stepTransaction fallback — adapter requires transactionRequest in quote

  it('throws if missing approval target or data', async () => {
    // missing both estimate.approvalAddress and tx.to/data
    const bad = { estimate: {}, transactionRequest: {} }
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(bad), { status: 200 })) as any
    const quote = createLifiQuoteAdapter({ router: ROUTER })
    await expect(quote({ inToken: IN, outToken: OUT, amountIn: 1n })).rejects.toThrow()
  })

  it('includes skipSimulation=true by default for performance', async () => {
    const step = {
      estimate: { toAmount: '1000', toAmountMin: '900', approvalAddress: ROUTER },
      transactionRequest: { to: ROUTER, data: '0xdeadbeef' },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(step), { status: 200 }))
    global.fetch = fetchMock as any

    const quote = createLifiQuoteAdapter({ router: ROUTER })
    await quote({ inToken: IN, outToken: OUT, amountIn: 123n })

    const url = new URL((fetchMock.mock.calls[0] as Array<any>)[0])
    expect(url.searchParams.get('skipSimulation')).toBe('true')
  })
})
