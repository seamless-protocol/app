import type { Address } from 'viem'
import { getAddress, isAddressEqual } from 'viem'
import { base } from 'viem/chains'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import { bpsToDecimalString, validateSlippage } from './helpers'
import type { QuoteFn } from './types'

export type LifiOrder = 'CHEAPEST' | 'FASTEST'

export interface LifiAdapterOptions {
  chainId?: number
  router: Address
  /** Optional override for quote `fromAddress` (defaults to `router`). */
  fromAddress?: Address
  baseUrl?: string
  apiKey?: string
  order?: LifiOrder
  /** Optional integrator slug; if omitted, no `integrator` param is sent */
  integrator?: string
  /** Optional bridge allowlist (e.g., 'none') */
  allowBridges?: string
}

type StepEstimate = {
  toAmount?: string
  toAmountMin?: string
  approvalAddress?: string
  fromAmount?: string
}

type TransactionRequest = {
  to?: string
  data?: `0x${string}`
}

type Step = {
  estimate?: StepEstimate
  toolDetails?: { approvalAddress?: string }
  transactionRequest?: TransactionRequest
}

/**
 * Create a QuoteFn adapter backed by LiFi's /v1/quote.
 * - Quotes are same-chain (Base -> Base) by default.
 * - Uses router as fromAddress since router executes the swap inside router calls.
 */

function readEnv(name: string): string | undefined {
  // Prefer Vite/Vitest env when available (browser/E2E/dev server)
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env
    if (env && Object.hasOwn(env, name)) {
      const v = env[name]
      return typeof v === 'string' ? v : v != null ? String(v) : undefined
    }
    // If import.meta.env exists but key is missing, treat as undefined
    if (env) return undefined
  }
  // Node/test fallback without referencing a non-existent global in browsers
  if (typeof import.meta === 'undefined' && typeof process !== 'undefined' && process.env) {
    return process.env[name]
  }
  return undefined
}
export function createLifiQuoteAdapter(opts: LifiAdapterOptions): QuoteFn {
  const {
    chainId = base.id,
    router,
    fromAddress,
    // Always use li.quest as documented by LiFi for /v1/quote
    baseUrl = opts.baseUrl ?? 'https://partner-seashell.li.quest',
    // Read from Vite env in browser; avoid referencing process.env in client bundles
    apiKey = opts.apiKey ?? readEnv('VITE_LIFI_API_KEY') ?? readEnv('LIFI_API_KEY'),
    order = 'CHEAPEST',
    // Support browser env only; tests can pass via opts
    integrator = opts.integrator ?? readEnv('VITE_LIFI_INTEGRATOR') ?? readEnv('LIFI_INTEGRATOR'),
    allowBridges,
  } = opts

  const headers = buildHeaders(apiKey)

  return async ({ inToken, outToken, amountIn, amountOut, intent, slippageBps }) => {
    validateSlippage(slippageBps)
    const slippage = bpsToDecimalString(slippageBps)

    const url = buildQuoteUrl(baseUrl, {
      chainId,
      inToken,
      outToken,
      ...(typeof amountIn === 'bigint' ? { amountIn } : {}),
      ...(typeof amountOut === 'bigint' ? { amountOut } : {}),
      ...(intent ? { intent } : {}),
      router,
      // The on-chain swap is executed inside the router flow. When a MulticallExecutor
      // is used, it may be the effective token holder and caller for the swap.
      // Allow overriding `fromAddress` to match the executor when needed; otherwise
      // default to the router address.
      fromAddress: (fromAddress ?? router) as Address,
      // Ensure aggregator sends output to the router so the repay leg has funds
      toAddress: router as Address,
      // For exact output quotes we set slippage to 0, since lifi will quote the output amount + slippage
      slippage: intent === 'exactOut' ? '0' : slippage,
      ...(integrator ? { integrator } : {}),
      order,
      ...(allowBridges ? { allowBridges } : {}),
    })

    if ((readEnv('VITE_LIFI_DEBUG') ?? readEnv('LIFI_DEBUG')) === '1') {
      // Intentionally avoid logging the API key value
      console.info('[LiFi] quote', {
        baseUrl,
        hasApiKey: Boolean(apiKey),
        url: url.toString(),
        intent: intent ?? 'exactIn',
      })
    }
    const res = await fetch(url.toString(), { method: 'GET', headers })
    if (!res.ok) throw new Error(`LiFi quote failed: ${res.status} ${res.statusText}`)

    const responseData = await res.json()

    // Check for LiFi API errors in the response body
    if (responseData.message && responseData.code) {
      const errorMessage = responseData.message
      const errorCode = responseData.code
      console.error('LiFi error from API', { errorMessage, errorCode })
      throw new Error(
        `LiFi quote failed ${errorCode}: Try adjusting slippage tolerance or using a different amount.`,
      )
    }

    const step = responseData as Step
    if ((readEnv('VITE_LIFI_DEBUG') ?? readEnv('LIFI_DEBUG')) === '1') {
      // eslint-disable-next-line no-console
      console.info('[LiFi] step', {
        fromAmount: step.estimate?.fromAmount,
        toAmount: step.estimate?.toAmount,
        toAmountMin: step.estimate?.toAmountMin,
        approvalAddress: step.estimate?.approvalAddress ?? step.transactionRequest?.to,
        hasTxData: Boolean(step.transactionRequest?.data),
      })
    }
    const wantsNativeIn = isAddressEqual(inToken, ETH_SENTINEL)
    return mapStepToQuote(step, wantsNativeIn)
  }
}

// Internal helpers for clarity and testability
function buildHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (apiKey) headers['x-lifi-api-key'] = apiKey
  return headers
}

function buildQuoteUrl(
  baseUrl: string,
  params: {
    chainId: number
    inToken: Address
    outToken: Address
    amountIn?: bigint
    amountOut?: bigint
    intent?: 'exactIn' | 'exactOut'
    router: Address
    fromAddress: Address
    toAddress: Address
    slippage: string
    integrator?: string
    order: LifiOrder
    allowBridges?: string
  },
): URL {
  // Use LiFi's dedicated endpoints for clarity:
  // - exact-in:  /v1/quote (fromAmount in query)
  // - exact-out: /v1/quote/toAmount (toAmount in query)
  const url = new URL(params.intent === 'exactOut' ? '/v1/quote/toAmount' : '/v1/quote', baseUrl)
  const normalizeToken = (token: Address) =>
    isAddressEqual(token, ETH_SENTINEL)
      ? '0x0000000000000000000000000000000000000000'
      : getAddress(token)
  url.searchParams.set('fromChain', String(params.chainId))
  url.searchParams.set('toChain', String(params.chainId))
  url.searchParams.set('fromToken', normalizeToken(params.inToken))
  url.searchParams.set('toToken', normalizeToken(params.outToken))
  url.searchParams.set('toAddress', getAddress(params.toAddress))
  // Per LiFi docs, exact-out quotes must provide `toAmount`.
  // Exact-in quotes provide `fromAmount`.
  if (params.intent === 'exactOut') {
    if (typeof params.amountOut !== 'bigint') {
      throw new Error('LiFi exact-out quote requires amountOut')
    }
    url.searchParams.set('toAmount', params.amountOut.toString())
  } else {
    if (typeof params.amountIn !== 'bigint') {
      throw new Error('LiFi exact-in quote requires amountIn')
    }
    url.searchParams.set('fromAmount', params.amountIn.toString())
  }
  url.searchParams.set('fromAddress', getAddress(params.fromAddress))
  url.searchParams.set('slippage', params.slippage)
  if (params.integrator) url.searchParams.set('integrator', params.integrator)
  url.searchParams.set('order', params.order)
  if (params.allowBridges) url.searchParams.set('allowBridges', params.allowBridges)
  // Always skip simulation for faster responses
  url.searchParams.set('skipSimulation', 'true')
  return url
}

function mapStepToQuote(step: Step, wantsNativeIn: boolean) {
  const tx = step.transactionRequest
  if (!tx?.to) throw new Error('LiFi quote missing transaction target')
  const approvalTarget = step.estimate?.approvalAddress || tx?.to
  if (!approvalTarget) throw new Error('LiFi quote missing approval target')
  const data = tx?.data
  if (!data) throw new Error('LiFi quote missing transaction data')

  const expectedStr = step.estimate?.toAmount
  const minStr = step.estimate?.toAmountMin
  // Prefer minOut (toAmountMin) for safer defaults; fall back to toAmount
  const out = expectedStr ? BigInt(expectedStr) : minStr ? BigInt(minStr) : 0n
  const minOut = minStr ? BigInt(minStr) : out
  const maxIn = step.estimate?.fromAmount ? BigInt(step.estimate.fromAmount) : undefined

  return {
    out,
    minOut,
    ...(typeof maxIn === 'bigint' ? { maxIn } : {}),
    approvalTarget: getAddress(approvalTarget),
    calls: [{ target: getAddress(tx?.to), data, value: 0n }],
    wantsNativeIn,
    sourceName: 'LiFi',
  }
}
