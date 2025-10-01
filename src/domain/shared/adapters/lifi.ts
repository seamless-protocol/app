import type { Address } from 'viem'
import { getAddress } from 'viem'
import { base } from 'viem/chains'
import { BPS_DENOMINATOR, DEFAULT_SLIPPAGE_BPS } from './constants'
import type { QuoteFn } from './types'

export type LifiOrder = 'CHEAPEST' | 'FASTEST'

export interface LifiAdapterOptions {
  chainId?: number
  router: Address
  /** Optional override for quote `fromAddress` (defaults to `router`). */
  fromAddress?: Address
  slippageBps?: number
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

export function createLifiQuoteAdapter(opts: LifiAdapterOptions): QuoteFn {
  const {
    chainId = base.id,
    router,
    fromAddress,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    // Always use li.quest as documented by LiFi for /v1/quote
    baseUrl = opts.baseUrl ?? 'https://li.quest',
    // Read from Vite env in browser; avoid referencing process.env in client bundles
    apiKey = opts.apiKey ?? import.meta.env['VITE_LIFI_API_KEY'] ?? import.meta.env['LIFI_API_KEY'],
    order = 'CHEAPEST',
    // Support browser env only; tests can pass via opts
    integrator = opts.integrator ??
      import.meta.env['VITE_LIFI_INTEGRATOR'] ??
      import.meta.env['LIFI_INTEGRATOR'],
    allowBridges,
  } = opts

  console.log('apiKey', apiKey)

  const headers = buildHeaders(apiKey)
  const slippage = bpsToDecimalString(slippageBps)

  return async ({ inToken, outToken, amountIn }) => {
    const url = buildQuoteUrl(baseUrl, {
      chainId,
      inToken,
      outToken,
      amountIn,
      router,
      // The on-chain swap is executed inside the router flow. When a MulticallExecutor
      // is used, it may be the effective token holder and caller for the swap.
      // Allow overriding `fromAddress` to match the executor when needed; otherwise
      // default to the router address.
      fromAddress: (fromAddress ?? router) as Address,
      slippage,
      ...(integrator ? { integrator } : {}),
      order,
      ...(allowBridges ? { allowBridges } : {}),
    })

    if ((import.meta.env['VITE_LIFI_DEBUG'] ?? import.meta.env['LIFI_DEBUG']) === '1') {
      // Intentionally avoid logging the API key value
      console.info('[LiFi] quote', {
        baseUrl,
        hasApiKey: Boolean(apiKey),
        url: url.toString(),
      })
    }
    const res = await fetch(url.toString(), { method: 'GET', headers })
    if (!res.ok) throw new Error(`LiFi quote failed: ${res.status} ${res.statusText}`)
    const step = (await res.json()) as Step
    return mapStepToQuote(step)
  }
}

// Internal helpers for clarity and testability
function bpsToDecimalString(bps: number): string {
  return (bps / Number(BPS_DENOMINATOR)).toString()
}

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
    amountIn: bigint
    router: Address
    fromAddress: Address
    slippage: string
    integrator?: string
    order: LifiOrder
    allowBridges?: string
  },
): URL {
  const url = new URL('/v1/quote', baseUrl)
  url.searchParams.set('fromChain', String(params.chainId))
  url.searchParams.set('toChain', String(params.chainId))
  url.searchParams.set('fromToken', getAddress(params.inToken))
  url.searchParams.set('toToken', getAddress(params.outToken))
  url.searchParams.set('fromAmount', params.amountIn.toString())
  url.searchParams.set('fromAddress', getAddress(params.fromAddress))
  url.searchParams.set('slippage', params.slippage)
  if (params.integrator) url.searchParams.set('integrator', params.integrator)
  url.searchParams.set('order', params.order)
  if (params.allowBridges) url.searchParams.set('allowBridges', params.allowBridges)
  return url
}

function mapStepToQuote(step: Step) {
  const tx = step.transactionRequest
  const approvalTarget = step.estimate?.approvalAddress || tx?.to
  if (!approvalTarget) throw new Error('LiFi quote missing approval target')
  const data = tx?.data
  if (!data) throw new Error('LiFi quote missing transaction data')

  const outStr = step.estimate?.toAmountMin || step.estimate?.toAmount
  const out = outStr ? BigInt(outStr) : 0n

  return {
    out,
    minOut: out,
    approvalTarget: getAddress(approvalTarget),
    calldata: data,
  }
}
