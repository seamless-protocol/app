import type { Address, ContractFunctionArgs, Hash, PublicClient, WalletClient } from 'viem'
import type { leverageRouterAbi } from '@/lib/contracts/abis/leverageRouter'

export type SwapContext = ContractFunctionArgs<typeof leverageRouterAbi, 'nonpayable', 'mint'>[4]

export type Clients = {
  publicClient: PublicClient
  walletClient: WalletClient
}

export type Addresses = {
  router: Address
  manager: Address
  token: Address
}

export type MintParams = {
  equityInCollateralAsset: bigint
  slippageBps?: number
  maxSwapCostInCollateralAsset?: bigint
  swapContext?: SwapContext
}

export type PreviewMintResult = {
  shares: bigint
  tokenFee: bigint
  treasuryFee: bigint
}

export type MintResult = {
  hash: Hash
  receipt: Awaited<ReturnType<Clients['publicClient']['waitForTransactionReceipt']>>
  preview: PreviewMintResult
  minShares: bigint
  slippageBps: number
}

// Optional IO overrides to support wrapper environments (e.g., wagmi core mocks in unit tests)
export type IoOverrides = {
  simulateContract?: Clients['publicClient']['simulateContract']
  writeContract?: Clients['walletClient']['writeContract']
  waitForTransactionReceipt?: Clients['publicClient']['waitForTransactionReceipt']
}
