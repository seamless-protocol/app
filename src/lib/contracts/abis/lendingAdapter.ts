import type { Abi } from 'viem'

export const lendingAdapterAbi = [
  {
    type: 'function',
    name: 'getCollateral',
    inputs: [],
    outputs: [
      {
        name: 'collateral',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDebt',
    inputs: [],
    outputs: [
      {
        name: 'debt',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
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
  {
    type: 'function',
    name: 'morphoMarketId',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
] as const satisfies Abi
