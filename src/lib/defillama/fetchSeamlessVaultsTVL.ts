import { computeProtocolLatestTVL } from '@/lib/defillama/tvl'
import { captureApiError } from '@/lib/observability/sentry'
import { elapsedMsSince, getNowMs } from '@/lib/utils/time'

export function getSeamlessVaultsTVL(): Promise<number> {
  const url = 'https://api.llama.fi/protocol/seamless-vaults'
  const provider = 'defillama'
  const method = 'GET'
  const start = getNowMs()

  return fetch(url).then(async (res) => {
    if (!res.ok) {
      const durationMs = elapsedMsSince(start)
      const requestId = res.headers?.get?.('x-request-id') ?? undefined
      captureApiError({
        provider,
        method,
        url,
        status: res.status,
        durationMs,
        feature: 'vaults-tvl',
        ...(requestId ? { requestId } : {}),
      })
      throw new Error(`DeFiLlama responded ${res.status}`)
    }
    const json = await res.json()
    try {
      return computeProtocolLatestTVL(json)
    } catch (e) {
      const durationMs = elapsedMsSince(start)
      captureApiError({
        provider,
        method,
        url,
        status: 200,
        durationMs,
        feature: 'vaults-tvl',
        responseSnippet: 'missing totalLiquidityUSD',
        error: e,
      })
      throw e
    }
  })
}
