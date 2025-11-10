import {
  fetchCoingeckoTokenUsdPrices,
  fetchCoingeckoTokenUsdPricesRange,
} from '@/lib/prices/coingecko'
import {
  fetchPendleTokenUsdPrices,
  fetchPendleTokenUsdPricesRange,
  isPendleToken,
} from '@/lib/prices/pendle'

export async function fetchTokenUsdPrices(chainId: number, addresses: Array<string>) {
  const pendleTokens = addresses.filter((a) => isPendleToken(chainId, a))
  const notPendleTokens = addresses.filter((a) => !isPendleToken(chainId, a))

  const [coingeckoPrices, pendlePrices] = await Promise.all([
    fetchCoingeckoTokenUsdPrices(chainId, notPendleTokens),
    fetchPendleTokenUsdPrices(chainId, pendleTokens),
  ])

  return { ...coingeckoPrices, ...pendlePrices }
}

export async function fetchTokenUsdPricesRange(
  chainId: number,
  address: string,
  fromSec: number,
  toSec: number,
) {
  const isPendle = isPendleToken(chainId, address)

  if (isPendle) {
    return await fetchPendleTokenUsdPricesRange(chainId, address, fromSec, toSec)
  }

  return await fetchCoingeckoTokenUsdPricesRange(chainId, address, fromSec, toSec)
}
