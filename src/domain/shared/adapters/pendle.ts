import type { Address, Hex } from 'viem'
import { getAddress } from 'viem'
import { z } from 'zod'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { bpsToDecimalString, DEFAULT_SLIPPAGE_BPS } from './constants'
import type { QuoteFn } from './types'

export interface PendleAdapterOptions {
  chainId: SupportedChainId
  router: Address
  /** Optional override for quote `fromAddress` (defaults to `router`). */
  fromAddress?: Address
  slippageBps?: number
  baseUrl?: string
  /** Optional list of ParaSwap contract methods to restrict quotes to. Useful for testing specific methods. */
  includeContractMethods?: Array<string>
}

// Pendle API response validation schemas
const pendleSuccessResponseSchema = z.object({
  action: z.string(),
  inputs: z.array(
    z.object({
      token: z.string().transform((val) => getAddress(val)),
      amount: z.string().transform((val) => BigInt(val)),
    }),
  ),
  requiredApprovals: z.array(
    z.object({
      token: z.string().transform((val) => getAddress(val)),
      amount: z.string().transform((val) => BigInt(val)),
    }),
  ),
  routes: z.array(
    z.object({
      contractParamInfo: z.object({
        method: z.string(),
        contractCallParamsName: z.array(z.string()),
        contractCallParams: z.array(z.unknown().nullable()),
      }),
      tx: z.object({
        data: z
          .string()
          .refine((val) => val.startsWith('0x') && /^[a-fA-F0-9]*$/.test(val.slice(2)), {
            message: 'data must be a valid hex string',
          })
          .transform((val) => val as Hex),
        to: z.string().transform((val) => getAddress(val)),
        from: z.string().transform((val) => getAddress(val)),
        value: z.string().transform((val) => BigInt(val)),
      }),
      outputs: z.array(
        z.object({
          token: z.string().transform((val) => getAddress(val)),
          amount: z.string().transform((val) => BigInt(val)),
        }),
      ),
      data: z.object({
        aggregatorType: z.string(),
        priceImpact: z.number(),
        impliedApy: z.object({
          before: z.number(),
          after: z.number(),
        }),
        effectiveApy: z.number(),
        paramsBreakdown: z.object({
          selfCall1: z.object({
            method: z.string(),
            contractCallParamsName: z.array(z.string()),
            contractCallParams: z.array(z.unknown().nullable()),
          }),
          selfCall2: z.object({
            method: z.string(),
            contractCallParamsName: z.array(z.string()),
            contractCallParams: z.array(z.unknown().nullable()),
          }),
          reflectCall: z.object({
            method: z.string(),
            contractCallParamsName: z.array(z.string()),
            contractCallParams: z.array(z.unknown().nullable()),
          }),
        }),
      }),
    }),
  ),
})

const pendleErrorResponseSchema = z.object({
  error: z.string(),
})

const pendleResponseSchema = z.union([pendleSuccessResponseSchema, pendleErrorResponseSchema])

// Velora API response types - only fields we actually use
type PendleSwapResponse = z.infer<typeof pendleSuccessResponseSchema>

/**
 * Create a QuoteFn adapter backed by Velora's Market API.
 * Returns swap data and metadata needed for the redeemWithVelora contract function.
 * For exactOut quotes, veloraData is always present and can be accessed via type narrowing.
 */
export function createPendleQuoteAdapter(opts: PendleAdapterOptions): QuoteFn {
  const {
    chainId,
    router,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    baseUrl = 'https://api-v2.pendle.finance/core',
  } = opts

  const slippage = bpsToDecimalString(slippageBps)

  return async ({ inToken, outToken, amountIn, intent }) => {
    if (intent === 'exactOut') {
      throw new Error('Pendle adapter only supports exactIn quotes')
    }

    const url = buildQuoteUrl(baseUrl, {
      chainId,
      receiver: router as Address,
      slippage,
      enableAggregator: false,
      tokensIn: inToken,
      amountsIn: amountIn ?? 0n,
      tokensOut: outToken,
      redeemRewards: false,
      needScale: false,
    })

    const res = await fetch(url.toString(), { method: 'GET' })
    if (!res.ok) throw new Error(`Pendle quote failed: ${res.status} ${res.statusText}`)

    const response = pendleResponseSchema.parse(await res.json())

    // Check for Pendle API errors in the response body
    if ('error' in response) {
      console.error('Pendle error from API', { errorMessage: response.error })
      throw new Error(`Pendle quote failed: ${response.error}`)
    }

    return mapPendleResponseToQuote(response, slippage)
  }
}

// Internal helpers
function buildQuoteUrl(
  baseUrl: string,
  params: {
    chainId: number
    receiver: Address
    slippage: string
    enableAggregator?: boolean
    tokensIn: Address
    amountsIn: bigint
    tokensOut: Address
    redeemRewards?: boolean
    needScale?: boolean
  },
): URL {
  const url = new URL(`/v2/sdk/${params.chainId}/convert`, baseUrl)

  url.searchParams.set('receiver', params.receiver)
  url.searchParams.set('slippage', params.slippage)
  url.searchParams.set('enableAggregator', params.enableAggregator ? 'true' : 'false')
  url.searchParams.set('tokensIn', params.tokensIn)
  url.searchParams.set('amountsIn', params.amountsIn.toString())
  url.searchParams.set('tokensOut', params.tokensOut)
  url.searchParams.set('redeemRewards', params.redeemRewards ? 'true' : 'false')
  url.searchParams.set('needScale', params.needScale ? 'true' : 'false')

  return url
}

function mapPendleResponseToQuote(response: PendleSwapResponse, slippage: string) {
  return {
    out,
  }
}
