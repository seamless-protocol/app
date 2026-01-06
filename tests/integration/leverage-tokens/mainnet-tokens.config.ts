import type { Address } from 'viem'
import type { LeverageTokenKey } from '../../fixtures/addresses'

/**
 * Configuration for Mainnet leverage token integration tests.
 *
 * Adding a new token:
 * 1. Add a new entry to MAINNET_TOKEN_CONFIGS array
 * 2. Ensure the key matches the token key format in leverageTokens.config.ts
 * 3. Adjust slippageBps and toleranceBps based on token characteristics
 * 4. Set appropriate fundingAmount for test account setup
 * 5. Provide richHolderAddress for Anvil token funding via impersonation
 *
 * Note: Collateral addresses are sourced from production config (leverageTokens.config.ts)
 */

export interface MainnetTokenTestConfig {
  /** Token key matching leverageTokens.config.ts format (e.g., 'wsteth-eth-25x') */
  key: LeverageTokenKey
  /** Display label for test suite */
  label: string
  /** Slippage tolerance in basis points (e.g., 250 = 2.5%) */
  slippageBps: number
  /** Tolerance for share amount validation in basis points (e.g., 10 = 0.1%) */
  toleranceBps: number
  /** Amount of collateral to fund test account with (as string for parseUnits) */
  fundingAmount: string
  /** Rich holder address for Anvil token funding via impersonation */
  richHolderAddress: Address
}

export const MAINNET_TOKEN_CONFIGS: Array<MainnetTokenTestConfig> = [
  {
    key: 'wsteth-eth-25x',
    label: 'wstETH/ETH 25x',
    slippageBps: 600,
    toleranceBps: 10,
    fundingAmount: '0.5',
    richHolderAddress: '0x0B925eD163218f6662a35e0f0371Ac234f9E9371' as Address, // Aave v3 wstETH pool
  },
  {
    key: 'rlp-usdc-6.75x',
    label: 'RLP/USDC 6.75x',
    slippageBps: 1500,
    toleranceBps: 10,
    fundingAmount: '500',
    richHolderAddress: '0x234C908E749961d0329a0eD5916d55a99d1aD06c' as Address, // Large RLP holder
  },
  {
    key: 'siusd-usdc-11x',
    label: 'siUSD/USDC 11x',
    slippageBps: 50, // Infinifi staking path is deterministic; modest buffer
    toleranceBps: 10,
    fundingAmount: '100',
    richHolderAddress: '0x81001E398b65F641EB087EC83e209545544BF4D8' as Address, // EOA
  },
  {
    key: 'susd-usdt-25x',
    label: 'sUSD/USDT 25x',
    slippageBps: 50, // Infinifi staking path is deterministic; modest buffer
    toleranceBps: 10,
    fundingAmount: '10',
    richHolderAddress: '0xBc65ad17c5C0a2A4D159fa5a503f4992c7B545FE' as Address, // EOA
  },
  
  // Skip PT-RLP-4DEC2025/USDC 2x due PT being expired
  // {
  //   key: 'pt-rlp-4dec2025-usdc-2x',
  //   label: 'PT-RLP-4DEC2025/USDC 2x',
  //   slippageBps: 500,
  //   toleranceBps: 10,
  //   fundingAmount: '200',
  //   richHolderAddress: '0x3ee8A025fB8CF12A0a6c6027FD40caaBbbd8E2fb' as Address, // Pendle PT-RLP holder (EOA)
  // },
]
