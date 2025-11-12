import type { Address } from 'viem'
import type { LeverageTokenKey } from '../fixtures/addresses'

/**
 * Configuration for Mainnet leverage token E2E tests.
 *
 * Adding a new token:
 * 1. Add a new entry to MAINNET_E2E_TOKEN_CONFIGS array
 * 2. Ensure the key matches the token key format in leverageTokens.config.ts
 * 3. Set appropriate mint amount for UI testing (typically small amounts)
 * 4. Adjust slippage percentage based on token characteristics
 * 5. Provide collateral token address for funding test accounts
 */

export interface MainnetE2ETokenTestConfig {
  /** Token key matching leverageTokens.config.ts format (e.g., 'wsteth-eth-25x') */
  key: LeverageTokenKey
  /** Display label for test suite */
  label: string
  /** Slippage percentage as string for UI input (e.g., '2.5' for 2.5%) */
  slippagePercent: string
  /** Amount to mint in UI tests (as string for UI input, e.g., '0.1') */
  mintAmount: string
  /** Collateral token address on mainnet for funding test accounts */
  collateralAddress: Address
  /** Amount of collateral to fund test account with (as string for topUpErc20) */
  fundingAmount: string
  /** Rich holder address for Anvil token funding via impersonation */
  richHolderAddress: Address
}

export const MAINNET_E2E_TOKEN_CONFIGS: Array<MainnetE2ETokenTestConfig> = [
  {
    key: 'wsteth-eth-25x',
    label: 'wstETH/ETH 25x',
    slippagePercent: '2.5',
    mintAmount: '0.1',
    collateralAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address, // Mainnet wstETH
    fundingAmount: '1',
    richHolderAddress: '0x0B925eD163218f6662a35e0f0371Ac234f9E9371' as Address, // Aave v3 wstETH pool
  },
  {
    key: 'rlp-usdc-6.75x',
    label: 'RLP/USDC 6.75x',
    slippagePercent: '20',
    mintAmount: '100',
    collateralAddress: '0x4956b52aE2fF65D74CA2d61207523288e4528f96' as Address, // Mainnet RLP
    fundingAmount: '500',
    richHolderAddress: '0x234C908E749961d0329a0eD5916d55a99d1aD06c' as Address, // Large RLP holder
  },
  {
    key: 'pt-rlp-4dec2025-usdc-2x',
    label: 'PT-RLP-4DEC2025/USDC 2x',
    slippagePercent: '2',
    mintAmount: '100',
    collateralAddress: '0x3A70F0C696dcB3A4aB3833cD9726397dD61AC85e' as Address, // Mainnet PT-RLP-4DEC2025
    fundingAmount: '200',
    richHolderAddress: '0x3ee8A025fB8CF12A0a6c6027FD40caaBbbd8E2fb' as Address, // Pendle PT-RLP holder (EOA)
  },
]
