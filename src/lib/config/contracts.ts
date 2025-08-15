/**
 * Seamless Protocol contract addresses and configuration
 * Source: https://docs.seamlessprotocol.com/technical/smart-contracts
 */

import { type Address, isAddress } from 'viem'
import { base, mainnet } from 'viem/chains'

// Contract addresses by chain
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    // Core tokens
    seamToken: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85' as Address,
    esSeamToken: '0x998e44232BEF4F8B033e5A5175BDC97F2B10d5e5' as Address,

    // Leverage tokens
    leverageTokenFactory: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57' as Address,
    leverageTokenImplementation: '0x057A2a1CC13A9Af430976af912A27A05DE537673' as Address,

    // Vaults
    vaults: {
      usdc: '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738' as Address,
      cbBTC: '0x5a47C803488FE2BB0A0EAaf346b420e4dF22F3C7' as Address,
      weth: '0x27d8c7273fd3fcc6956a0b370ce5fd4a7fc65c18' as Address,
    },

    // Governance
    governance: {
      timelockShort: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee' as Address,
      governorShort: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294' as Address,
      timelockLong: '0xA96448469520666EDC351eff7676af2247b16718' as Address,
      governorLong: '0x04faA2826DbB38a7A4E9a5E3dB26b9E389E761B6' as Address,
    },
  },
  [mainnet.id]: {
    // SEAM token on Ethereum (for bridging)
    seamToken: '0x6b66ccd1340c479B07B390d326eaDCbb84E726Ba' as Address,
  },
} as const

// Get contract addresses for current chain
export function getContractAddress(chainId: number, contract: string): Address | undefined {
  const chainContracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  if (!chainContracts) return undefined

  // Handle nested paths like 'vaults.usdc'
  const keys = contract.split('.')
  let current: unknown = chainContracts

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
    if (current === undefined || current === null) return undefined
  }

  // Ensure we return only string addresses
  return typeof current === 'string' ? (current as Address) : undefined
}

// Type-safe contract address getter with validation
export function getRequiredContractAddress(chainId: number, contract: string): Address {
  const address = getContractAddress(chainId, contract)
  if (!address || !isAddress(address)) {
    throw new Error(`Contract ${contract} not found or invalid for chain ${chainId}`)
  }
  return address
}
