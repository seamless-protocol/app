import type { buildSDK } from '@seamless-defi/defi-sdk'
import { fetchBalmyTokenUsdPrices } from '@/domain/shared/adapters/balmy'
import { fetchPendleTokenUsdPrices, isPendleToken } from '@/lib/prices/pendle'

export async function fetchTokenUsdPrices(
  balmySDK: ReturnType<typeof buildSDK>,
  chainId: number,
  addresses: Array<string>,
) {
  const pendleTokens = addresses.filter((a) => isPendleToken(chainId, a))
  const notPendleTokens = addresses.filter((a) => !isPendleToken(chainId, a))

  const [balmyPrices, pendlePrices] = await Promise.all([
    fetchBalmyTokenUsdPrices(balmySDK, chainId, notPendleTokens),
    fetchPendleTokenUsdPrices(chainId, pendleTokens),
  ])

  return { ...balmyPrices, ...pendlePrices }
}
