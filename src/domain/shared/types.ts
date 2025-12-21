import type { Address, Hex } from 'viem'

export type Call = {
  target: Address
  data: Hex
  value: bigint
}
