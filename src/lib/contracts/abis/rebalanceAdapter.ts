import type { Abi } from 'viem'

export const rebalanceAdapterAbi = [
  {
    type: 'function',
    name: 'getAuctionDuration',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint120',
        internalType: 'uint120',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCollateralRatioThreshold',
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
    name: 'getLeverageTokenMinCollateralRatio',
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
    name: 'getLeverageTokenMaxCollateralRatio',
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
    name: 'getLeverageTokenTargetCollateralRatio',
    inputs: [],
    outputs: [
      {
        name: 'targetCollateralRatio',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRebalanceReward',
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
    name: 'getInitialPriceMultiplier',
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
    name: 'getMinPriceMultiplier',
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
