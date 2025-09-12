import {
  createReadContract,
  createSimulateContract,
  createUseReadContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
  createUseWriteContract,
  createWatchContractEvent,
  createWriteContract,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LeverageManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const leverageManagerAbi = [
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'minShares', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
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
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'previewMint',
    outputs: [
      {
        name: '',
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
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenCollateralAsset',
    outputs: [
      {
        name: 'collateralAsset',
        internalType: 'contract IERC20',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenDebtAsset',
    outputs: [{ name: 'debtAsset', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenConfig',
    outputs: [
      {
        name: 'config',
        internalType: 'struct LeverageTokenConfig',
        type: 'tuple',
        components: [
          {
            name: 'lendingAdapter',
            internalType: 'contract ILendingAdapter',
            type: 'address',
          },
          {
            name: 'rebalanceAdapter',
            internalType: 'contract IRebalanceAdapterBase',
            type: 'address',
          },
          { name: 'mintTokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'redeemTokenFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenState',
    outputs: [
      {
        name: 'state',
        internalType: 'struct LeverageTokenState',
        type: 'tuple',
        components: [
          {
            name: 'collateralInDebtAsset',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'equity', internalType: 'uint256', type: 'uint256' },
          { name: 'collateralRatio', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const leverageManagerAddress = {
  8453: '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const leverageManagerConfig = {
  address: leverageManagerAddress,
  abi: leverageManagerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LeverageManagerV2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const leverageManagerV2Abi = [
  {
    type: 'function',
    inputs: [],
    name: 'BASE_RATIO',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FEE_MANAGER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'chargeManagementFee',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'collateral', internalType: 'uint256', type: 'uint256' },
      { name: 'rounding', internalType: 'enum Math.Rounding', type: 'uint8' },
    ],
    name: 'convertCollateralToDebt',
    outputs: [{ name: 'debt', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'collateral', internalType: 'uint256', type: 'uint256' },
      { name: 'rounding', internalType: 'enum Math.Rounding', type: 'uint8' },
    ],
    name: 'convertCollateralToShares',
    outputs: [{ name: 'shares', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'debt', internalType: 'uint256', type: 'uint256' },
      { name: 'rounding', internalType: 'enum Math.Rounding', type: 'uint8' },
    ],
    name: 'convertDebtToCollateral',
    outputs: [{ name: 'collateral', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
      { name: 'rounding', internalType: 'enum Math.Rounding', type: 'uint8' },
    ],
    name: 'convertSharesToCollateral',
    outputs: [{ name: 'collateral', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
      { name: 'rounding', internalType: 'enum Math.Rounding', type: 'uint8' },
    ],
    name: 'convertSharesToDebt',
    outputs: [{ name: 'debt', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'convertToAssets',
    outputs: [
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'convertToShares',
    outputs: [{ name: 'shares', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'tokenConfig',
        internalType: 'struct LeverageTokenConfig',
        type: 'tuple',
        components: [
          {
            name: 'lendingAdapter',
            internalType: 'contract ILendingAdapter',
            type: 'address',
          },
          {
            name: 'rebalanceAdapter',
            internalType: 'contract IRebalanceAdapterBase',
            type: 'address',
          },
          { name: 'mintTokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'redeemTokenFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
    ],
    name: 'createNewLeverageToken',
    outputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'collateral', internalType: 'uint256', type: 'uint256' },
      { name: 'minShares', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getDefaultManagementFeeAtCreation',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getFeeAdjustedTotalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLastManagementFeeAccrualTimestamp',
    outputs: [{ name: '', internalType: 'uint120', type: 'uint120' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'action', internalType: 'enum ExternalAction', type: 'uint8' },
    ],
    name: 'getLeverageTokenActionFee',
    outputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenCollateralAsset',
    outputs: [
      {
        name: 'collateralAsset',
        internalType: 'contract IERC20',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenConfig',
    outputs: [
      {
        name: 'config',
        internalType: 'struct LeverageTokenConfig',
        type: 'tuple',
        components: [
          {
            name: 'lendingAdapter',
            internalType: 'contract ILendingAdapter',
            type: 'address',
          },
          {
            name: 'rebalanceAdapter',
            internalType: 'contract IRebalanceAdapterBase',
            type: 'address',
          },
          { name: 'mintTokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'redeemTokenFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenDebtAsset',
    outputs: [{ name: 'debtAsset', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getLeverageTokenFactory',
    outputs: [
      {
        name: 'factory',
        internalType: 'contract IBeaconProxyFactory',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenInitialCollateralRatio',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenLendingAdapter',
    outputs: [
      {
        name: 'adapter',
        internalType: 'contract ILendingAdapter',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenRebalanceAdapter',
    outputs: [
      {
        name: 'module',
        internalType: 'contract IRebalanceAdapterBase',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getLeverageTokenState',
    outputs: [
      {
        name: 'state',
        internalType: 'struct LeverageTokenState',
        type: 'tuple',
        components: [
          {
            name: 'collateralInDebtAsset',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'equity', internalType: 'uint256', type: 'uint256' },
          { name: 'collateralRatio', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'getManagementFee',
    outputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getTreasury',
    outputs: [{ name: 'treasury', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'action', internalType: 'enum ExternalAction', type: 'uint8' }],
    name: 'getTreasuryActionFee',
    outputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'initialAdmin', internalType: 'address', type: 'address' },
      { name: 'treasury', internalType: 'address', type: 'address' },
      {
        name: 'leverageTokenFactory',
        internalType: 'contract IBeaconProxyFactory',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
      { name: 'maxCollateral', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'collateral', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'previewDeposit',
    outputs: [
      {
        name: '',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'previewMint',
    outputs: [
      {
        name: '',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'previewRedeem',
    outputs: [
      {
        name: '',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'collateral', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'previewWithdraw',
    outputs: [
      {
        name: '',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'leverageToken',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'actions',
        internalType: 'struct RebalanceAction[]',
        type: 'tuple[]',
        components: [
          {
            name: 'actionType',
            internalType: 'enum ActionType',
            type: 'uint8',
          },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: 'tokenIn', internalType: 'contract IERC20', type: 'address' },
      { name: 'tokenOut', internalType: 'contract IERC20', type: 'address' },
      { name: 'amountIn', internalType: 'uint256', type: 'uint256' },
      { name: 'amountOut', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rebalance',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
      { name: 'minCollateral', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'redeem',
    outputs: [
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256' }],
    name: 'setDefaultManagementFeeAtCreation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'fee', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setManagementFee',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'treasury', internalType: 'address', type: 'address' }],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'action', internalType: 'enum ExternalAction', type: 'uint8' },
      { name: 'fee', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setTreasuryActionFee',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'collateral', internalType: 'uint256', type: 'uint256' },
      { name: 'maxShares', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'DefaultManagementFeeAtCreationSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'leverageTokenFactory',
        internalType: 'contract IBeaconProxyFactory',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'LeverageManagerInitialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'leverageToken',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      {
        name: 'action',
        internalType: 'enum ExternalAction',
        type: 'uint8',
        indexed: true,
      },
      { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'LeverageTokenActionFeeSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      {
        name: 'collateralAsset',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
      {
        name: 'debtAsset',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
      {
        name: 'config',
        internalType: 'struct LeverageTokenConfig',
        type: 'tuple',
        components: [
          {
            name: 'lendingAdapter',
            internalType: 'contract ILendingAdapter',
            type: 'address',
          },
          {
            name: 'rebalanceAdapter',
            internalType: 'contract IRebalanceAdapterBase',
            type: 'address',
          },
          { name: 'mintTokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'redeemTokenFee', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'LeverageTokenCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'leverageToken',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sharesFee',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ManagementFeeCharged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ManagementFeeSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'Mint',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'stateBefore',
        internalType: 'struct LeverageTokenState',
        type: 'tuple',
        components: [
          {
            name: 'collateralInDebtAsset',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'equity', internalType: 'uint256', type: 'uint256' },
          { name: 'collateralRatio', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
      {
        name: 'stateAfter',
        internalType: 'struct LeverageTokenState',
        type: 'tuple',
        components: [
          {
            name: 'collateralInDebtAsset',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'equity', internalType: 'uint256', type: 'uint256' },
          { name: 'collateralRatio', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
      {
        name: 'actions',
        internalType: 'struct RebalanceAction[]',
        type: 'tuple[]',
        components: [
          {
            name: 'actionType',
            internalType: 'enum ActionType',
            type: 'uint8',
          },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'Rebalance',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'actionData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'Redeem',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'action',
        internalType: 'enum ExternalAction',
        type: 'uint8',
        indexed: true,
      },
      { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'TreasuryActionFeeSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'treasury',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'TreasurySet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedCall' },
  {
    type: 'error',
    inputs: [
      { name: 'fee', internalType: 'uint256', type: 'uint256' },
      { name: 'maxFee', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'FeeTooHigh',
  },
  { type: 'error', inputs: [], name: 'InvalidCollateralRatios' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'InvalidLeverageTokenAssets' },
  {
    type: 'error',
    inputs: [
      {
        name: 'initialCollateralRatio',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'InvalidLeverageTokenInitialCollateralRatio',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
    ],
    name: 'InvalidLeverageTokenStateAfterRebalance',
  },
  { type: 'error', inputs: [], name: 'LeverageTokenNotEligibleForRebalance' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'caller', internalType: 'address', type: 'address' },
    ],
    name: 'NotRebalancer',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  {
    type: 'error',
    inputs: [
      { name: 'actual', internalType: 'uint256', type: 'uint256' },
      { name: 'expected', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'SlippageTooHigh',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
  { type: 'error', inputs: [], name: 'ZeroAddressTreasury' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LeverageRouter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const leverageRouterAbi = [
  {
    type: 'function',
    inputs: [],
    name: 'leverageManager',
    outputs: [{ name: '', internalType: 'contract ILeverageManager', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'minShares', internalType: 'uint256', type: 'uint256' },
      {
        name: 'maxSwapCostInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'swapContext',
        internalType: 'struct ISwapAdapter.SwapContext',
        type: 'tuple',
        components: [
          { name: 'path', internalType: 'address[]', type: 'address[]' },
          { name: 'encodedPath', internalType: 'bytes', type: 'bytes' },
          { name: 'fees', internalType: 'uint24[]', type: 'uint24[]' },
          { name: 'tickSpacing', internalType: 'int24[]', type: 'int24[]' },
          { name: 'exchange', internalType: 'uint8', type: 'uint8' },
          {
            name: 'exchangeAddresses',
            internalType: 'tuple',
            type: 'tuple',
            components: [
              {
                name: 'aerodromeRouter',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'aerodromePoolFactory',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'aerodromeSlipstreamRouter',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'uniswapSwapRouter02',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'uniswapV2Router02',
                internalType: 'address',
                type: 'address',
              },
            ],
          },
          { name: 'additionalData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'maxShares', internalType: 'uint256', type: 'uint256' },
      {
        name: 'maxSwapCostInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'swapContext',
        internalType: 'struct ISwapAdapter.SwapContext',
        type: 'tuple',
        components: [
          { name: 'path', internalType: 'address[]', type: 'address[]' },
          { name: 'encodedPath', internalType: 'bytes', type: 'bytes' },
          { name: 'fees', internalType: 'uint24[]', type: 'uint24[]' },
          { name: 'tickSpacing', internalType: 'int24[]', type: 'int24[]' },
          { name: 'exchange', internalType: 'uint8', type: 'uint8' },
          {
            name: 'exchangeAddresses',
            internalType: 'tuple',
            type: 'tuple',
            components: [
              {
                name: 'aerodromeRouter',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'aerodromePoolFactory',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'aerodromeSlipstreamRouter',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'uniswapSwapRouter02',
                internalType: 'address',
                type: 'address',
              },
              {
                name: 'uniswapV2Router02',
                internalType: 'address',
                type: 'address',
              },
            ],
          },
          { name: 'additionalData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const leverageRouterAddress = {
  8453: '0xDbA92fC3dc10a17b96b6E807a908155C389A887C',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const leverageRouterConfig = {
  address: leverageRouterAddress,
  abi: leverageRouterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LeverageRouterV2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const leverageRouterV2Abi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_leverageManager',
        internalType: 'contract ILeverageManager',
        type: 'address',
      },
      { name: '_morpho', internalType: 'contract IMorpho', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'equityInCollateralAsset',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'convertEquityToCollateral',
    outputs: [{ name: 'collateral', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'leverageToken',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'collateralFromSender',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'flashLoanAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'minShares', internalType: 'uint256', type: 'uint256' },
      {
        name: 'swapCalls',
        internalType: 'struct ILeverageRouter.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'leverageManager',
    outputs: [{ name: '', internalType: 'contract ILeverageManager', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'morpho',
    outputs: [{ name: '', internalType: 'contract IMorpho', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'loanAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onMorphoFlashLoan',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      {
        name: 'collateralFromSender',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'previewDeposit',
    outputs: [
      {
        name: 'previewData',
        internalType: 'struct ActionData',
        type: 'tuple',
        components: [
          { name: 'collateral', internalType: 'uint256', type: 'uint256' },
          { name: 'debt', internalType: 'uint256', type: 'uint256' },
          { name: 'shares', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenFee', internalType: 'uint256', type: 'uint256' },
          { name: 'treasuryFee', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
      {
        name: 'minCollateralForSender',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'swapCalls',
        internalType: 'struct ILeverageRouter.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'token',
        internalType: 'contract ILeverageToken',
        type: 'address',
      },
      { name: 'shares', internalType: 'uint256', type: 'uint256' },
      {
        name: 'minCollateralForSender',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'veloraAdapter',
        internalType: 'contract IVeloraAdapter',
        type: 'address',
      },
      { name: 'augustus', internalType: 'address', type: 'address' },
      {
        name: 'offsets',
        internalType: 'struct IVeloraAdapter.Offsets',
        type: 'tuple',
        components: [
          { name: 'exactAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'limitAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'quotedAmount', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: 'swapData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'redeemWithVelora',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [
      { name: 'remainingCollateral', internalType: 'uint256', type: 'uint256' },
      {
        name: 'minCollateralForSender',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'CollateralSlippageTooHigh',
  },
  { type: 'error', inputs: [], name: 'FailedCall' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'available', internalType: 'uint256', type: 'uint256' },
      { name: 'required', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientCollateralForDeposit',
  },
  {
    type: 'error',
    inputs: [
      { name: 'actualCost', internalType: 'uint256', type: 'uint256' },
      { name: 'maxCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'MaxSwapCostExceeded',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'Unauthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LeverageToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const leverageTokenAbi = [
  { type: 'error', inputs: [], name: 'ECDSAInvalidSignature' },
  {
    type: 'error',
    inputs: [{ name: 'length', internalType: 'uint256', type: 'uint256' }],
    name: 'ECDSAInvalidSignatureLength',
  },
  {
    type: 'error',
    inputs: [{ name: 's', internalType: 'bytes32', type: 'bytes32' }],
    name: 'ECDSAInvalidSignatureS',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [{ name: 'deadline', internalType: 'uint256', type: 'uint256' }],
    name: 'ERC2612ExpiredSignature',
  },
  {
    type: 'error',
    inputs: [
      { name: 'signer', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC2612InvalidSigner',
  },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidAccountNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'LeverageTokenInitialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_symbol', internalType: 'string', type: 'string' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LeverageTokenFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const leverageTokenFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_implementation', internalType: 'address', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'BeaconInvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'Create2EmptyBytecode' },
  { type: 'error', inputs: [], name: 'FailedDeployment' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'InvalidAddress' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proxy',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
      {
        name: 'baseSalt',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'BeaconProxyCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'baseSalt', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'computeProxyAddress',
    outputs: [{ name: 'proxy', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'baseSalt', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'createProxy',
    outputs: [{ name: 'proxy', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'numProxies',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const leverageTokenFactoryAddress = {
  8453: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const leverageTokenFactoryConfig = {
  address: leverageTokenFactoryAddress,
  abi: leverageTokenFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SeamToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const seamTokenAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  { type: 'error', inputs: [], name: 'CheckpointUnorderedInsertion' },
  { type: 'error', inputs: [], name: 'ECDSAInvalidSignature' },
  {
    type: 'error',
    inputs: [{ name: 'length', internalType: 'uint256', type: 'uint256' }],
    name: 'ECDSAInvalidSignatureLength',
  },
  {
    type: 'error',
    inputs: [{ name: 's', internalType: 'bytes32', type: 'bytes32' }],
    name: 'ECDSAInvalidSignatureS',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  {
    type: 'error',
    inputs: [
      { name: 'increasedSupply', internalType: 'uint256', type: 'uint256' },
      { name: 'cap', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20ExceededSafeSupply',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [{ name: 'deadline', internalType: 'uint256', type: 'uint256' }],
    name: 'ERC2612ExpiredSignature',
  },
  {
    type: 'error',
    inputs: [
      { name: 'signer', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC2612InvalidSigner',
  },
  {
    type: 'error',
    inputs: [
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
      { name: 'clock', internalType: 'uint48', type: 'uint48' },
    ],
    name: 'ERC5805FutureLookup',
  },
  { type: 'error', inputs: [], name: 'ERC6372InconsistentClock' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidAccountNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [
      { name: 'bits', internalType: 'uint8', type: 'uint8' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'SafeCastOverflowedUintDowncast',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
  {
    type: 'error',
    inputs: [{ name: 'expiry', internalType: 'uint256', type: 'uint256' }],
    name: 'VotesExpiredSignature',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'fromDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'toDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'DelegateChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'previousVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DelegateVotesChanged',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  {
    type: 'function',
    inputs: [],
    name: 'CLOCK_MODE',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'pos', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'checkpoints',
    outputs: [
      {
        name: '',
        internalType: 'struct Checkpoints.Checkpoint208',
        type: 'tuple',
        components: [
          { name: '_key', internalType: 'uint48', type: 'uint48' },
          { name: '_value', internalType: 'uint208', type: 'uint208' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'clock',
    outputs: [{ name: '', internalType: 'uint48', type: 'uint48' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'delegatee', internalType: 'address', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'delegatee', internalType: 'address', type: 'address' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'expiry', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'delegateBySig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'timepoint', internalType: 'uint256', type: 'uint256' }],
    name: 'getPastTotalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getPastVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'intialSupply', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'numCheckpoints',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const seamTokenAddress = {
  8453: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const seamTokenConfig = {
  address: seamTokenAddress,
  abi: seamTokenAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useReadLeverageManager = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"previewMint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useReadLeverageManagerPreviewMint = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'previewMint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenCollateralAsset"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useReadLeverageManagerGetLeverageTokenCollateralAsset =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerAbi,
    address: leverageManagerAddress,
    functionName: 'getLeverageTokenCollateralAsset',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenDebtAsset"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useReadLeverageManagerGetLeverageTokenDebtAsset = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenDebtAsset',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenConfig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useReadLeverageManagerGetLeverageTokenConfig = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenState"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useReadLeverageManagerGetLeverageTokenState = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenState',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useWriteLeverageManager = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useWriteLeverageManagerMint = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useSimulateLeverageManager = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const useSimulateLeverageManagerMint = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const useReadLeverageManagerV2 = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"BASE_RATIO"`
 */
export const useReadLeverageManagerV2BaseRatio = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'BASE_RATIO',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const useReadLeverageManagerV2DefaultAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'DEFAULT_ADMIN_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"FEE_MANAGER_ROLE"`
 */
export const useReadLeverageManagerV2FeeManagerRole = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'FEE_MANAGER_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"UPGRADER_ROLE"`
 */
export const useReadLeverageManagerV2UpgraderRole = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'UPGRADER_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const useReadLeverageManagerV2UpgradeInterfaceVersion = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertCollateralToDebt"`
 */
export const useReadLeverageManagerV2ConvertCollateralToDebt = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertCollateralToDebt',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertCollateralToShares"`
 */
export const useReadLeverageManagerV2ConvertCollateralToShares =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'convertCollateralToShares',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertDebtToCollateral"`
 */
export const useReadLeverageManagerV2ConvertDebtToCollateral = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertDebtToCollateral',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertSharesToCollateral"`
 */
export const useReadLeverageManagerV2ConvertSharesToCollateral =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'convertSharesToCollateral',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertSharesToDebt"`
 */
export const useReadLeverageManagerV2ConvertSharesToDebt = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertSharesToDebt',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertToAssets"`
 */
export const useReadLeverageManagerV2ConvertToAssets = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertToAssets',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertToShares"`
 */
export const useReadLeverageManagerV2ConvertToShares = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertToShares',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getDefaultManagementFeeAtCreation"`
 */
export const useReadLeverageManagerV2GetDefaultManagementFeeAtCreation =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getDefaultManagementFeeAtCreation',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getFeeAdjustedTotalSupply"`
 */
export const useReadLeverageManagerV2GetFeeAdjustedTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getFeeAdjustedTotalSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLastManagementFeeAccrualTimestamp"`
 */
export const useReadLeverageManagerV2GetLastManagementFeeAccrualTimestamp =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLastManagementFeeAccrualTimestamp',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenActionFee"`
 */
export const useReadLeverageManagerV2GetLeverageTokenActionFee =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenActionFee',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenCollateralAsset"`
 */
export const useReadLeverageManagerV2GetLeverageTokenCollateralAsset =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenCollateralAsset',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenConfig"`
 */
export const useReadLeverageManagerV2GetLeverageTokenConfig = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenDebtAsset"`
 */
export const useReadLeverageManagerV2GetLeverageTokenDebtAsset =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenDebtAsset',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenFactory"`
 */
export const useReadLeverageManagerV2GetLeverageTokenFactory = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenFactory',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenInitialCollateralRatio"`
 */
export const useReadLeverageManagerV2GetLeverageTokenInitialCollateralRatio =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenInitialCollateralRatio',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenLendingAdapter"`
 */
export const useReadLeverageManagerV2GetLeverageTokenLendingAdapter =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenLendingAdapter',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenRebalanceAdapter"`
 */
export const useReadLeverageManagerV2GetLeverageTokenRebalanceAdapter =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenRebalanceAdapter',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenState"`
 */
export const useReadLeverageManagerV2GetLeverageTokenState = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenState',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getManagementFee"`
 */
export const useReadLeverageManagerV2GetManagementFee = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getManagementFee',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const useReadLeverageManagerV2GetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getTreasury"`
 */
export const useReadLeverageManagerV2GetTreasury = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getTreasury',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getTreasuryActionFee"`
 */
export const useReadLeverageManagerV2GetTreasuryActionFee = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getTreasuryActionFee',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"hasRole"`
 */
export const useReadLeverageManagerV2HasRole = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewDeposit"`
 */
export const useReadLeverageManagerV2PreviewDeposit = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewDeposit',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewMint"`
 */
export const useReadLeverageManagerV2PreviewMint = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewMint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewRedeem"`
 */
export const useReadLeverageManagerV2PreviewRedeem = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewRedeem',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewWithdraw"`
 */
export const useReadLeverageManagerV2PreviewWithdraw = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewWithdraw',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"proxiableUUID"`
 */
export const useReadLeverageManagerV2ProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadLeverageManagerV2SupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const useWriteLeverageManagerV2 = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"chargeManagementFee"`
 */
export const useWriteLeverageManagerV2ChargeManagementFee = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'chargeManagementFee',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"createNewLeverageToken"`
 */
export const useWriteLeverageManagerV2CreateNewLeverageToken = /*#__PURE__*/ createUseWriteContract(
  {
    abi: leverageManagerV2Abi,
    functionName: 'createNewLeverageToken',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"deposit"`
 */
export const useWriteLeverageManagerV2Deposit = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"grantRole"`
 */
export const useWriteLeverageManagerV2GrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"initialize"`
 */
export const useWriteLeverageManagerV2Initialize = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"mint"`
 */
export const useWriteLeverageManagerV2Mint = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"rebalance"`
 */
export const useWriteLeverageManagerV2Rebalance = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'rebalance',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"redeem"`
 */
export const useWriteLeverageManagerV2Redeem = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"renounceRole"`
 */
export const useWriteLeverageManagerV2RenounceRole = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"revokeRole"`
 */
export const useWriteLeverageManagerV2RevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setDefaultManagementFeeAtCreation"`
 */
export const useWriteLeverageManagerV2SetDefaultManagementFeeAtCreation =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageManagerV2Abi,
    functionName: 'setDefaultManagementFeeAtCreation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setManagementFee"`
 */
export const useWriteLeverageManagerV2SetManagementFee = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'setManagementFee',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasury"`
 */
export const useWriteLeverageManagerV2SetTreasury = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasury',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasuryActionFee"`
 */
export const useWriteLeverageManagerV2SetTreasuryActionFee = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasuryActionFee',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useWriteLeverageManagerV2UpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteLeverageManagerV2Withdraw = /*#__PURE__*/ createUseWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const useSimulateLeverageManagerV2 = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"chargeManagementFee"`
 */
export const useSimulateLeverageManagerV2ChargeManagementFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageManagerV2Abi,
    functionName: 'chargeManagementFee',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"createNewLeverageToken"`
 */
export const useSimulateLeverageManagerV2CreateNewLeverageToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageManagerV2Abi,
    functionName: 'createNewLeverageToken',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"deposit"`
 */
export const useSimulateLeverageManagerV2Deposit = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"grantRole"`
 */
export const useSimulateLeverageManagerV2GrantRole = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"initialize"`
 */
export const useSimulateLeverageManagerV2Initialize = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"mint"`
 */
export const useSimulateLeverageManagerV2Mint = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"rebalance"`
 */
export const useSimulateLeverageManagerV2Rebalance = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'rebalance',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"redeem"`
 */
export const useSimulateLeverageManagerV2Redeem = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"renounceRole"`
 */
export const useSimulateLeverageManagerV2RenounceRole = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"revokeRole"`
 */
export const useSimulateLeverageManagerV2RevokeRole = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setDefaultManagementFeeAtCreation"`
 */
export const useSimulateLeverageManagerV2SetDefaultManagementFeeAtCreation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageManagerV2Abi,
    functionName: 'setDefaultManagementFeeAtCreation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setManagementFee"`
 */
export const useSimulateLeverageManagerV2SetManagementFee = /*#__PURE__*/ createUseSimulateContract(
  {
    abi: leverageManagerV2Abi,
    functionName: 'setManagementFee',
  },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasury"`
 */
export const useSimulateLeverageManagerV2SetTreasury = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasury',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasuryActionFee"`
 */
export const useSimulateLeverageManagerV2SetTreasuryActionFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageManagerV2Abi,
    functionName: 'setTreasuryActionFee',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useSimulateLeverageManagerV2UpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract(
  {
    abi: leverageManagerV2Abi,
    functionName: 'upgradeToAndCall',
  },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateLeverageManagerV2Withdraw = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const useWatchLeverageManagerV2Event = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"DefaultManagementFeeAtCreationSet"`
 */
export const useWatchLeverageManagerV2DefaultManagementFeeAtCreationSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'DefaultManagementFeeAtCreationSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchLeverageManagerV2InitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"LeverageManagerInitialized"`
 */
export const useWatchLeverageManagerV2LeverageManagerInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'LeverageManagerInitialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"LeverageTokenActionFeeSet"`
 */
export const useWatchLeverageManagerV2LeverageTokenActionFeeSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'LeverageTokenActionFeeSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"LeverageTokenCreated"`
 */
export const useWatchLeverageManagerV2LeverageTokenCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'LeverageTokenCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"ManagementFeeCharged"`
 */
export const useWatchLeverageManagerV2ManagementFeeChargedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'ManagementFeeCharged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"ManagementFeeSet"`
 */
export const useWatchLeverageManagerV2ManagementFeeSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'ManagementFeeSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Mint"`
 */
export const useWatchLeverageManagerV2MintEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Mint',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Rebalance"`
 */
export const useWatchLeverageManagerV2RebalanceEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Rebalance',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Redeem"`
 */
export const useWatchLeverageManagerV2RedeemEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Redeem',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const useWatchLeverageManagerV2RoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"RoleGranted"`
 */
export const useWatchLeverageManagerV2RoleGrantedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'RoleGranted',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"RoleRevoked"`
 */
export const useWatchLeverageManagerV2RoleRevokedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'RoleRevoked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"TreasuryActionFeeSet"`
 */
export const useWatchLeverageManagerV2TreasuryActionFeeSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'TreasuryActionFeeSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"TreasurySet"`
 */
export const useWatchLeverageManagerV2TreasurySetEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'TreasurySet',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchLeverageManagerV2UpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useReadLeverageRouter = /*#__PURE__*/ createUseReadContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"leverageManager"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useReadLeverageRouterLeverageManager = /*#__PURE__*/ createUseReadContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'leverageManager',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useWriteLeverageRouter = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useWriteLeverageRouterMint = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"redeem"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useWriteLeverageRouterRedeem = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useSimulateLeverageRouter = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useSimulateLeverageRouterMint = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"redeem"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const useSimulateLeverageRouterRedeem = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterV2Abi}__
 */
export const useReadLeverageRouterV2 = /*#__PURE__*/ createUseReadContract({
  abi: leverageRouterV2Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"convertEquityToCollateral"`
 */
export const useReadLeverageRouterV2ConvertEquityToCollateral = /*#__PURE__*/ createUseReadContract(
  {
    abi: leverageRouterV2Abi,
    functionName: 'convertEquityToCollateral',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"leverageManager"`
 */
export const useReadLeverageRouterV2LeverageManager = /*#__PURE__*/ createUseReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'leverageManager',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"morpho"`
 */
export const useReadLeverageRouterV2Morpho = /*#__PURE__*/ createUseReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'morpho',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"previewDeposit"`
 */
export const useReadLeverageRouterV2PreviewDeposit = /*#__PURE__*/ createUseReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'previewDeposit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterV2Abi}__
 */
export const useWriteLeverageRouterV2 = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterV2Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const useWriteLeverageRouterV2Deposit = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"onMorphoFlashLoan"`
 */
export const useWriteLeverageRouterV2OnMorphoFlashLoan = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'onMorphoFlashLoan',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeem"`
 */
export const useWriteLeverageRouterV2Redeem = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeemWithVelora"`
 */
export const useWriteLeverageRouterV2RedeemWithVelora = /*#__PURE__*/ createUseWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeemWithVelora',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__
 */
export const useSimulateLeverageRouterV2 = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterV2Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const useSimulateLeverageRouterV2Deposit = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"onMorphoFlashLoan"`
 */
export const useSimulateLeverageRouterV2OnMorphoFlashLoan = /*#__PURE__*/ createUseSimulateContract(
  {
    abi: leverageRouterV2Abi,
    functionName: 'onMorphoFlashLoan',
  },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeem"`
 */
export const useSimulateLeverageRouterV2Redeem = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeemWithVelora"`
 */
export const useSimulateLeverageRouterV2RedeemWithVelora = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeemWithVelora',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useReadLeverageToken = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 */
export const useReadLeverageTokenDomainSeparator = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'DOMAIN_SEPARATOR',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadLeverageTokenAllowance = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadLeverageTokenBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadLeverageTokenDecimals = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"eip712Domain"`
 */
export const useReadLeverageTokenEip712Domain = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'eip712Domain',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"name"`
 */
export const useReadLeverageTokenName = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"nonces"`
 */
export const useReadLeverageTokenNonces = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"owner"`
 */
export const useReadLeverageTokenOwner = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadLeverageTokenSymbol = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadLeverageTokenTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useWriteLeverageToken = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteLeverageTokenApprove = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"burn"`
 */
export const useWriteLeverageTokenBurn = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'burn',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"initialize"`
 */
export const useWriteLeverageTokenInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"mint"`
 */
export const useWriteLeverageTokenMint = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"permit"`
 */
export const useWriteLeverageTokenPermit = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'permit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteLeverageTokenRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteLeverageTokenTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteLeverageTokenTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteLeverageTokenTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useSimulateLeverageToken = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateLeverageTokenApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"burn"`
 */
export const useSimulateLeverageTokenBurn = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'burn',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulateLeverageTokenInitialize = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"mint"`
 */
export const useSimulateLeverageTokenMint = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"permit"`
 */
export const useSimulateLeverageTokenPermit = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'permit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateLeverageTokenRenounceOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateLeverageTokenTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateLeverageTokenTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateLeverageTokenTransferOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useWatchLeverageTokenEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchLeverageTokenApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 */
export const useWatchLeverageTokenEip712DomainChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageTokenAbi,
    eventName: 'EIP712DomainChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchLeverageTokenInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"LeverageTokenInitialized"`
 */
export const useWatchLeverageTokenLeverageTokenInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageTokenAbi,
    eventName: 'LeverageTokenInitialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchLeverageTokenOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageTokenAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchLeverageTokenTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactory = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"computeProxyAddress"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryComputeProxyAddress = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'computeProxyAddress',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"implementation"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryImplementation = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'implementation',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"numProxies"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryNumProxies = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'numProxies',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryOwner = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactory = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"createProxy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryCreateProxy = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'createProxy',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactory = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"createProxy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactoryCreateProxy = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'createProxy',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactoryRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactoryTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactoryUpgradeTo = /*#__PURE__*/ createUseSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWatchLeverageTokenFactoryEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `eventName` set to `"BeaconProxyCreated"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWatchLeverageTokenFactoryBeaconProxyCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    eventName: 'BeaconProxyCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWatchLeverageTokenFactoryOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWatchLeverageTokenFactoryUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamToken = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"CLOCK_MODE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenClockMode = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'CLOCK_MODE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenDefaultAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'DEFAULT_ADMIN_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenDomainSeparator = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'DOMAIN_SEPARATOR',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"UPGRADER_ROLE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenUpgraderRole = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'UPGRADER_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenUpgradeInterfaceVersion = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenAllowance = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"checkpoints"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenCheckpoints = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'checkpoints',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"clock"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenClock = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'clock',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenDecimals = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegates"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenDelegates = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegates',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"eip712Domain"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenEip712Domain = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'eip712Domain',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getPastTotalSupply"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetPastTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getPastTotalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getPastVotes"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetPastVotes = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getPastVotes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getVotes"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetVotes = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getVotes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"hasRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenHasRole = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenName = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"nonces"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenNonces = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"numCheckpoints"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenNumCheckpoints = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'numCheckpoints',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenSupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenSymbol = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamToken = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenApprove = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenDelegate = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegate',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenDelegateBySig = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegateBySig',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenGrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenPermit = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenRenounceRole = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenRevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamToken = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenDelegate = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegate',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenDelegateBySig = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegateBySig',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenGrantRole = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenInitialize = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenPermit = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenRenounceRole = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenRevokeRole = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenUpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"DelegateChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenDelegateChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'DelegateChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"DelegateVotesChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenDelegateVotesChangedEvent = /*#__PURE__*/ createUseWatchContractEvent(
  {
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'DelegateVotesChanged',
  },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenEip712DomainChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'EIP712DomainChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenRoleAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'RoleAdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenRoleGrantedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'RoleGranted',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenRoleRevokedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'RoleRevoked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Upgraded',
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const readLeverageManager = /*#__PURE__*/ createReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"previewMint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const readLeverageManagerPreviewMint = /*#__PURE__*/ createReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'previewMint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenCollateralAsset"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const readLeverageManagerGetLeverageTokenCollateralAsset = /*#__PURE__*/ createReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenCollateralAsset',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenDebtAsset"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const readLeverageManagerGetLeverageTokenDebtAsset = /*#__PURE__*/ createReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenDebtAsset',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenConfig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const readLeverageManagerGetLeverageTokenConfig = /*#__PURE__*/ createReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"getLeverageTokenState"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const readLeverageManagerGetLeverageTokenState = /*#__PURE__*/ createReadContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'getLeverageTokenState',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const writeLeverageManager = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const writeLeverageManagerMint = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const simulateLeverageManager = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8)
 */
export const simulateLeverageManagerMint = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerAbi,
  address: leverageManagerAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const readLeverageManagerV2 = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"BASE_RATIO"`
 */
export const readLeverageManagerV2BaseRatio = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'BASE_RATIO',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const readLeverageManagerV2DefaultAdminRole = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'DEFAULT_ADMIN_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"FEE_MANAGER_ROLE"`
 */
export const readLeverageManagerV2FeeManagerRole = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'FEE_MANAGER_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"UPGRADER_ROLE"`
 */
export const readLeverageManagerV2UpgraderRole = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'UPGRADER_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const readLeverageManagerV2UpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertCollateralToDebt"`
 */
export const readLeverageManagerV2ConvertCollateralToDebt = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertCollateralToDebt',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertCollateralToShares"`
 */
export const readLeverageManagerV2ConvertCollateralToShares = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertCollateralToShares',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertDebtToCollateral"`
 */
export const readLeverageManagerV2ConvertDebtToCollateral = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertDebtToCollateral',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertSharesToCollateral"`
 */
export const readLeverageManagerV2ConvertSharesToCollateral = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertSharesToCollateral',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertSharesToDebt"`
 */
export const readLeverageManagerV2ConvertSharesToDebt = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertSharesToDebt',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertToAssets"`
 */
export const readLeverageManagerV2ConvertToAssets = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertToAssets',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"convertToShares"`
 */
export const readLeverageManagerV2ConvertToShares = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'convertToShares',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getDefaultManagementFeeAtCreation"`
 */
export const readLeverageManagerV2GetDefaultManagementFeeAtCreation =
  /*#__PURE__*/ createReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getDefaultManagementFeeAtCreation',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getFeeAdjustedTotalSupply"`
 */
export const readLeverageManagerV2GetFeeAdjustedTotalSupply = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getFeeAdjustedTotalSupply',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLastManagementFeeAccrualTimestamp"`
 */
export const readLeverageManagerV2GetLastManagementFeeAccrualTimestamp =
  /*#__PURE__*/ createReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLastManagementFeeAccrualTimestamp',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenActionFee"`
 */
export const readLeverageManagerV2GetLeverageTokenActionFee = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenActionFee',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenCollateralAsset"`
 */
export const readLeverageManagerV2GetLeverageTokenCollateralAsset =
  /*#__PURE__*/ createReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenCollateralAsset',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenConfig"`
 */
export const readLeverageManagerV2GetLeverageTokenConfig = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenDebtAsset"`
 */
export const readLeverageManagerV2GetLeverageTokenDebtAsset = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenDebtAsset',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenFactory"`
 */
export const readLeverageManagerV2GetLeverageTokenFactory = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenFactory',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenInitialCollateralRatio"`
 */
export const readLeverageManagerV2GetLeverageTokenInitialCollateralRatio =
  /*#__PURE__*/ createReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenInitialCollateralRatio',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenLendingAdapter"`
 */
export const readLeverageManagerV2GetLeverageTokenLendingAdapter = /*#__PURE__*/ createReadContract(
  {
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenLendingAdapter',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenRebalanceAdapter"`
 */
export const readLeverageManagerV2GetLeverageTokenRebalanceAdapter =
  /*#__PURE__*/ createReadContract({
    abi: leverageManagerV2Abi,
    functionName: 'getLeverageTokenRebalanceAdapter',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getLeverageTokenState"`
 */
export const readLeverageManagerV2GetLeverageTokenState = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getLeverageTokenState',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getManagementFee"`
 */
export const readLeverageManagerV2GetManagementFee = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getManagementFee',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const readLeverageManagerV2GetRoleAdmin = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getTreasury"`
 */
export const readLeverageManagerV2GetTreasury = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getTreasury',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"getTreasuryActionFee"`
 */
export const readLeverageManagerV2GetTreasuryActionFee = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'getTreasuryActionFee',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"hasRole"`
 */
export const readLeverageManagerV2HasRole = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewDeposit"`
 */
export const readLeverageManagerV2PreviewDeposit = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewDeposit',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewMint"`
 */
export const readLeverageManagerV2PreviewMint = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewMint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewRedeem"`
 */
export const readLeverageManagerV2PreviewRedeem = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewRedeem',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"previewWithdraw"`
 */
export const readLeverageManagerV2PreviewWithdraw = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'previewWithdraw',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readLeverageManagerV2ProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"supportsInterface"`
 */
export const readLeverageManagerV2SupportsInterface = /*#__PURE__*/ createReadContract({
  abi: leverageManagerV2Abi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const writeLeverageManagerV2 = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"chargeManagementFee"`
 */
export const writeLeverageManagerV2ChargeManagementFee = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'chargeManagementFee',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"createNewLeverageToken"`
 */
export const writeLeverageManagerV2CreateNewLeverageToken = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'createNewLeverageToken',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"deposit"`
 */
export const writeLeverageManagerV2Deposit = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"grantRole"`
 */
export const writeLeverageManagerV2GrantRole = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"initialize"`
 */
export const writeLeverageManagerV2Initialize = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"mint"`
 */
export const writeLeverageManagerV2Mint = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'mint',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"rebalance"`
 */
export const writeLeverageManagerV2Rebalance = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'rebalance',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"redeem"`
 */
export const writeLeverageManagerV2Redeem = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"renounceRole"`
 */
export const writeLeverageManagerV2RenounceRole = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"revokeRole"`
 */
export const writeLeverageManagerV2RevokeRole = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setDefaultManagementFeeAtCreation"`
 */
export const writeLeverageManagerV2SetDefaultManagementFeeAtCreation =
  /*#__PURE__*/ createWriteContract({
    abi: leverageManagerV2Abi,
    functionName: 'setDefaultManagementFeeAtCreation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setManagementFee"`
 */
export const writeLeverageManagerV2SetManagementFee = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'setManagementFee',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasury"`
 */
export const writeLeverageManagerV2SetTreasury = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasury',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasuryActionFee"`
 */
export const writeLeverageManagerV2SetTreasuryActionFee = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasuryActionFee',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeLeverageManagerV2UpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"withdraw"`
 */
export const writeLeverageManagerV2Withdraw = /*#__PURE__*/ createWriteContract({
  abi: leverageManagerV2Abi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const simulateLeverageManagerV2 = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"chargeManagementFee"`
 */
export const simulateLeverageManagerV2ChargeManagementFee = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'chargeManagementFee',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"createNewLeverageToken"`
 */
export const simulateLeverageManagerV2CreateNewLeverageToken = /*#__PURE__*/ createSimulateContract(
  {
    abi: leverageManagerV2Abi,
    functionName: 'createNewLeverageToken',
  },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"deposit"`
 */
export const simulateLeverageManagerV2Deposit = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"grantRole"`
 */
export const simulateLeverageManagerV2GrantRole = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"initialize"`
 */
export const simulateLeverageManagerV2Initialize = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"mint"`
 */
export const simulateLeverageManagerV2Mint = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'mint',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"rebalance"`
 */
export const simulateLeverageManagerV2Rebalance = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'rebalance',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"redeem"`
 */
export const simulateLeverageManagerV2Redeem = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"renounceRole"`
 */
export const simulateLeverageManagerV2RenounceRole = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"revokeRole"`
 */
export const simulateLeverageManagerV2RevokeRole = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setDefaultManagementFeeAtCreation"`
 */
export const simulateLeverageManagerV2SetDefaultManagementFeeAtCreation =
  /*#__PURE__*/ createSimulateContract({
    abi: leverageManagerV2Abi,
    functionName: 'setDefaultManagementFeeAtCreation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setManagementFee"`
 */
export const simulateLeverageManagerV2SetManagementFee = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'setManagementFee',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasury"`
 */
export const simulateLeverageManagerV2SetTreasury = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasury',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"setTreasuryActionFee"`
 */
export const simulateLeverageManagerV2SetTreasuryActionFee = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'setTreasuryActionFee',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const simulateLeverageManagerV2UpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `functionName` set to `"withdraw"`
 */
export const simulateLeverageManagerV2Withdraw = /*#__PURE__*/ createSimulateContract({
  abi: leverageManagerV2Abi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__
 */
export const watchLeverageManagerV2Event = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"DefaultManagementFeeAtCreationSet"`
 */
export const watchLeverageManagerV2DefaultManagementFeeAtCreationSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'DefaultManagementFeeAtCreationSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Initialized"`
 */
export const watchLeverageManagerV2InitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"LeverageManagerInitialized"`
 */
export const watchLeverageManagerV2LeverageManagerInitializedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'LeverageManagerInitialized',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"LeverageTokenActionFeeSet"`
 */
export const watchLeverageManagerV2LeverageTokenActionFeeSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'LeverageTokenActionFeeSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"LeverageTokenCreated"`
 */
export const watchLeverageManagerV2LeverageTokenCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'LeverageTokenCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"ManagementFeeCharged"`
 */
export const watchLeverageManagerV2ManagementFeeChargedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'ManagementFeeCharged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"ManagementFeeSet"`
 */
export const watchLeverageManagerV2ManagementFeeSetEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'ManagementFeeSet',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Mint"`
 */
export const watchLeverageManagerV2MintEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Mint',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Rebalance"`
 */
export const watchLeverageManagerV2RebalanceEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Rebalance',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Redeem"`
 */
export const watchLeverageManagerV2RedeemEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Redeem',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const watchLeverageManagerV2RoleAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'RoleAdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"RoleGranted"`
 */
export const watchLeverageManagerV2RoleGrantedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'RoleGranted',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"RoleRevoked"`
 */
export const watchLeverageManagerV2RoleRevokedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'RoleRevoked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"TreasuryActionFeeSet"`
 */
export const watchLeverageManagerV2TreasuryActionFeeSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageManagerV2Abi,
    eventName: 'TreasuryActionFeeSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"TreasurySet"`
 */
export const watchLeverageManagerV2TreasurySetEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'TreasurySet',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageManagerV2Abi}__ and `eventName` set to `"Upgraded"`
 */
export const watchLeverageManagerV2UpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageManagerV2Abi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const readLeverageRouter = /*#__PURE__*/ createReadContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"leverageManager"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const readLeverageRouterLeverageManager = /*#__PURE__*/ createReadContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'leverageManager',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const writeLeverageRouter = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const writeLeverageRouterMint = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"redeem"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const writeLeverageRouterRedeem = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'redeem',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const simulateLeverageRouter = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const simulateLeverageRouterMint = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterAbi}__ and `functionName` set to `"redeem"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xDbA92fC3dc10a17b96b6E807a908155C389A887C)
 */
export const simulateLeverageRouterRedeem = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterAbi,
  address: leverageRouterAddress,
  functionName: 'redeem',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterV2Abi}__
 */
export const readLeverageRouterV2 = /*#__PURE__*/ createReadContract({
  abi: leverageRouterV2Abi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"convertEquityToCollateral"`
 */
export const readLeverageRouterV2ConvertEquityToCollateral = /*#__PURE__*/ createReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'convertEquityToCollateral',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"leverageManager"`
 */
export const readLeverageRouterV2LeverageManager = /*#__PURE__*/ createReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'leverageManager',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"morpho"`
 */
export const readLeverageRouterV2Morpho = /*#__PURE__*/ createReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'morpho',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"previewDeposit"`
 */
export const readLeverageRouterV2PreviewDeposit = /*#__PURE__*/ createReadContract({
  abi: leverageRouterV2Abi,
  functionName: 'previewDeposit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterV2Abi}__
 */
export const writeLeverageRouterV2 = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterV2Abi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const writeLeverageRouterV2Deposit = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"onMorphoFlashLoan"`
 */
export const writeLeverageRouterV2OnMorphoFlashLoan = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'onMorphoFlashLoan',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeem"`
 */
export const writeLeverageRouterV2Redeem = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeemWithVelora"`
 */
export const writeLeverageRouterV2RedeemWithVelora = /*#__PURE__*/ createWriteContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeemWithVelora',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__
 */
export const simulateLeverageRouterV2 = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterV2Abi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"deposit"`
 */
export const simulateLeverageRouterV2Deposit = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"onMorphoFlashLoan"`
 */
export const simulateLeverageRouterV2OnMorphoFlashLoan = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'onMorphoFlashLoan',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeem"`
 */
export const simulateLeverageRouterV2Redeem = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageRouterV2Abi}__ and `functionName` set to `"redeemWithVelora"`
 */
export const simulateLeverageRouterV2RedeemWithVelora = /*#__PURE__*/ createSimulateContract({
  abi: leverageRouterV2Abi,
  functionName: 'redeemWithVelora',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const readLeverageToken = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 */
export const readLeverageTokenDomainSeparator = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'DOMAIN_SEPARATOR',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"allowance"`
 */
export const readLeverageTokenAllowance = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readLeverageTokenBalanceOf = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"decimals"`
 */
export const readLeverageTokenDecimals = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"eip712Domain"`
 */
export const readLeverageTokenEip712Domain = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'eip712Domain',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"name"`
 */
export const readLeverageTokenName = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"nonces"`
 */
export const readLeverageTokenNonces = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'nonces',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"owner"`
 */
export const readLeverageTokenOwner = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"symbol"`
 */
export const readLeverageTokenSymbol = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"totalSupply"`
 */
export const readLeverageTokenTotalSupply = /*#__PURE__*/ createReadContract({
  abi: leverageTokenAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const writeLeverageToken = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"approve"`
 */
export const writeLeverageTokenApprove = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"burn"`
 */
export const writeLeverageTokenBurn = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'burn',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"initialize"`
 */
export const writeLeverageTokenInitialize = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"mint"`
 */
export const writeLeverageTokenMint = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"permit"`
 */
export const writeLeverageTokenPermit = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'permit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const writeLeverageTokenRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const writeLeverageTokenTransfer = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const writeLeverageTokenTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const writeLeverageTokenTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const simulateLeverageToken = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"approve"`
 */
export const simulateLeverageTokenApprove = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"burn"`
 */
export const simulateLeverageTokenBurn = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'burn',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"initialize"`
 */
export const simulateLeverageTokenInitialize = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"mint"`
 */
export const simulateLeverageTokenMint = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"permit"`
 */
export const simulateLeverageTokenPermit = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'permit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const simulateLeverageTokenRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const simulateLeverageTokenTransfer = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const simulateLeverageTokenTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const simulateLeverageTokenTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenAbi,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const watchLeverageTokenEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Approval"`
 */
export const watchLeverageTokenApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 */
export const watchLeverageTokenEip712DomainChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'EIP712DomainChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchLeverageTokenInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"LeverageTokenInitialized"`
 */
export const watchLeverageTokenLeverageTokenInitializedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageTokenAbi,
    eventName: 'LeverageTokenInitialized',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const watchLeverageTokenOwnershipTransferredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'OwnershipTransferred',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Transfer"`
 */
export const watchLeverageTokenTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenAbi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const readLeverageTokenFactory = /*#__PURE__*/ createReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"computeProxyAddress"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const readLeverageTokenFactoryComputeProxyAddress = /*#__PURE__*/ createReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'computeProxyAddress',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"implementation"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const readLeverageTokenFactoryImplementation = /*#__PURE__*/ createReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'implementation',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"numProxies"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const readLeverageTokenFactoryNumProxies = /*#__PURE__*/ createReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'numProxies',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const readLeverageTokenFactoryOwner = /*#__PURE__*/ createReadContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const writeLeverageTokenFactory = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"createProxy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const writeLeverageTokenFactoryCreateProxy = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'createProxy',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const writeLeverageTokenFactoryRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const writeLeverageTokenFactoryTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const writeLeverageTokenFactoryUpgradeTo = /*#__PURE__*/ createWriteContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const simulateLeverageTokenFactory = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"createProxy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const simulateLeverageTokenFactoryCreateProxy = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'createProxy',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const simulateLeverageTokenFactoryRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const simulateLeverageTokenFactoryTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const simulateLeverageTokenFactoryUpgradeTo = /*#__PURE__*/ createSimulateContract({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const watchLeverageTokenFactoryEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `eventName` set to `"BeaconProxyCreated"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const watchLeverageTokenFactoryBeaconProxyCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    eventName: 'BeaconProxyCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const watchLeverageTokenFactoryOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const watchLeverageTokenFactoryUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: leverageTokenFactoryAbi,
  address: leverageTokenFactoryAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamToken = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"CLOCK_MODE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenClockMode = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'CLOCK_MODE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenDefaultAdminRole = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'DEFAULT_ADMIN_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenDomainSeparator = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'DOMAIN_SEPARATOR',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"UPGRADER_ROLE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenUpgraderRole = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'UPGRADER_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenAllowance = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenBalanceOf = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"checkpoints"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenCheckpoints = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'checkpoints',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"clock"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenClock = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'clock',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenDecimals = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegates"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenDelegates = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegates',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"eip712Domain"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenEip712Domain = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'eip712Domain',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getPastTotalSupply"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenGetPastTotalSupply = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getPastTotalSupply',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getPastVotes"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenGetPastVotes = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getPastVotes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenGetRoleAdmin = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getVotes"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenGetVotes = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'getVotes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"hasRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenHasRole = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenName = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"nonces"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenNonces = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"numCheckpoints"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenNumCheckpoints = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'numCheckpoints',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenSupportsInterface = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenSymbol = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const readSeamTokenTotalSupply = /*#__PURE__*/ createReadContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamToken = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenApprove = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenDelegate = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegate',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenDelegateBySig = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegateBySig',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenGrantRole = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenInitialize = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenPermit = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenRenounceRole = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenRevokeRole = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenTransfer = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const writeSeamTokenUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamToken = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenApprove = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenDelegate = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegate',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenDelegateBySig = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'delegateBySig',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenGrantRole = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenInitialize = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenPermit = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenRenounceRole = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenRevokeRole = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenTransfer = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const simulateSeamTokenUpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"DelegateChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenDelegateChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'DelegateChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"DelegateVotesChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenDelegateVotesChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'DelegateVotesChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenEip712DomainChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'EIP712DomainChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenRoleAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'RoleAdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenRoleGrantedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'RoleGranted',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenRoleRevokedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'RoleRevoked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const watchSeamTokenUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seamTokenAbi,
  address: seamTokenAddress,
  eventName: 'Upgraded',
})
