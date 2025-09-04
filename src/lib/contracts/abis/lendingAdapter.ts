import type { Abi } from 'viem'

export const lendingAdapterAbi = [
  {
    type: 'function',
    name: 'getLiquidationPenalty',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
] as const satisfies Abi
