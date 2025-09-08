import type { Address, Hash } from 'viem'

export interface MintSuccessPayload {
  hash: Hash
  token: Address
  chainId: number
  // Optional, if widget has account context
  owner?: Address
}

export interface RedeemSuccessPayload {
  hash: Hash
  token: Address
  chainId: number
  owner?: Address
}

export type MintOnSuccess = (payload: MintSuccessPayload) => Promise<void> | void
export type RedeemOnSuccess = (payload: RedeemSuccessPayload) => Promise<void> | void
