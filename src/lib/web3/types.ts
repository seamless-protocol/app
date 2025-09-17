import type { PublicClient, WalletClient } from 'viem'

export type Clients = {
  publicClient: PublicClient
  walletClient: WalletClient
}

export type IoOverrides = {
  simulateContract?: Clients['publicClient']['simulateContract']
  writeContract?: Clients['walletClient']['writeContract']
  waitForTransactionReceipt?: Clients['publicClient']['waitForTransactionReceipt']
}
