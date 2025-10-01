export const leverageRouterV2Abi = [
  {
    inputs: [
      { internalType: 'contract ILeverageManager', name: '_leverageManager', type: 'address' },
      { internalType: 'contract IMorpho', name: '_morpho', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'remainingCollateral', type: 'uint256' },
      { internalType: 'uint256', name: 'minCollateralForSender', type: 'uint256' },
    ],
    name: 'CollateralSlippageTooHigh',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'available', type: 'uint256' },
      { internalType: 'uint256', name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientCollateralForDeposit',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'actualCost', type: 'uint256' },
      { internalType: 'uint256', name: 'maxCost', type: 'uint256' },
    ],
    name: 'MaxSwapCostExceeded',
    type: 'error',
  },
  { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  { inputs: [], name: 'Unauthorized', type: 'error' },
  {
    inputs: [
      { internalType: 'contract ILeverageToken', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'equityInCollateralAsset', type: 'uint256' },
    ],
    name: 'convertEquityToCollateral',
    outputs: [{ internalType: 'uint256', name: 'collateral', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ILeverageToken', name: 'leverageToken', type: 'address' },
      { internalType: 'uint256', name: 'collateralFromSender', type: 'uint256' },
      { internalType: 'uint256', name: 'flashLoanAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'minShares', type: 'uint256' },
      { internalType: 'contract IMulticallExecutor', name: 'multicallExecutor', type: 'address' },
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
          { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        internalType: 'struct IMulticallExecutor.Call[]',
        name: 'swapCalls',
        type: 'tuple[]',
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'leverageManager',
    outputs: [{ internalType: 'contract ILeverageManager', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'morpho',
    outputs: [{ internalType: 'contract IMorpho', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'loanAmount', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'onMorphoFlashLoan',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ILeverageToken', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'collateralFromSender', type: 'uint256' },
    ],
    name: 'previewDeposit',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'collateral', type: 'uint256' },
          { internalType: 'uint256', name: 'debt', type: 'uint256' },
          { internalType: 'uint256', name: 'shares', type: 'uint256' },
          { internalType: 'uint256', name: 'tokenFee', type: 'uint256' },
          { internalType: 'uint256', name: 'treasuryFee', type: 'uint256' },
        ],
        internalType: 'struct ActionData',
        name: 'previewData',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ILeverageToken', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'minCollateralForSender', type: 'uint256' },
      { internalType: 'contract IMulticallExecutor', name: 'multicallExecutor', type: 'address' },
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
          { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        internalType: 'struct IMulticallExecutor.Call[]',
        name: 'swapCalls',
        type: 'tuple[]',
      },
    ],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract ILeverageToken', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'minCollateralForSender', type: 'uint256' },
      { internalType: 'contract IVeloraAdapter', name: 'veloraAdapter', type: 'address' },
      { internalType: 'address', name: 'augustus', type: 'address' },
      {
        components: [
          { internalType: 'uint256', name: 'exactAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'limitAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'quotedAmount', type: 'uint256' },
        ],
        internalType: 'struct IVeloraAdapter.Offsets',
        name: 'offsets',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'swapData', type: 'bytes' },
    ],
    name: 'redeemWithVelora',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
