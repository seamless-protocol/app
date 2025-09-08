// Mock user position data
export const mockUserPosition = {
  hasPosition: true,
  balance: '1,250.00',
  balanceUSD: '$3,125.00',
  allTimePercentage: '+12.5%',
  shareToken: 'WEETH-WETH-17x', // This will be overridden with actual token symbol
  entryPrice: BigInt('2200000000000000000'), // $2.20
  currentPrice: BigInt('2500000000000000000'), // $2.50
  pnl: BigInt('375000000000000000'), // $375 profit
  pnlPercentage: 12.5,
}

// Mock key metrics data
export const mockKeyMetrics = {
  tvl: 1800000, // $1.80M
  totalCollateral: {
    amount: 42860, // 42.86K weETH
    amountUSD: 106750000, // ~$106.75M
  },
  targetLeverage: {
    target: 17.0,
    current: 17,
  },
}

// Mock supply data
export const mockSupply = {
  currentSupply: 850000, // 850K tokens
  supplyCap: 1000000, // 1M tokens
  utilizationRate: 85, // 85%
  isNearCapacity: false,
}

// Helper function to create user position with token-specific data
export function createMockUserPosition(tokenSymbol: string) {
  return {
    ...mockUserPosition,
    shareToken: tokenSymbol,
  }
}
