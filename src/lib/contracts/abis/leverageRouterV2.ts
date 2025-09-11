// Minimal ABI for LeverageRouter V2 extension
// Provides the `mintWithCalls` entry used by the V2 one-tx flow
export const leverageRouterV2Abi = [
  {
    type: 'function',
    name: 'mintWithCalls',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'equityInInputAsset', type: 'uint256' },
      { name: 'minShares', type: 'uint256' },
      { name: 'maxSwapCostInCollateralAsset', type: 'uint256' },
      {
        name: 'calls',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'data', type: 'bytes' },
          { name: 'value', type: 'uint256' },
        ],
      },
    ],
    outputs: [],
  },
] as const
