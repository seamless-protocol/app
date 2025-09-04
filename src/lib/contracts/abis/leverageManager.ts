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
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getLeverageTokenDebtAsset',
    inputs: [{ name: 'token', internalType: 'contract ILeverageToken', type: 'address' }],
    outputs: [{ name: 'debtAsset', internalType: 'contract IERC20', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getLeverageTokenConfig',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
    ],
    outputs: [
      {
        name: 'config',
        type: 'tuple',
        internalType: 'struct LeverageTokenConfig',
        components: [
          {
            name: 'lendingAdapter',
            type: 'address',
            internalType: 'contract ILendingAdapter',
          },
          {
            name: 'rebalanceAdapter',
            type: 'address',
            internalType: 'contract IRebalanceAdapterBase',
          },
          {
            name: 'mintTokenFee',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'redeemTokenFee',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLeverageTokenState',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
    ],
    outputs: [
      {
        name: 'state',
        type: 'tuple',
        internalType: 'struct LeverageTokenState',
        components: [
          {
            name: 'collateralInDebtAsset',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'debt',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'equity',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'collateralRatio',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const
