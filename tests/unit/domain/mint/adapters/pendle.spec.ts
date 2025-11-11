import type { Address } from 'viem'
import { base } from 'viem/chains'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPendleQuoteAdapter } from '@/domain/shared/adapters/pendle'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'

// Test addresses
const ROUTER: Address = '0x1111111111111111111111111111111111111111'
const IN_TOKEN: Address = '0x2222222222222222222222222222222222222222'
const OUT_TOKEN: Address = '0x3333333333333333333333333333333333333333'
const APPROVAL_TARGET: Address = '0x4444444444444444444444444444444444444444'

describe('createPendleQuoteAdapter', () => {
  const originalFetch = global.fetch
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.restoreAllMocks()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    global.fetch = originalFetch
    consoleLogSpy.mockRestore()
  })

  // Helper to create valid Pendle success response
  const createSuccessResponse = (overrides?: {
    inputs?: Array<{ token: string; amount: string }>
    outputs?: Array<{ token: string; amount: string }>
    txTo?: string
    txData?: string
    txValue?: string
    txFrom?: string
  }) => ({
    action: 'swap',
    inputs: overrides?.inputs ?? [{ token: IN_TOKEN, amount: '1000000000000000000' }],
    requiredApprovals: [{ token: IN_TOKEN, amount: '1000000000000000000' }],
    routes: [
      {
        contractParamInfo: {
          method: 'swap',
          contractCallParamsName: ['tokenIn', 'tokenOut', 'amountIn'],
          contractCallParams: [null, null, null],
        },
        tx: {
          to: overrides?.txTo ?? APPROVAL_TARGET,
          from: overrides?.txFrom ?? ROUTER,
          data: overrides?.txData ?? '0xdeadbeef',
          value: overrides?.txValue,
        },
        outputs: overrides?.outputs ?? [{ token: OUT_TOKEN, amount: '2000000000000000000' }],
        data: {
          aggregatorType: 'pendle',
          priceImpact: 0.01,
        },
      },
    ],
  })

  describe('Successful Quotes', () => {
    it('maps response fields correctly for exactIn quote', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.out).toBe(2000000000000000000n)
      expect(result.maxIn).toBe(1000000000000000000n)
      expect(result.approvalTarget.toLowerCase()).toBe(APPROVAL_TARGET.toLowerCase())
      expect(result.calldata).toBe('0xdeadbeef')
      expect(result.wantsNativeIn).toBe(false)
    })

    it('sets wantsNativeIn to true when inToken is ETH_SENTINEL', async () => {
      const response = createSuccessResponse({
        inputs: [{ token: ETH_SENTINEL, amount: '1000000000000000000' }],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: ETH_SENTINEL,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.wantsNativeIn).toBe(true)
    })

    it('handles bigint amounts correctly', async () => {
      const response = createSuccessResponse({
        inputs: [{ token: IN_TOKEN, amount: '50000000000000000000' }],
        outputs: [{ token: OUT_TOKEN, amount: '95000000000000000000' }],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 50000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.out).toBe(95000000000000000000n)
      expect(result.maxIn).toBe(50000000000000000000n)
    })
  })

  describe('URL Building', () => {
    it('builds correct API URL with default baseUrl', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.origin).toBe('https://api-v2.pendle.finance')
      expect(url.pathname).toBe(`/core/v2/sdk/${base.id}/convert`)
    })

    it('uses custom baseUrl when provided', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        baseUrl: 'https://custom-api.example.com',
      })

      await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.origin).toBe('https://custom-api.example.com')
    })

    it('includes correct query parameters', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 100,
      })

      await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 5000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('receiver')).toBe(ROUTER)
      expect(url.searchParams.get('slippage')).toBe('0.01')
      expect(url.searchParams.get('enableAggregator')).toBe('true')
      expect(url.searchParams.get('tokensIn')).toBe(IN_TOKEN)
      expect(url.searchParams.get('amountsIn')).toBe('5000000000000000000')
      expect(url.searchParams.get('tokensOut')).toBe(OUT_TOKEN)
      expect(url.searchParams.get('redeemRewards')).toBe('false')
      expect(url.searchParams.get('needScale')).toBe('false')
    })

    it('uses default slippage when not provided', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('slippage')).toBe('0.005') // DEFAULT_SLIPPAGE_BPS = 50
    })

    it('handles zero amountIn', async () => {
      const response = createSuccessResponse({
        inputs: [{ token: IN_TOKEN, amount: '0' }],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 0n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('amountsIn')).toBe('0')
    })
  })

  describe('Error Handling', () => {
    it('throws error for exactOut intent', async () => {
      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountOut: 1000000000000000000n,
          intent: 'exactOut',
        }),
      ).rejects.toThrow('Pendle adapter only supports exactIn quotes')
    })

    it('throws error with API error message when available', async () => {
      const errorResponse = {
        message: 'Invalid action: Unable to classify convert action',
        statusCode: 400,
      }
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(errorResponse), {
          status: 400,
          statusText: 'Bad Request',
        }),
      )
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Pendle quote failed: Invalid action: Unable to classify convert action')
    })

    it('falls back to status text when error response cannot be parsed', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      )
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Pendle quote failed: 500 Internal Server Error')
    })

    it('falls back to status text when error response has unexpected format', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
        }),
      )
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Pendle quote failed: 404 Not Found')
    })

    it('throws error when response has no routes', async () => {
      const response = {
        action: 'swap',
        inputs: [{ token: IN_TOKEN, amount: '1000000000000000000' }],
        requiredApprovals: [],
        routes: [],
      }
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Pendle quote returned no routes')
    })

    it('throws error when output token not found in route outputs', async () => {
      const response = createSuccessResponse({
        outputs: [
          { token: '0x9999999999999999999999999999999999999999', amount: '2000000000000000000' },
        ],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Pendle quote missing output token')
    })

    it('throws error when input token not found in response inputs', async () => {
      const response = createSuccessResponse({
        inputs: [
          { token: '0x9999999999999999999999999999999999999999', amount: '1000000000000000000' },
        ],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Pendle quote missing input token')
    })

    it('throws error when response is invalid JSON', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(new Response('invalid json', { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('throws error when response schema validation fails', async () => {
      const invalidResponse = {
        action: 'swap',
        // Missing required fields
      }
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(invalidResponse), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('throws error when tx.data is invalid hex', async () => {
      const response = createSuccessResponse({
        txData: 'not-a-hex-string',
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      await expect(
        adapter({
          inToken: IN_TOKEN,
          outToken: OUT_TOKEN,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })
  })

  describe('Response Mapping', () => {
    it('handles multiple outputs and finds correct outToken', async () => {
      const response = createSuccessResponse({
        outputs: [
          { token: '0x9999999999999999999999999999999999999999', amount: '1000000000000000000' },
          { token: OUT_TOKEN, amount: '2000000000000000000' },
          { token: '0x8888888888888888888888888888888888888888', amount: '3000000000000000000' },
        ],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.out).toBe(2000000000000000000n)
    })

    it('handles multiple inputs and finds correct inToken', async () => {
      const response = createSuccessResponse({
        inputs: [
          { token: '0x9999999999999999999999999999999999999999', amount: '5000000000000000000' },
          { token: IN_TOKEN, amount: '1000000000000000000' },
        ],
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.maxIn).toBe(1000000000000000000n)
    })

    it('handles optional tx.value field', async () => {
      const response = createSuccessResponse({
        txValue: '1000000000000000000',
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      // Should still work with optional value field
      expect(result.calldata).toBe('0xdeadbeef')
    })

    it('sets minOut to 0n (not used)', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.minOut).toBe(0n)
    })
  })

  describe('Address Normalization', () => {
    it('normalizes addresses using getAddress (checksum validation)', async () => {
      // getAddress normalizes addresses to checksummed format
      // Test that addresses are properly normalized even if API returns lowercase
      const response = createSuccessResponse({
        inputs: [{ token: IN_TOKEN.toLowerCase(), amount: '1000000000000000000' }],
        outputs: [{ token: OUT_TOKEN.toLowerCase(), amount: '2000000000000000000' }],
        txTo: APPROVAL_TARGET.toLowerCase(),
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createPendleQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
      })

      const result = await adapter({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(result.out).toBe(2000000000000000000n)
      expect(result.maxIn).toBe(1000000000000000000n)
      // getAddress will normalize to checksummed format
      expect(result.approvalTarget).toBe(APPROVAL_TARGET)
    })
  })
})
