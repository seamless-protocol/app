import { type Address, parseEther, parseUnits } from 'viem'

/** Test constants for integration tests */
export const TEST_CONSTANTS = {
  /** Known weETH whale address with substantial balance */
  WHALE_ADDRESS: '0x566d2176Ecb1d8eA07D182b47B5aC57511337E00' as Address,
  
  /** EtherFi L2ModeSyncPool address on Base */
  ETHERFI_POOL: '0xc38e046dFDAdf15f7F56853674242888301208a5' as Address,
  
  /** Test amounts */
  AMOUNTS: {
    /** Gas funding amount */
    GAS_FUNDING: parseEther('10'),
    /** Test equity amount (1 weETH) */
    EQUITY: parseUnits('1', 18),
    /** Max swap cost (5% of equity) */
    MAX_SWAP_COST_BPS: 500n, // 5%
    /** Slippage tolerance (1%) */  
    SLIPPAGE_BPS: 100n, // 1%
  },
  
  /** Tenderly funding amount (100 ETH) */
  TENDERLY_BALANCE: '0x56bc75e2d630e8000',
} as const

/** Calculate derived values */
export function calculateMintParams(equityAmount: bigint) {
  const maxSwapCost = (equityAmount * TEST_CONSTANTS.AMOUNTS.MAX_SWAP_COST_BPS) / 10000n
  const amountAfterSwapCost = equityAmount - maxSwapCost
  
  return {
    maxSwapCost,
    amountAfterSwapCost,
  }
}

export function calculateMinShares(expectedShares: bigint, slippageBps = TEST_CONSTANTS.AMOUNTS.SLIPPAGE_BPS) {
  return (expectedShares * (10000n - slippageBps)) / 10000n
}