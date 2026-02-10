import type { buildSDK } from '@seamless-defi/defi-sdk'
import { type Address, getAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { createBalmyQuoteAdapter } from '@/domain/shared/adapters/balmy'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'

const ROUTER = '0x9999999999999999999999999999999999999999' as Address
const CALLER = '0x7777777777777777777777777777777777777777' as Address
const IN_TOKEN = '0x1111111111111111111111111111111111111111' as Address
const OUT_TOKEN = '0x2222222222222222222222222222222222222222' as Address
const SOURCE_ID = 'balmy-source'

type MockedBalmySDK = ReturnType<typeof buildSDK>

function createMockBalmySDK(overrides?: { mockQuote?: any; txResponse?: any }) {
  const mockQuote = overrides?.mockQuote ?? {
    source: {
      id: SOURCE_ID,
      name: 'Mock Source',
      allowanceTarget: getAddress('0xABCDEFabcdefABCDefabcDEFabcdefABCDEFABCD'),
    },
    buyAmount: { amount: 200n },
    minBuyAmount: { amount: 180n },
    maxSellAmount: { amount: 220n },
  }

  const txResponse = overrides?.txResponse ?? { data: '0xdeadbeef' }

  const getBestQuote = vi.fn().mockResolvedValue(mockQuote)
  const buildTxs = vi.fn().mockReturnValue({
    [SOURCE_ID]: Promise.resolve(txResponse),
  })

  const balmySDK = {
    quoteService: {
      getBestQuote,
      buildTxs,
    },
  } as unknown as MockedBalmySDK

  return {
    balmySDK,
    getBestQuote,
    buildTxs,
    mockQuote,
    txResponse,
  }
}

describe('createBalmyQuoteAdapter', () => {
  it('builds sell quotes for exact-in intents with expected request payload', async () => {
    const { balmySDK, getBestQuote } = createMockBalmySDK()

    const adapter = createBalmyQuoteAdapter({
      balmySDK,
      chainId: 8453,
      fromAddress: CALLER,
      toAddress: ROUTER,
    })

    await adapter({
      inToken: IN_TOKEN,
      outToken: OUT_TOKEN,
      amountIn: 123n,
      intent: 'exactIn',
      slippageBps: 50,
    })

    expect(getBestQuote).toHaveBeenCalledTimes(1)
    expect(getBestQuote).toHaveBeenCalledWith({
      request: expect.objectContaining({
        chainId: 8453,
        sellToken: IN_TOKEN,
        buyToken: OUT_TOKEN,
        order: { type: 'sell', sellAmount: 123n },
        slippagePercentage: 0.5,
        takerAddress: CALLER,
        recipient: ROUTER,
        filters: {
          excludeSources: ['sushiswap', 'fly-trade', 'swing', 'xy-finance', 'open-ocean'],
        },
        sourceConfig: { global: { disableValidation: true } },
      }),
      config: {
        choose: { by: 'most-swapped', using: 'max sell/min buy amounts' },
      },
    })
  })

  it('builds buy quotes for exact-out intents and maps response to QuoteFn result', async () => {
    const { balmySDK, getBestQuote, buildTxs, mockQuote, txResponse } = createMockBalmySDK()

    const adapter = createBalmyQuoteAdapter({
      balmySDK,
      chainId: 8453,
      fromAddress: CALLER,
      toAddress: ROUTER,
    })

    const quote = await adapter({
      inToken: ETH_SENTINEL,
      outToken: OUT_TOKEN,
      amountOut: 500n,
      intent: 'exactOut',
      slippageBps: 100,
    })

    expect(getBestQuote).toHaveBeenCalledWith({
      request: expect.objectContaining({
        order: { type: 'buy', buyAmount: 500n },
        sellToken: ETH_SENTINEL,
        recipient: ROUTER,
        slippagePercentage: 1,
      }),
      config: {
        choose: { by: 'most-swapped', using: 'max sell/min buy amounts' },
      },
    })
    expect(buildTxs).toHaveBeenCalledWith({
      quotes: { [SOURCE_ID]: mockQuote },
      sourceConfig: { global: { disableValidation: true } },
    })
    expect(quote.out).toBe(mockQuote.buyAmount.amount)
    expect(quote.minOut).toBe(mockQuote.minBuyAmount.amount)
    expect(quote.maxIn).toBe(mockQuote.maxSellAmount.amount)
    expect(quote.approvalTarget).toBe(mockQuote.source.allowanceTarget)
    expect(quote.calls[0]?.data).toBe(txResponse.data)
    expect(quote.calls[0]?.target).toBe(mockQuote.source.allowanceTarget)
    expect(quote.wantsNativeIn).toBe(true)
    expect(quote.quoteSourceId).toBe(SOURCE_ID)
    expect(quote.quoteSourceName).toBe('Mock Source')
  })

  it('builds quotes with custom tx data', async () => {
    const mockQuote = {
      source: {
        id: SOURCE_ID,
        name: 'Mock Source',
        allowanceTarget: getAddress('0xABCDEFabcdefABCDefabcDEFabcdefABCDEFABCD'),
      },
      buyAmount: { amount: 200n },
      minBuyAmount: { amount: 180n },
      maxSellAmount: { amount: 220n },
      customData: {
        tx: {
          to: getAddress('0x9999999999999999999999999999999999999999'),
          value: 123n,
        },
      },
    }

    const { balmySDK, txResponse } = createMockBalmySDK({
      mockQuote,
      txResponse: {
        data: '0xdeadbeef',
        to: mockQuote.customData.tx.to,
        value: mockQuote.customData.tx.value,
      },
    })

    const adapter = createBalmyQuoteAdapter({
      balmySDK,
      chainId: 8453,
      fromAddress: CALLER,
      toAddress: ROUTER,
    })

    const quote = await adapter({
      inToken: ETH_SENTINEL,
      outToken: OUT_TOKEN,
      amountOut: 500n,
      intent: 'exactOut',
      slippageBps: 100,
    })

    expect(quote.calls[0]?.target).toBe(mockQuote.customData.tx.to)
    expect(quote.calls[0]?.value).toBe(mockQuote.customData.tx.value)

    expect(quote.out).toBe(mockQuote.buyAmount.amount)
    expect(quote.minOut).toBe(mockQuote.minBuyAmount.amount)
    expect(quote.maxIn).toBe(mockQuote.maxSellAmount.amount)
    expect(quote.approvalTarget).toBe(mockQuote.source.allowanceTarget)
    expect(quote.calls[0]?.data).toBe(txResponse.data)
    expect(quote.wantsNativeIn).toBe(true)
    expect(quote.quoteSourceId).toBe(SOURCE_ID)
    expect(quote.quoteSourceName).toBe('Mock Source')
  })

  it('falls back to source id when name missing and keeps wantsNativeIn false for ERC20 sells', async () => {
    const { balmySDK, getBestQuote, mockQuote, txResponse } = createMockBalmySDK()

    const namelessQuote = {
      source: {
        id: SOURCE_ID,
        name: undefined,
        allowanceTarget: mockQuote.source.allowanceTarget,
      },
      buyAmount: { amount: 300n },
      minBuyAmount: { amount: 250n },
      maxSellAmount: { amount: 350n },
    }
    getBestQuote.mockResolvedValueOnce(namelessQuote as any)

    const adapter = createBalmyQuoteAdapter({
      balmySDK,
      chainId: 8453,
      fromAddress: CALLER,
      toAddress: ROUTER,
    })

    const quote = await adapter({
      inToken: IN_TOKEN,
      outToken: OUT_TOKEN,
      amountIn: 999n,
      intent: 'exactIn',
      slippageBps: 50,
    })

    expect(quote.wantsNativeIn).toBe(false)
    expect(quote.quoteSourceId).toBe(SOURCE_ID)
    expect(quote.quoteSourceName).toBe(SOURCE_ID)
    expect(quote.approvalTarget).toBe(mockQuote.source.allowanceTarget)
    expect(quote.calls[0]?.data).toBe(txResponse.data)
    expect(quote.calls[0]?.target).toBe(mockQuote.source.allowanceTarget)
    expect(quote.out).toBe(300n)
    expect(quote.minOut).toBe(250n)
    expect(quote.maxIn).toBe(350n)
  })

  it('excludes additional sources', async () => {
    const { balmySDK, getBestQuote } = createMockBalmySDK()

    const adapter = createBalmyQuoteAdapter({
      balmySDK,
      chainId: 8453,
      fromAddress: CALLER,
      toAddress: ROUTER,
      excludeAdditionalSources: ['test-source'],
    })

    await adapter({
      inToken: IN_TOKEN,
      outToken: OUT_TOKEN,
      amountIn: 123n,
      intent: 'exactIn',
      slippageBps: 50,
    })

    expect(getBestQuote).toHaveBeenCalledTimes(1)
    expect(getBestQuote).toHaveBeenCalledWith({
      request: expect.objectContaining({
        chainId: 8453,
        sellToken: IN_TOKEN,
        buyToken: OUT_TOKEN,
        order: { type: 'sell', sellAmount: 123n },
        slippagePercentage: 0.5,
        takerAddress: CALLER,
        recipient: ROUTER,
        filters: {
          excludeSources: [
            'sushiswap',
            'fly-trade',
            'swing',
            'xy-finance',
            'open-ocean',
            'test-source',
          ],
        },
        sourceConfig: { global: { disableValidation: true } },
      }),
      config: {
        choose: { by: 'most-swapped', using: 'max sell/min buy amounts' },
      },
    })
  })

  it('throws when amountOut is 0 for exact-out', async () => {
    await expect(
      createBalmyQuoteAdapter({
        balmySDK: createMockBalmySDK().balmySDK,
        chainId: 8453,
        fromAddress: CALLER,
        toAddress: ROUTER,
      })({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountOut: 0n,
        intent: 'exactOut',
        slippageBps: 50,
      }),
    ).rejects.toThrow('Exact-out quote requires amountOut > 0')
  })

  it('throws when amountIn is 0 for exact-in', async () => {
    await expect(
      createBalmyQuoteAdapter({
        balmySDK: createMockBalmySDK().balmySDK,
        chainId: 8453,
        fromAddress: CALLER,
        toAddress: ROUTER,
      })({
        inToken: IN_TOKEN,
        outToken: OUT_TOKEN,
        amountIn: 0n,
        intent: 'exactIn',
        slippageBps: 50,
      }),
    ).rejects.toThrow('Exact-in quote requires amountIn > 0')
  })
})
