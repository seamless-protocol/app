import type { Address, Hex } from 'viem'
import { getAddress, isAddressEqual } from 'viem'
import { z } from 'zod'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
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
        value: z
          .string()
          .transform((val) => BigInt(val))
          .optional(),
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
      }),
    }),
  ),
})

const pendleResponseSchema = z.union([pendleSuccessResponseSchema])

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
    baseUrl = 'https://api-v2.pendle.finance',
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
      enableAggregator: true,
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

    return mapPendleResponseToQuote(response, outToken, inToken)
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
  const url = new URL(`/core/v2/sdk/${params.chainId}/convert`, baseUrl)

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

function mapPendleResponseToQuote(
  response: PendleSwapResponse,
  outToken: Address,
  inToken: Address,
) {
  if (response.routes.length === 0) throw new Error('Pendle quote returned no routes')
  const route = response.routes[0]
  if (!route) throw new Error('Pendle quote returned no route')

  // Find the output token that matches the outToken (from the call context)
  // route.tokensOut is an array of { token: Address, amount: string }
  const outTokenInfo = route.outputs.find((t) => isAddressEqual(t.token, outToken))
  if (!outTokenInfo) throw new Error('Pendle quote missing output token')
  const outAmount = BigInt(outTokenInfo.amount)

  const inTokenInfo = response.inputs.find((t) => isAddressEqual(t.token, inToken))
  if (!inTokenInfo) throw new Error('Pendle quote missing input token')
  const inAmount = BigInt(inTokenInfo.amount)

  return {
    out: outAmount,
    minOut: 0n, // Not used
    maxIn: inAmount,
    approvalTarget: route.tx.to,
    calldata: route.tx.data,
    wantsNativeIn: isAddressEqual(inToken, ETH_SENTINEL),
  }
}
