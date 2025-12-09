import type { buildSDK } from '@seamless-defi/defi-sdk'
import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { createBalmyQuoteAdapter } from '@/domain/shared/adapters/balmy'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'

const ROUTER = '0x9999999999999999999999999999999999999999' as Address
const CALLER = '0x7777777777777777777777777777777777777777' as Address
const IN_TOKEN = '0x1111111111111111111111111111111111111111' as Address
const OUT_TOKEN = '0x2222222222222222222222222222222222222222' as Address
const SOURCE_ID = 'balmy-source'

type MockedBalmySDK = ReturnType<typeof buildSDK>

function createMockBalmySDK() {
  const mockQuote = {
    source: {
      id: SOURCE_ID,
      name: 'Mock Source',
      allowanceTarget: '0xABCDEFabcdefABCDefabcDEFabcdefABCDEFABCD',
    },
    buyAmount: { amount: 200n },
    minBuyAmount: { amount: 180n },
    maxSellAmount: { amount: 220n },
  }

  const txResponse = { data: '0xdeadbeef' }

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
      slippageBps: 75,
    })

    await adapter({
      inToken: IN_TOKEN,
      outToken: OUT_TOKEN,
      amountIn: 123n,
      intent: 'exactIn',
    })

    expect(getBestQuote).toHaveBeenCalledTimes(1)
    expect(getBestQuote).toHaveBeenCalledWith({
      request: expect.objectContaining({
        chainId: 8453,
        sellToken: IN_TOKEN,
        buyToken: OUT_TOKEN,
        order: { type: 'sell', sellAmount: 123n },
        slippagePercentage: 0.75,
        takerAddress: CALLER,
        recipient: ROUTER,
        filters: { excludeSources: ['balmy', 'sushiswap', 'fly-trade'] },
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
      slippageBps: 100,
    })

    const quote = await adapter({
      inToken: ETH_SENTINEL,
      outToken: OUT_TOKEN,
      amountOut: 500n,
      intent: 'exactOut',
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
    expect(quote.approvalTarget.toLowerCase()).toBe(
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'.toLowerCase(),
    )
    expect(quote.calldata).toBe(txResponse.data)
    expect(quote.wantsNativeIn).toBe(true)
    expect(quote.sourceId).toBe(SOURCE_ID)
    expect(quote.sourceName).toBe('Mock Source')
  })
})
