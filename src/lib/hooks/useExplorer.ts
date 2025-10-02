import { useAccount } from 'wagmi'
import {
  getAddressExplorerUrl,
  getBlockExplorerName,
  getTokenExplorerUrl,
  getTxExplorerUrl,
} from '@/lib/utils/block-explorer'

function stripTrailingSlash(input?: string): string | undefined {
  return input?.replace(/\/+$/, '')
}

export const useExplorer = () => {
  const { chain } = useAccount()
  const chainId = (chain as { id?: number } | undefined)?.id ?? 1

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
