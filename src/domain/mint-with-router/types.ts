import type { Address, Hash, PublicClient, WalletClient } from 'viem'

/**
 * Context required by domain functions. This keeps React/wagmi out of the domain
 * and allows tests to inject pure viem clients.
 */
export interface MintContext {
  publicClient: PublicClient
  walletClient: WalletClient
  chainId?: number
}

/**
 * Common parameters for preview/allowance/mint flows.
 * The set is intentionally broad so the same shape works across steps.
 */
export interface MintParams {
  managerAddress: Address
  routerAddress: Address
  tokenProxyAddress: Address
  inputToken: Address
  inputAmount: bigint
  account: Address
}

export interface PreviewParams extends MintParams {}

export interface MintPreview {
  // Expected leverage token out (placeholder; replace with precise shape later)
  expectedLeverageTokenOut: bigint
  // Optional route metadata
  routeHint?: string
}

export interface AllowanceResult {
  hasAllowance: boolean
  approveTxHash?: Hash
}

export interface MintResult {
  txHash: Hash
}
