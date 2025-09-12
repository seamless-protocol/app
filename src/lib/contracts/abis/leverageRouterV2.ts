export const leverageRouterV2Abi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_leverageManager',
        type: 'address',
        internalType: 'contract ILeverageManager',
      },
      {
        name: '_morpho',
        type: 'address',
        internalType: 'contract IMorpho',
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    name: 'convertEquityToCollateral',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
      {
        name: 'equityInCollateralAsset',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [{ name: 'collateral', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      {
        name: 'leverageToken',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
      {
        name: 'collateralFromSender',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'flashLoanAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'minShares', type: 'uint256', internalType: 'uint256' },
      {
        name: 'swapCalls',
        type: 'tuple[]',
        internalType: 'struct ILeverageRouter.Call[]',
        components: [
          { name: 'target', type: 'address', internalType: 'address' },
          { name: 'value', type: 'uint256', internalType: 'uint256' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'leverageManager',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract ILeverageManager',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'morpho',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IMorpho' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'onMorphoFlashLoan',
    inputs: [
      { name: 'loanAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'previewDeposit',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
      {
        name: 'collateralFromSender',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'previewData',
        type: 'tuple',
        internalType: 'struct ActionData',
        components: [
          {
            name: 'collateral',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'debt', type: 'uint256', internalType: 'uint256' },
          { name: 'shares', type: 'uint256', internalType: 'uint256' },
          {
            name: 'tokenFee',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'treasuryFee',
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
    name: 'redeem',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
      { name: 'shares', type: 'uint256', internalType: 'uint256' },
      {
        name: 'minCollateralForSender',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'swapCalls',
        type: 'tuple[]',
        internalType: 'struct ILeverageRouter.Call[]',
        components: [
          { name: 'target', type: 'address', internalType: 'address' },
          { name: 'value', type: 'uint256', internalType: 'uint256' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'redeemWithVelora',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract ILeverageToken',
      },
      { name: 'shares', type: 'uint256', internalType: 'uint256' },
      {
        name: 'minCollateralForSender',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'veloraAdapter',
        type: 'address',
        internalType: 'contract IVeloraAdapter',
      },
      { name: 'augustus', type: 'address', internalType: 'address' },
      {
        name: 'offsets',
        type: 'tuple',
        internalType: 'struct IVeloraAdapter.Offsets',
        components: [
          {
            name: 'exactAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'limitAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'quotedAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      { name: 'swapData', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    name: 'AddressEmptyCode',
    inputs: [{ name: 'target', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'CollateralSlippageTooHigh',
    inputs: [
      {
        name: 'remainingCollateral',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minCollateralForSender',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  { type: 'error', name: 'FailedCall', inputs: [] },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'needed', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'InsufficientCollateralForDeposit',
    inputs: [
      { name: 'available', type: 'uint256', internalType: 'uint256' },
      { name: 'required', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'MaxSwapCostExceeded',
    inputs: [
      { name: 'actualCost', type: 'uint256', internalType: 'uint256' },
      { name: 'maxCost', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
  },
  { type: 'error', name: 'Unauthorized', inputs: [] },
] as const
