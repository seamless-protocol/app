import { config } from '@/lib/config/wagmi.config'

const getChains = () => config.chains || []

function getExplorerBase(chainId: number): { url: string; name: string } {
  const chain = getChains().find((c) => c.id === chainId)
  const url = chain?.blockExplorers?.default?.url
  const name = chain?.blockExplorers?.default?.name
  if (url && name) return { url: stripTrailingSlash(url), name }

  // Fallbacks for known chains (Etherscan family), then generic
  switch (chainId) {
    case 11155111:
      return { url: 'https://sepolia.etherscan.io', name: 'Etherscan' }
    case 84532:
      return { url: 'https://sepolia.basescan.org', name: 'Basescan' }
    case 8453:
      return { url: 'https://basescan.org', name: 'Basescan' }
    case 1:
      return { url: 'https://etherscan.io', name: 'Etherscan' }
    default:
      return { url: 'https://etherscan.io', name: 'Block Explorer' }
  }
}

function stripTrailingSlash(input: string): string {
  return input.replace(/\/+$/, '')
}

export function getTokenExplorerUrl(chainId: number, tokenAddress: string): string {
  const { url } = getExplorerBase(chainId)
  const cleanAddress = tokenAddress.toLowerCase()
  return `${url}/token/${cleanAddress}`
}

export function getAddressExplorerUrl(chainId: number, address: string): string {
  const { url } = getExplorerBase(chainId)
  const cleanAddress = address.toLowerCase()
  return `${url}/address/${cleanAddress}`
}

export function getBlockExplorerName(chainId: number): string {
  return getExplorerBase(chainId).name
}

export function getTxExplorerUrl(chainId: number, txHash: string): string {
  const { url } = getExplorerBase(chainId)
  const cleanHash = txHash.toLowerCase()
  return `${url}/tx/${cleanHash}`
}

export function getTokenExplorerInfo(
  chainId: number,
  tokenAddress: string,
): { url: string; name: string } {
  return {
    url: getTokenExplorerUrl(chainId, tokenAddress),
    name: getBlockExplorerName(chainId),
  }
}

export function getTxExplorerInfo(chainId: number, txHash: string): { url: string; name: string } {
  return {
    url: getTxExplorerUrl(chainId, txHash),
    name: getBlockExplorerName(chainId),
  }
}
