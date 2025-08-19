// Minimal LeverageManager ABI slice needed by the app
// Source: Basescan via Etherscan v2 API for Base chain implementation
// Functions included: mint, previewMint, getLeverageTokenCollateralAsset

export const leverageManagerAbi = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'mint',
    inputs: [
      { name: 'token', internalType: 'contract ILeverageToken', type: 'address' },
      { name: 'equityInCollateralAsset', internalType: 'uint256', type: 'uint256' },
      { name: 'minShares', internalType: 'uint256', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'equity', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'previewMint',
    inputs: [
      { name: 'token', internalType: 'contract ILeverageToken', type: 'address' },
      { name: 'equityInCollateralAsset', internalType: 'uint256', type: 'uint256' },
    ],
    outputs: [
      {
        internalType: 'struct ActionData',
        name: '',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'equity', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getLeverageTokenCollateralAsset',
    inputs: [{ name: 'token', internalType: 'contract ILeverageToken', type: 'address' }],
    outputs: [{ name: 'collateralAsset', internalType: 'contract IERC20', type: 'address' }],
  },
] as const
