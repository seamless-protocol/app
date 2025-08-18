import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

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
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
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
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
    ],
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
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useReadLeverageToken = /*#__PURE__*/ createUseReadContract({
  abi: leverageTokenAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 */
export const useReadLeverageTokenDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenAbi,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadLeverageTokenAllowance =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenAbi,
    functionName: 'allowance',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadLeverageTokenBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenAbi,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadLeverageTokenDecimals = /*#__PURE__*/ createUseReadContract(
  { abi: leverageTokenAbi, functionName: 'decimals' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"eip712Domain"`
 */
export const useReadLeverageTokenEip712Domain =
  /*#__PURE__*/ createUseReadContract({
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
export const useReadLeverageTokenTotalSupply =
  /*#__PURE__*/ createUseReadContract({
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
export const useWriteLeverageTokenApprove =
  /*#__PURE__*/ createUseWriteContract({
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
export const useWriteLeverageTokenInitialize =
  /*#__PURE__*/ createUseWriteContract({
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
export const useWriteLeverageTokenPermit = /*#__PURE__*/ createUseWriteContract(
  { abi: leverageTokenAbi, functionName: 'permit' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteLeverageTokenRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteLeverageTokenTransfer =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenAbi,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteLeverageTokenTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteLeverageTokenTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useSimulateLeverageToken = /*#__PURE__*/ createUseSimulateContract(
  { abi: leverageTokenAbi },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateLeverageTokenApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"burn"`
 */
export const useSimulateLeverageTokenBurn =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'burn',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulateLeverageTokenInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"mint"`
 */
export const useSimulateLeverageTokenMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'mint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"permit"`
 */
export const useSimulateLeverageTokenPermit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'permit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateLeverageTokenRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateLeverageTokenTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateLeverageTokenTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateLeverageTokenTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__
 */
export const useWatchLeverageTokenEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: leverageTokenAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchLeverageTokenApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
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
export const useWatchLeverageTokenInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
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
export const useWatchLeverageTokenTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
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
export const useReadLeverageTokenFactoryComputeProxyAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'computeProxyAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"implementation"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryImplementation =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'implementation',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"numProxies"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryNumProxies =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'numProxies',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useReadLeverageTokenFactoryOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactory =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"createProxy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryCreateProxy =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'createProxy',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWriteLeverageTokenFactoryUpgradeTo =
  /*#__PURE__*/ createUseWriteContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactory =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link leverageTokenFactoryAbi}__ and `functionName` set to `"createProxy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useSimulateLeverageTokenFactoryCreateProxy =
  /*#__PURE__*/ createUseSimulateContract({
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
export const useSimulateLeverageTokenFactoryUpgradeTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: leverageTokenFactoryAbi,
    address: leverageTokenFactoryAddress,
    functionName: 'upgradeTo',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link leverageTokenFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xE0b2e40EDeb53B96C923381509a25a615c1Abe57)
 */
export const useWatchLeverageTokenFactoryEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
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
export const useWatchLeverageTokenFactoryUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
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
export const useReadSeamTokenDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"UPGRADER_ROLE"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenUpgraderRole = /*#__PURE__*/ createUseReadContract(
  {
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'UPGRADER_ROLE',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenUpgradeInterfaceVersion =
  /*#__PURE__*/ createUseReadContract({
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
export const useReadSeamTokenEip712Domain = /*#__PURE__*/ createUseReadContract(
  {
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'eip712Domain',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getPastTotalSupply"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetPastTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'getPastTotalSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getPastVotes"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetPastVotes = /*#__PURE__*/ createUseReadContract(
  {
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'getPastVotes',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenGetRoleAdmin = /*#__PURE__*/ createUseReadContract(
  {
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'getRoleAdmin',
  },
)

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
export const useReadSeamTokenNumCheckpoints =
  /*#__PURE__*/ createUseReadContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'numCheckpoints',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenProxiableUuid =
  /*#__PURE__*/ createUseReadContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'proxiableUUID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useReadSeamTokenSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
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
export const useWriteSeamTokenDelegateBySig =
  /*#__PURE__*/ createUseWriteContract({
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
export const useWriteSeamTokenInitialize = /*#__PURE__*/ createUseWriteContract(
  { abi: seamTokenAbi, address: seamTokenAddress, functionName: 'initialize' },
)

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
export const useWriteSeamTokenRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenRevokeRole = /*#__PURE__*/ createUseWriteContract(
  { abi: seamTokenAbi, address: seamTokenAddress, functionName: 'revokeRole' },
)

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
export const useWriteSeamTokenTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWriteSeamTokenUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
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
export const useSimulateSeamTokenApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegate"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenDelegate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'delegate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"delegateBySig"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenDelegateBySig =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'delegateBySig',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenPermit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'permit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seamTokenAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useSimulateSeamTokenUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: seamTokenAbi, address: seamTokenAddress },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"DelegateChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenDelegateChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'DelegateChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"DelegateVotesChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenDelegateVotesChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'DelegateVotesChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenEip712DomainChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'EIP712DomainChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seamTokenAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85)
 */
export const useWatchSeamTokenUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seamTokenAbi,
    address: seamTokenAddress,
    eventName: 'Upgraded',
  })
