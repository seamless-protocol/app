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
      'open-ocean',
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

export async function fetchBalmyTokenUsdPricesHistory(
  balmySDK: ReturnType<typeof buildSDK>,
  chainId: number,
  addresses: Array<string>,
  fromSec: number,
): Promise<Record<string, Array<[number, number]>>> {
  const nowSec = Math.floor(Date.now() / 1000)
  // If 30 days or less, use a span of 120 and 6h periods, otherwise use a span of number of days and 1d period
  const numberOfDays = (nowSec - fromSec) / (24 * 60 * 60)
  const rawBalmyPrices = await balmySDK.priceService.getChart({
    tokens: addresses.map((a) => ({ chainId, token: a as Address })),
    span: numberOfDays <= 30 ? 120 : numberOfDays,
    period: numberOfDays <= 30 ? '6h' : '1d',
    bound: { from: fromSec },
  })

  const pricesByChain = rawBalmyPrices[chainId]
  if (!pricesByChain) return {}

  return Object.fromEntries(
    Object.entries(pricesByChain).map(([address, prices]) => [
      address.toLowerCase(),
      prices.map((p) => [p.closestTimestamp, p.price]),
    ]),
  )
}
