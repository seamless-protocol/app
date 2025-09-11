import type { Address, Hex, PublicClient, WalletClient } from 'viem'

export type Clients = {
  publicClient: PublicClient
  walletClient: WalletClient
}

export type Addresses = {
  router: Address
  manager: Address
  token: Address
}

export type IoOverrides = {
  simulateContract?: Clients['publicClient']['simulateContract']
  writeContract?: Clients['walletClient']['writeContract']
  waitForTransactionReceipt?: Clients['publicClient']['waitForTransactionReceipt']
}

export type Quote = {
  out: bigint
  approvalTarget: Address
  calldata: Hex
}

export type QuoteFn = (args: {
  inToken: Address
  outToken: Address
  amountIn: bigint
}) => Promise<Quote>

export enum RouterVersion {
  V1 = 'v1',
  V2 = 'v2',
}
