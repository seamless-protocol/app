import type { Address } from 'viem'
import { base } from 'viem/chains'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasVeloraData } from '@/domain/shared/adapters/types'
import { createVeloraQuoteAdapter } from '@/domain/shared/adapters/velora'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'

// Mock getTokenDecimals to return 18 for all tokens
vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getTokenDecimals: vi.fn(() => 18),
}))

// Test addresses
const ROUTER: Address = '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57'
const WETH: Address = '0x4200000000000000000000000000000000000006'
const WEETH: Address = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A'
const AUGUSTUS: Address = '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57'

describe('createVeloraQuoteAdapter', () => {
  const originalFetch = global.fetch
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.restoreAllMocks()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    global.fetch = originalFetch
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  // Helper to create valid success response
  const createSuccessResponse = (overrides?: {
    srcAmount?: string
    destAmount?: string
    contractAddress?: string
    contractMethod?: string
    data?: string
  }) => ({
    priceRoute: {
      srcAmount: overrides?.srcAmount ?? '1000000000000000000',
      destAmount: overrides?.destAmount ?? '2000000000000000000',
      contractAddress: overrides?.contractAddress ?? AUGUSTUS,
      contractMethod: overrides?.contractMethod ?? 'swapExactAmountOut',
    },
    txParams: {
      data: overrides?.data ?? '0xdeadbeef',
    },
  })

  describe('ExactIn Quotes (Mint Flow)', () => {
    it('maps response to Quote correctly (out, approvalTarget, calldata)', async () => {
      const response = createSuccessResponse({
        srcAmount: '1000000000000000000',
        destAmount: '2000000000000000000',
        data: '0x12345678',
      })

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      const quote = await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(quote.out).toBe(2000000000000000000n)
      expect(quote.approvalTarget.toLowerCase()).toBe(AUGUSTUS.toLowerCase())
      expect(quote.calls[0]?.data).toBe('0x12345678')
      expect(quote.maxIn).toBe(1000000000000000000n)
    })

    it('builds URL with exactIn parameters (side=SELL)', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('side')).toBe('SELL')
      expect(url.searchParams.get('amount')).toBe('1000000000000000000')
      expect(url.searchParams.get('network')).toBe('8453')
      expect(url.searchParams.get('version')).toBe('6.2')
    })

    it('handles native token (ETH_SENTINEL) normalization to 0x0...0', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: ETH_SENTINEL,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('srcToken')).toBe('0x0000000000000000000000000000000000000000')
    })

    it('converts slippageBps to slippage param correctly', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 250, // 2.5%
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('slippage')).toBe('250')
    })

    it('includes srcDecimals and destDecimals in URL', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('srcDecimals')).toBe('18')
      expect(url.searchParams.get('destDecimals')).toBe('18')
    })

    it('does NOT attach veloraData for exactIn quotes', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      const quote = await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(hasVeloraData(quote)).toBe(false)
    })

    it('sets wantsNativeIn=true when inToken is ETH_SENTINEL', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      const quote = await adapter({
        inToken: ETH_SENTINEL,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(quote.wantsNativeIn).toBe(true)
    })

    it('logs console message for exactIn with method name', async () => {
      const response = createSuccessResponse({ contractMethod: 'swapExactAmountIn' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(consoleLogSpy).toHaveBeenCalledWith('[velora-adapter] ParaSwap method', {
        method: 'swapExactAmountIn',
        intent: 'exactIn',
        note: 'No offsets needed for regular deposit() with exactIn',
      })
    })
  })

  describe('ExactOut Quotes (Redeem Flow)', () => {
    it('maps response with veloraData (augustus, offsets)', async () => {
      const response = createSuccessResponse({
        contractMethod: 'swapExactAmountOut',
        contractAddress: AUGUSTUS,
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      const quote = await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountOut: 2000000000000000000n,
        intent: 'exactOut',
      })

      expect(hasVeloraData(quote)).toBe(true)
      if (hasVeloraData(quote)) {
        expect(quote.veloraData.augustus.toLowerCase()).toBe(AUGUSTUS.toLowerCase())
        expect(quote.veloraData.offsets.exactAmount).toBe(132n)
        expect(quote.veloraData.offsets.limitAmount).toBe(100n)
        expect(quote.veloraData.offsets.quotedAmount).toBe(164n)
      }
    })

    it('builds URL with exactOut parameters (side=BUY, amount=amountOut)', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountOut: 2000000000000000000n,
        intent: 'exactOut',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('side')).toBe('BUY')
      expect(url.searchParams.get('amount')).toBe('2000000000000000000')
    })

    it('validates contractMethod === swapExactAmountOut', async () => {
      const response = createSuccessResponse({ contractMethod: 'swapExactAmountOut' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountOut: 2000000000000000000n,
          intent: 'exactOut',
        }),
      ).resolves.toBeDefined()
    })

    it('throws on unsupported method: swapExactAmountOutOnUniswapV2', async () => {
      const response = createSuccessResponse({ contractMethod: 'swapExactAmountOutOnUniswapV2' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountOut: 2000000000000000000n,
          intent: 'exactOut',
        }),
      ).rejects.toThrow(/unsupported ParaSwap method/)
    })

    it('throws on unsupported method: swapExactAmountOutOnUniswapV3', async () => {
      const response = createSuccessResponse({ contractMethod: 'swapExactAmountOutOnUniswapV3' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountOut: 2000000000000000000n,
          intent: 'exactOut',
        }),
      ).rejects.toThrow('swapExactAmountOutOnUniswapV3')
    })

    it('uses fromAddress override when provided', async () => {
      const FROM_ADDRESS: Address = '0x9999999999999999999999999999999999999999'
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        fromAddress: FROM_ADDRESS,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountOut: 2000000000000000000n,
        intent: 'exactOut',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('userAddress')?.toLowerCase()).toBe(FROM_ADDRESS.toLowerCase())
    })

    it('defaults fromAddress to router when not provided', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountOut: 2000000000000000000n,
        intent: 'exactOut',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('userAddress')?.toLowerCase()).toBe(ROUTER.toLowerCase())
    })
  })

  describe('Zod Validation & Parsing', () => {
    it('throws on invalid srcAmount (non-BigInt string)', async () => {
      const response = createSuccessResponse({ srcAmount: 'not-a-number' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('throws on invalid destAmount (non-BigInt string)', async () => {
      const response = createSuccessResponse({ destAmount: 'invalid' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('throws on invalid contractAddress (non-address)', async () => {
      const response = createSuccessResponse({ contractAddress: 'not-an-address' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('throws on invalid hex data (missing 0x prefix)', async () => {
      const response = createSuccessResponse({ data: 'deadbeef' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('throws on invalid hex data (non-hex characters)', async () => {
      const response = createSuccessResponse({ data: '0xGGGG' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()
    })

    it('parses valid srcAmount/destAmount as BigInt', async () => {
      const response = createSuccessResponse({
        srcAmount: '999999999999999999',
        destAmount: '888888888888888888',
      })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      const quote = await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      expect(quote.out).toBe(888888888888888888n)
      expect(quote.maxIn).toBe(999999999999999999n)
    })

    it('checksums contractAddress via getAddress', async () => {
      const lowercaseAddress = '0xdef171fe48cf0115b1d80b88dc8eab59176fee57'
      const response = createSuccessResponse({ contractAddress: lowercaseAddress })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      const quote = await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      // Should be checksummed
      expect(quote.approvalTarget).toBe('0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57')
    })
  })

  describe('Error Handling', () => {
    it('throws on API error response { error: string }', async () => {
      const errorResponse = { error: 'Insufficient liquidity' }
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(errorResponse), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Insufficient liquidity')
    })

    it('logs error to console when API returns error', async () => {
      const errorResponse = { error: 'Price impact too high' }
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(errorResponse), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Velora error from API', {
        errorMessage: 'Price impact too high',
      })
    })

    it('throws on HTTP non-200 status', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Velora quote failed: 500')
    })

    it('throws on network fetch failure', async () => {
      const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network error'))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          amountIn: 1000000000000000000n,
          intent: 'exactIn',
        }),
      ).rejects.toThrow('Network error')
    })

    it('throws when amountOut missing for exactOut', async () => {
      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          intent: 'exactOut',
        } as any),
      ).rejects.toThrow('exact-out quote requires amountOut')
    })

    it('throws when amountIn missing for exactIn', async () => {
      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await expect(
        adapter({
          inToken: WETH,
          outToken: WEETH,
          intent: 'exactIn',
        } as any),
      ).rejects.toThrow('exact-in quote requires amountIn')
    })
  })

  describe('Configuration & Edge Cases', () => {
    it('uses baseUrl override (custom API endpoint)', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
        baseUrl: 'https://custom-api.example.com',
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.origin).toBe('https://custom-api.example.com')
      expect(url.pathname).toBe('/swap')
    })

    it('filters methods via includeContractMethods array', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
        includeContractMethods: ['swapExactAmountOut'],
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('includeContractMethods')).toBe('swapExactAmountOut')
    })

    it('joins multiple includeContractMethods with comma', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
        includeContractMethods: ['swapExactAmountOut', 'swapExactAmountOutOnUniswapV3'],
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('includeContractMethods')).toBe(
        'swapExactAmountOut,swapExactAmountOutOnUniswapV3',
      )
    })

    it('calculates minOut from slippage correctly', async () => {
      const response = createSuccessResponse({ destAmount: '1000000000000000000' })
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 100, // 1%
      })

      const quote = await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      // minOut = 1000000000000000000 * (1 - 0.01) = 990000000000000000
      expect(quote.minOut).toBe(990000000000000000n)
    })

    it('sets receiver=toAddress in URL params', async () => {
      const response = createSuccessResponse()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      global.fetch = fetchMock

      const adapter = createVeloraQuoteAdapter({
        chainId: base.id,
        router: ROUTER,
        slippageBps: 50,
      })

      await adapter({
        inToken: WETH,
        outToken: WEETH,
        amountIn: 1000000000000000000n,
        intent: 'exactIn',
      })

      const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
      expect(url.searchParams.get('receiver')?.toLowerCase()).toBe(ROUTER.toLowerCase())
    })
  })
})
