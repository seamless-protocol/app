import { useAccount, useChains } from 'wagmi'
import {
  getAddressExplorerUrl,
  getBlockExplorerName,
  getTokenExplorerUrl,
  getTxExplorerUrl,
} from '@/lib/utils/block-explorer'

function stripTrailingSlash(input?: string): string | undefined {
  return input?.replace(/\/+$/, '')
}

export const useExplorer = (chainId?: number) => {
  let { chain } = useAccount()
  const chains = useChains()

  if (chainId !== undefined) {
    chain = chains.find((c) => c.id === chainId)
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`)
    }
  } else {
    chainId = chain?.id ?? 1
  }

  // Prefer wagmi chain metadata when available
  const base = stripTrailingSlash(chain?.blockExplorers?.default?.url)
  const name = chain?.blockExplorers?.default?.name ?? getBlockExplorerName(chainId)

  return {
    chainId,
    name,
    baseUrl: base,
    txUrl: (hash: string) =>
      base ? `${base}/tx/${hash.toLowerCase()}` : getTxExplorerUrl(chainId, hash),
    addressUrl: (address: string) =>
      base ? `${base}/address/${address.toLowerCase()}` : getAddressExplorerUrl(chainId, address),
    tokenUrl: (address: string) =>
      base ? `${base}/token/${address.toLowerCase()}` : getTokenExplorerUrl(chainId, address),
  }
}
