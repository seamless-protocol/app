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
    const allowanceTarget = getAddress(quote.source.allowanceTarget)

    return {
      out: quote.buyAmount.amount,
      minOut: quote.minBuyAmount.amount,
      maxIn: quote.maxSellAmount.amount,
      approvalTarget: allowanceTarget,
      calls: [
        {
          target: (tx?.to as Address) ?? allowanceTarget,
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

export async function fetchBalmyTokenUsdPrices(
  balmySDK: ReturnType<typeof buildSDK>,
  chainId: number,
  addresses: Array<string>,
): Promise<Record<string, number>> {
  const uniqueAddresses = Array.from(new Set(addresses.map((a) => a.toLowerCase())))
  if (uniqueAddresses.length === 0) return {}

  const rawBalmyPrices = await balmySDK.priceService.getCurrentPrices({
    tokens: uniqueAddresses.map((a) => ({ chainId, token: a as Address })),
  })

  const pricesForChain = (
    rawBalmyPrices as Record<string, Record<string, { price: number; closestTimestamp: number }>>
  )[String(chainId)]
  if (!pricesForChain) return {}

  return Object.fromEntries(
    Object.entries(pricesForChain).map(([addr, entry]) => [addr, entry.price]),
  )
}

export async function fetchBalmyTokenUsdPricesRange(
  balmySDK: ReturnType<typeof buildSDK>,
  chainId: number,
  address: string,
  fromSec: number,
): Promise<Array<[number, number]>> {
  const rawBalmyPrices = await balmySDK.priceService.getChart({
    tokens: [{ chainId, token: address as Address }],
    span: 100,
    period: '6h',
    bound: { from: fromSec },
  })

  const prices = rawBalmyPrices[chainId]?.[address]
  if (!prices) return []

  return prices.map((p) => [p.closestTimestamp, p.price])
}
