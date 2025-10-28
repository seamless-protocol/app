import type { Address, Hex } from 'viem'
import { getAddress } from 'viem'
import { base } from 'viem/chains'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import { getTokenDecimals } from '@/features/leverage-tokens/leverageTokens.config'
import { DEFAULT_SLIPPAGE_BPS, bpsToDecimalString } from './constants'
import type { QuoteFn } from './types'

export interface VeloraAdapterOptions {
  chainId?: number
  router: Address
  /** Optional override for quote `fromAddress` (defaults to `router`). */
  fromAddress?: Address
  slippageBps?: number
  baseUrl?: string
}

// Velora API response types - only fields we actually use
type VeloraSwapResponse = {
  priceRoute: {
    srcAmount: string
    destAmount: string
    contractAddress: string
    contractMethod: string
  }
  txParams: {
    data: string
  }
}

/**
 * Create a QuoteFn adapter backed by Velora's Market API.
 * Returns swap data and metadata needed for the redeemWithVelora contract function.
 */
export function createVeloraQuoteAdapter(opts: VeloraAdapterOptions): QuoteFn {
  const {
    chainId = base.id,
    router,
    fromAddress,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    baseUrl = 'https://api.velora.xyz',
  } = opts

  const slippage = bpsToDecimalString(slippageBps)

  return async ({ inToken, outToken, amountIn, amountOut, intent }) => {
    const url = buildQuoteUrl(baseUrl, {
      chainId,
      inToken,
      outToken,
      amountIn,
      ...(typeof amountOut === 'bigint' ? { amountOut } : {}),
      ...(intent ? { intent } : {}),
      router,
      fromAddress: (fromAddress ?? router) as Address,
      toAddress: router as Address,
      slippage,
    })

    const res = await fetch(url.toString(), { method: 'GET' })
    if (!res.ok) throw new Error(`Velora quote failed: ${res.status} ${res.statusText}`)

    const responseData = await res.json()

    // Check for Velora API errors in the response body
    if (responseData.error) {
      const errorMessage = responseData.error
      console.error('Velora error from API', { errorMessage })
      throw new Error(`Velora quote failed: ${errorMessage}`)
    }

    const response = responseData as VeloraSwapResponse

    const wantsNativeIn = inToken.toLowerCase() === ETH_SENTINEL.toLowerCase()
    return mapVeloraResponseToQuote(response, wantsNativeIn, slippage)
  }
}

// Internal helpers
function buildQuoteUrl(
  baseUrl: string,
  params: {
    chainId: number
    inToken: Address
    outToken: Address
    amountIn: bigint
    amountOut?: bigint
    intent?: 'exactIn' | 'exactOut'
    router: Address
    fromAddress: Address
    toAddress: Address
    slippage: string
  },
): URL {
  const url = new URL('/swap', baseUrl)
  const normalizeToken = (token: Address) =>
    token.toLowerCase() === ETH_SENTINEL.toLowerCase()
      ? '0x0000000000000000000000000000000000000000'
      : getAddress(token)

  const network = String(params.chainId)

  url.searchParams.set('srcToken', normalizeToken(params.inToken))
  url.searchParams.set('destToken', normalizeToken(params.outToken))
  url.searchParams.set('network', network)
  url.searchParams.set('userAddress', getAddress(params.fromAddress))
  url.searchParams.set('receiver', getAddress(params.toAddress))
  url.searchParams.set('version', '6.2')

  // Add required decimals parameters using centralized token decimals lookup
  const srcDecimals = getTokenDecimals(params.inToken)
  const destDecimals = getTokenDecimals(params.outToken)
  url.searchParams.set('srcDecimals', String(srcDecimals))
  url.searchParams.set('destDecimals', String(destDecimals))

  // Convert slippage from decimal string to basis points
  const slippageBps = Math.round(parseFloat(params.slippage) * 10000)
  url.searchParams.set('slippage', String(slippageBps))

  if (params.intent === 'exactOut') {
    if (typeof params.amountOut !== 'bigint') {
      throw new Error('Velora exact-out quote requires amountOut')
    }
    url.searchParams.set('side', 'BUY')
    url.searchParams.set('amount', params.amountOut.toString())
  } else {
    url.searchParams.set('side', 'SELL')
    url.searchParams.set('amount', params.amountIn.toString())
  }

  return url
}

function mapVeloraResponseToQuote(
  response: VeloraSwapResponse,
  wantsNativeIn: boolean,
  slippage: string,
) {
  const { priceRoute, txParams } = response

  // Extract approval target from contract address
  const approvalTarget = priceRoute.contractAddress as Address
  if (!approvalTarget) throw new Error('Velora quote missing contract address')

  // Extract swap data from transaction params
  const swapData = txParams.data as Hex
  if (!swapData) throw new Error('Velora quote missing transaction data')

  // Extract amounts from price route (expected amounts)
  const expectedOut = BigInt(priceRoute.destAmount)
  const maxIn = BigInt(priceRoute.srcAmount)

  // Calculate slippage-adjusted minimum amount
  // TODO: ASK MARCO TO VALIDATE THIS
  const slippageBps = Math.round(parseFloat(slippage) * 10000)
  const slippageMultiplier = (10000 - slippageBps) / 10000
  const minOut = BigInt(Math.floor(Number(expectedOut) * slippageMultiplier))

  // Velora API already handles slippage internally in the transaction calldata
  // We use the API's expected amount for UI display and debt repayment
  // The transaction calldata already contains slippage protection
  const out = expectedOut

  return {
    out,
    minOut,
    maxIn,
    approvalTarget: getAddress(approvalTarget),
    calldata: swapData,
    wantsNativeIn,
    // Store Velora-specific data for redeemWithVelora function
    veloraData: {
      augustus: approvalTarget, // Use the contract address from the API response
      offsets: {
        exactAmount: 132n, // Byte position for output amount in calldata
        limitAmount: 100n, // Byte position for max input amount in calldata
        quotedAmount: 164n, // Byte position for quoted input amount in calldata
      },
    },
  }
}

// Extended Quote type for Velora-specific data
export interface VeloraQuote {
  out: bigint
  minOut?: bigint
  maxIn?: bigint
  wantsNativeIn?: boolean
  approvalTarget: Address
  calldata: Hex
  veloraData: {
    augustus: Address
    offsets: {
      exactAmount: bigint // Byte position for output amount in calldata
      limitAmount: bigint // Byte position for max input amount in calldata
      quotedAmount: bigint // Byte position for quoted input amount in calldata
    }
  }
}
