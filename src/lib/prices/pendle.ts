import type { Address } from 'viem'
import { getApiEndpoint } from '@/lib/config/api'

// TODO: add Zod schema for the responses

// Ensure token addresses are stored in lowercase
const PENDLE_TOKENS_BY_CHAIN: Record<number, Record<Address, boolean>> = {
  1: {
    '0x3a70f0c696dcb3a4ab3833cd9726397dd61ac85e': true,
  },
}

/**
 * Checks if a token address is tracked as a Pendle token for a given chain.
 * @param chainId The chain ID.
 * @param address The token address to check (case-insensitive).
 * @returns True if the token is a Pendle token on the given chain, false otherwise.
 */
export function isPendleToken(chainId: number, address: string): boolean {
  const tokensForChain = PENDLE_TOKENS_BY_CHAIN[chainId]
  if (!tokensForChain) return false
  return !!tokensForChain[address.toLowerCase() as Address]
}

export async function fetchPendleTokenUsdPrices(
  chainId: number,
  addresses: Array<string>,
): Promise<Record<string, number>> {
  const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase())))
  if (unique.length === 0) return {}

  const baseUrl = getApiEndpoint('pendle')

  const url = new URL('/core/v1/prices/assets', baseUrl)
  url.searchParams.set('ids', unique.map((a) => `${chainId}-${a}`).join(','))

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) throw new Error(`Pendle price call failed: ${res.status} ${res.statusText}`)

  const json = (await res.json()) as { prices: Record<string, number> }
  const out: Record<string, number> = {}
  for (const [id, usd] of Object.entries(json.prices)) {
    const [chainId, address] = id.split('-')
    if (Number.isFinite(usd) && chainId && address) {
      out[address.toLowerCase()] = usd
    }
  }
  return out
}

export async function fetchPendleTokenUsdPricesRange(
  chainId: number,
  address: string,
  fromSec: number,
  toSec: number,
): Promise<Array<[number, number]>> {
  const baseUrl = getApiEndpoint('pendle')

  // Normalize inputs
  const addr = address.toLowerCase()
  const from = Math.floor(fromSec)
  const to = Math.floor(toSec)

  const url = new URL('/core/v1/assets', baseUrl)
  url.searchParams.set('chainId', String(chainId))
  url.searchParams.set('address', addr)
  url.searchParams.set('timestamp_start', String(from))
  url.searchParams.set('timestamp_end', String(to))

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) throw new Error(`Pendle price range call failed: ${res.status} ${res.statusText}`)
  const json = (await res.json()) as { prices?: Array<[number, number]> }
  const series = Array.isArray(json.prices) ? json.prices : []

  const out: Array<[number, number]> = series
    .map(([timestamp, price]) => [timestamp, Number(price)] as [number, number])
    .filter(([, p]) => Number.isFinite(p))
    .sort((a, b) => a[0] - b[0])
  return out
}
