import { contractAddresses, getContractAddresses } from '@/lib/contracts/addresses'
import { captureApiError } from '@/lib/observability/sentry'

export const MORPHO_GQL = 'https://api.morpho.org/graphql'

type VaultByAddress = {
  address?: string
  state?: {
    dailyApy?: number | null
  } | null
}

/**
 * Fetch max net APY across Seamless‑curated Morpho vaults by querying Morpho GraphQL.
 * Uses addresses from our contract map for supported chains.
 */
export async function getSeamlessVaultsMaxAPYFromMorpho(): Promise<number | undefined> {
  // Collect vault addresses by chain from our contract map (derived, not hardcoded)
  const chains = Object.keys(contractAddresses)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
  const entries: Array<{ chainId: number; address: string }> = []
  for (const chainId of chains) {
    const map = getContractAddresses(chainId).vaults
    if (!map) continue
    for (const addr of Object.values(map)) {
      if (addr) entries.push({ chainId, address: addr })
    }
  }
  if (entries.length === 0) return undefined

  // Build a single GraphQL query with aliased vaultByAddress fields
  const fields = entries
    .map(
      (e, i) =>
        `v${i}: vaultByAddress(address: "${e.address}", chainId: ${e.chainId}) { address state { dailyApy } }`,
    )
    .join('\n')

  const query = `query SeamlessVaultsDailyApy {\n${fields}\n}`

  const start = Date.now()
  const res = await fetch(MORPHO_GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    captureApiError({
      provider: 'morpho-graphql',
      method: 'POST',
      url: MORPHO_GQL,
      status: res.status,
      durationMs: Date.now() - start,
      feature: 'vaults-apy',
    })
    throw new Error(`Morpho GraphQL responded ${res.status}`)
  }

  const json = (await res.json()) as {
    data?: Record<string, VaultByAddress>
    errors?: Array<{ message: string }>
  }

  if (json.errors?.length) {
    captureApiError({
      provider: 'morpho-graphql',
      method: 'POST',
      url: MORPHO_GQL,
      status: 200,
      durationMs: Date.now() - start,
      feature: 'vaults-apy',
      responseSnippet: JSON.stringify(json.errors[0]).slice(0, 300),
    })
    throw new Error(json.errors.map((e) => e.message).join(', '))
  }

  const data = json.data ?? {}
  const max = Object.values(data).reduce<number | undefined>((acc, v) => {
    const apy = v?.state?.dailyApy ?? undefined
    if (typeof apy === 'number' && Number.isFinite(apy)) {
      return typeof acc === 'number' ? Math.max(acc, apy) : apy
    }
    return acc
  }, undefined)
  return max
}
