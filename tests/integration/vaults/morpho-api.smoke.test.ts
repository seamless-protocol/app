import { describe, expect, it } from 'vitest'
import { MORPHO_GQL } from '@/lib/morpho/fetchSeamlessVaultsAPY'

describe('Smoke: Morpho API/Earn endpoints reachable', () => {
  it('responds OK the Morpho GraphQL endpoint', async () => {
    const endpoint = MORPHO_GQL
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query{__typename}' }),
    })
    expect(r.ok).toBe(true)
    expect(r.status).toBe(200)
  })
})
