import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import type { UserPosition } from '@/lib/graphql/types/portfolio'

/**
 * Build a map of chainId -> unique collateral ERC-20 contract addresses (lowercased)
 * from a list of raw user positions. Positions without a configured chainId are skipped.
 */
export function buildCollateralAddressesByChain(
  rawUserPositions: Array<UserPosition>,
): Record<number, Array<string>> {
  const chainMap = new Map<number, Set<string>>()

  for (const position of rawUserPositions) {
    const cfg = getLeverageTokenConfig(position.leverageToken.id as `0x${string}`)
    const chainId = cfg?.chainId
    if (!chainId) continue
    const addr = position.leverageToken.lendingAdapter.collateralAsset.toLowerCase()
    let set = chainMap.get(chainId)
    if (!set) {
      set = new Set<string>()
      chainMap.set(chainId, set)
    }
    set.add(addr)
  }

  const out: Record<number, Array<string>> = {}
  for (const [chainId, set] of chainMap.entries()) out[chainId] = Array.from(set)
  return out
}
