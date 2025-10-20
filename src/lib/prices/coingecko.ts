import { getApiEndpoint } from '@/lib/config/api'

// Map our chain IDs to CoinGecko platform IDs
const COINGECKO_PLATFORMS: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
}

export function getCoingeckoPlatform(chainId: number): string {
  const platform = COINGECKO_PLATFORMS[chainId]
  if (!platform) {
    throw new Error(
      `Unsupported chain for CoinGecko: ${chainId}. Supported: ${Object.keys(COINGECKO_PLATFORMS).join(', ')}`,
    )
  }
  return platform
}

/**
 * Fetch USD prices for a set of ERC-20 contract addresses from CoinGecko.
 * Returns a map of lowercase address -> usd price (number).
 */
export async function fetchCoingeckoTokenUsdPrices(
  chainId: number,
  addresses: Array<string>,
): Promise<Record<string, number>> {
  const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase())))
  if (unique.length === 0) return {}

  const platform = getCoingeckoPlatform(chainId)

  // Some environments may want to override the API root (e.g., proxy)
  const configured = getApiEndpoint('coingecko')
  const bases = normalizeBaseVariants(configured)

  let lastErr: unknown
  for (const baseUrl of bases) {
    const url = new URL(`${baseUrl}/simple/token_price/${platform}`)
    url.searchParams.set('contract_addresses', unique.join(','))
    url.searchParams.set('vs_currencies', 'usd')

    const res = await fetch(url.toString(), { method: 'GET' })
    if (res.ok) {
      const json = (await res.json()) as Record<string, { usd?: number }>

      const out: Record<string, number> = {}
      for (const [addr, { usd }] of Object.entries(json)) {
        if (typeof usd === 'number' && Number.isFinite(usd)) {
          out[addr.toLowerCase()] = usd
        }
      }
      return out
    }
    lastErr = new Error(`CoinGecko HTTP ${res.status}`)
    // If path is wrong (likely 404), try next variant
    if (res.status !== 404) break
  }
  throw lastErr instanceof Error ? lastErr : new Error('CoinGecko request failed')
}

function normalizeBaseVariants(base: string): Array<string> {
  const clean = base.replace(/\/$/, '')
  const hasApiV3 = /\/api\/v3$/.test(clean)
  const withApi = hasApiV3 ? clean : `${clean}/api/v3`
  const withoutApi = hasApiV3 ? clean.replace(/\/api\/v3$/, '') : clean
  // prefer configured, then the alternate
  return [clean, hasApiV3 ? withoutApi : withApi]
}

/**
 * Fetch historical USD price series for a specific ERC-20 contract over a time range.
 * Returns an array of [timestampSec, priceUsd] sorted ascending.
 */
export async function fetchCoingeckoTokenUsdPricesRange(
  chainId: number,
  address: string,
  fromSec: number,
  toSec: number,
): Promise<Array<[number, number]>> {
  const platform = getCoingeckoPlatform(chainId)
  const configured = getApiEndpoint('coingecko')
  const bases = normalizeBaseVariants(configured)

  // Normalize inputs
  const addr = address.toLowerCase()
  const from = Math.floor(fromSec)
  const to = Math.floor(toSec)

  // Optional CoinGecko Pro API key
  const { getEnvVar } = await import('@/lib/env')
  const proKey = getEnvVar('VITE_COINGECKO_API_KEY')

  let lastErr: unknown
  for (const baseUrl of bases) {
    const url = new URL(`${baseUrl}/coins/${platform}/contract/${addr}/market_chart/range`)
    url.searchParams.set('vs_currency', 'usd')
    url.searchParams.set('from', String(from))
    url.searchParams.set('to', String(to))

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...(proKey ? { 'x-cg-pro-api-key': proKey } : {}),
      },
    })

    if (res.ok) {
      const json = (await res.json()) as { prices?: Array<[number, number]> }
      const series = Array.isArray(json.prices) ? json.prices : []
      // json.prices timestamps are in milliseconds
      const out: Array<[number, number]> = series
        .map(([ms, price]) => [Math.floor(ms / 1000), Number(price)] as [number, number])
        .filter(([, p]) => Number.isFinite(p))
        .sort((a, b) => a[0] - b[0])
      return out
    }
    lastErr = new Error(`CoinGecko HTTP ${res.status}`)
    if (res.status !== 404) break
  }
  throw lastErr instanceof Error ? lastErr : new Error('CoinGecko range request failed')
}
