import type { buildSDK, QuoteRequest } from '@seamless-defi/defi-sdk'
import { type Address, getAddress, isAddressEqual } from 'viem'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import type { QuoteFn } from './types'

export interface BalmyAdapterOptions {
  balmySDK: ReturnType<typeof buildSDK>
  chainId: number
  fromAddress: Address
  toAddress: Address
  slippageBps: number
}

export function createBalmyQuoteAdapter(opts: BalmyAdapterOptions): QuoteFn {
  return async (args) => {
    const { inToken, outToken, amountIn, amountOut, intent } = args

    const request: QuoteRequest = {
      chainId: opts.chainId,
      sellToken: inToken,
      buyToken: outToken,
      order: {
        ...(intent === 'exactOut'
          ? { type: 'buy', buyAmount: amountOut ?? 0n }
          : { type: 'sell', sellAmount: amountIn }),
      },
      slippagePercentage: opts.slippageBps / 100,
      takerAddress: opts.fromAddress,
      recipient: opts.toAddress,
      filters: {
        excludeSources: ['balmy', 'sushiswap', 'fly-trade'],
      },
      sourceConfig: { global: { disableValidation: true } },
    }

    if (import.meta.env['VITE_BALMY_DEBUG'] === '1') {
      console.info('[Balmy] quote request', {
        ...request,
      })
    }

    const quote = await opts.balmySDK.quoteService.getBestQuote({
      request,
      config: { choose: { by: 'most-swapped', using: 'max sell/min buy amounts' } },
    })

    if (import.meta.env['VITE_BALMY_DEBUG'] === '1') {
      console.info('[Balmy] quote response', {
        quote,
      })
    }

    const txs = opts.balmySDK.quoteService.buildTxs({
      quotes: {
        [quote.source.id]: quote,
      },
      sourceConfig: { global: { disableValidation: true } },
    })

    const tx = await txs[quote.source.id]

    const wantsNativeIn = isAddressEqual(request.sellToken as Address, ETH_SENTINEL)

    return {
      out: quote.buyAmount.amount,
      minOut: quote.minBuyAmount.amount,
      maxIn: quote.maxSellAmount.amount,
      approvalTarget: getAddress(quote.source.allowanceTarget),
      calldata: tx?.data as `0x${string}`,
      wantsNativeIn,
    }
  }
}
