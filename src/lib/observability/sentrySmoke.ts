import { captureApiError, captureTxError } from '@/lib/observability/sentry'

function dummyHex(length: number): string {
  return `0x${'0'.repeat(length - 2)}`
}

export type SmokeKind = 'api' | 'tx' | 'subgraph' | 'all'

export function runSentrySmoke(kind: SmokeKind | string = 'all') {
  const kinds: Array<string> = String(kind)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const doApi = kinds.includes('api') || kinds.includes('all')
  const doSubgraph = kinds.includes('subgraph') || kinds.includes('all')
  const doTx = kinds.includes('tx') || kinds.includes('all')

  const err = new Error('Sentry smoke test')

  if (doApi) {
    captureApiError({
      provider: 'etherfi',
      method: 'GET',
      url: 'https://misc-cache.seamlessprotocol.com/etherfi-protocol-detail',
      status: 599,
      durationMs: 123,
      feature: 'apr',
      error: err,
    })
  }

  if (doSubgraph) {
    captureApiError({
      provider: 'thegraph',
      method: 'POST',
      url: 'https://api.studio.thegraph.com/query/placeholder',
      status: 500,
      durationMs: 45,
      feature: 'subgraph',
      error: err,
    })
  }

  if (doTx) {
    captureTxError({
      flow: 'mint',
      chainId: 8453,
      token: dummyHex(42),
      inputAsset: dummyHex(42),
      slippageBps: 100,
      amountIn: '1.0',
      expectedOut: '0.99',
      provider: 'uniswap',
      error: err,
      decodedName: 'SlippageTooHigh',
    })
  }
}
