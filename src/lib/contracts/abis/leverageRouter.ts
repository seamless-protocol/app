// Minimal LeverageRouter ABI slice (Base mainnet)
// Source: seamless-interface generated.ts on Base

export const leverageRouterAbi = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'leverageManager',
    inputs: [],
    outputs: [{ name: '', internalType: 'contract ILeverageManager', type: 'address' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'mint',
    inputs: [
      { name: 'token', internalType: 'contract ILeverageToken', type: 'address' },
      { name: 'equityInCollateralAsset', internalType: 'uint256', type: 'uint256' },
      { name: 'minShares', internalType: 'uint256', type: 'uint256' },
      { name: 'maxSwapCostInCollateralAsset', internalType: 'uint256', type: 'uint256' },
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
              { name: 'aerodromeRouter', internalType: 'address', type: 'address' },
              { name: 'aerodromePoolFactory', internalType: 'address', type: 'address' },
              { name: 'aerodromeSlipstreamRouter', internalType: 'address', type: 'address' },
              { name: 'uniswapSwapRouter02', internalType: 'address', type: 'address' },
              { name: 'uniswapV2Router02', internalType: 'address', type: 'address' },
            ],
          },
          { name: 'additionalData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'redeem',
    inputs: [
      { name: 'token', internalType: 'contract ILeverageToken', type: 'address' },
      { name: 'equityInCollateralAsset', internalType: 'uint256', type: 'uint256' },
      { name: 'maxShares', internalType: 'uint256', type: 'uint256' },
      { name: 'maxSwapCostInCollateralAsset', internalType: 'uint256', type: 'uint256' },
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
              { name: 'aerodromeRouter', internalType: 'address', type: 'address' },
              { name: 'aerodromePoolFactory', internalType: 'address', type: 'address' },
              { name: 'aerodromeSlipstreamRouter', internalType: 'address', type: 'address' },
              { name: 'uniswapSwapRouter02', internalType: 'address', type: 'address' },
              { name: 'uniswapV2Router02', internalType: 'address', type: 'address' },
            ],
          },
          { name: 'additionalData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
] as const
