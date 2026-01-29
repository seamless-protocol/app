import type { QuoteRequest as BalmyQuoteRequest, buildSDK } from '@seamless-defi/defi-sdk'
import { type Address, getAddress, isAddressEqual } from 'viem'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import { bpsToDecimalString, validateSlippage } from './helpers'
import type { QuoteFn, QuoteRequest } from './types'

export interface BalmyAdapterOptions {
  balmySDK: ReturnType<typeof buildSDK>
  chainId: number
  fromAddress: Address
  toAddress: Address
  excludeAdditionalSources?: Array<string> | undefined
}

export function createBalmyQuoteAdapter(opts: BalmyAdapterOptions): QuoteFn {
  return async ({ inToken, outToken, amountIn, amountOut, intent, slippageBps }: QuoteRequest) => {
    validateSlippage(slippageBps)
    const slippagePercentage = parseFloat(bpsToDecimalString(slippageBps)) * 100

    if (intent === 'exactOut') {
      if (!amountOut) {
        throw new Error('Exact-out quote requires amountOut > 0')
      }
    } else {
      if (!amountIn) {
        throw new Error('Exact-in quote requires amountIn > 0')
      }
    }

    const excludeSources = [
      'sushiswap',
      'fly-trade',
      'swing',
      'xy-finance',
      ...(opts.excludeAdditionalSources ?? []),
    ]

    const request: BalmyQuoteRequest = {
      chainId: opts.chainId,
      sellToken: inToken,
      buyToken: outToken,
      order: {
        ...(intent === 'exactOut'
          ? { type: 'buy', buyAmount: amountOut }
          : { type: 'sell', sellAmount: amountIn }),
      },
      slippagePercentage,
      takerAddress: opts.fromAddress,
      recipient: opts.toAddress,
      filters: { excludeSources },
      sourceConfig: { global: { disableValidation: true } },
    }

    if (import.meta.env['VITE_BALMY_DEBUG'] === 'true') {
      console.info('[Balmy] quote request', {
        ...request,
      })
    }

    const quote = await opts.balmySDK.quoteService.getBestQuote({
      request,
      config: { choose: { by: 'most-swapped', using: 'max sell/min buy amounts' } },
    })

    if (import.meta.env['VITE_BALMY_DEBUG'] === 'true') {
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
    const sourceId = quote.source.id
    const sourceName = quote.source.name ?? quote.source.id

    return {
      out: quote.buyAmount.amount,
      minOut: quote.minBuyAmount.amount,
      maxIn: quote.maxSellAmount.amount,
      approvalTarget: getAddress(quote.source.allowanceTarget),
      calls: [
        {
          target: (tx?.to as Address) ?? getAddress(quote.source.allowanceTarget),
          data: tx?.data as `0x${string}`,
          value: tx?.value ?? 0n,
        },
      ],
      wantsNativeIn,
      quoteSourceId: sourceId,
      quoteSourceName: sourceName,
    }
  }
}
