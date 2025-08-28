export function getTokenExplorerUrl(chainId: number, tokenAddress: string): string {
  const cleanAddress = tokenAddress.toLowerCase()

  switch (chainId) {
    case 1: // Ethereum Mainnet
      return `https://etherscan.io/token/${cleanAddress}`
    case 8453: // Base Mainnet
      return `https://basescan.org/token/${cleanAddress}`
    default:
      // Fallback to Ethereum mainnet for unknown chains
      return `https://etherscan.io/token/${cleanAddress}`
  }
}

export function getBlockExplorerName(chainId: number): string {
  switch (chainId) {
    case 1: // Ethereum Mainnet
    case 11155111: // Sepolia Testnet
      return 'Etherscan'
    case 8453: // Base Mainnet
    case 84532: // Base Sepolia Testnet
      return 'Basescan'
    default:
      return 'Block Explorer'
  }
}
