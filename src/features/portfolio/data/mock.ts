import type { Position } from '../components/active-positions'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'

// Mock portfolio positions data
export const mockPositions: Array<Position> = [
  {
    id: '1',
    name: 'Seamless USDC Vault',
    type: 'vault',
    token: 'USDC',
    riskLevel: 'low',
    currentValue: {
      amount: '25,618.45',
      symbol: 'USDC',
      usdValue: '$25,618.45',
    },
    unrealizedGain: {
      amount: '618.45',
      symbol: 'USDC',
      percentage: '+2.47%',
    },
    apy: '12.34%',
  },
  {
    id: '2',
    name: 'Seamless WETH Vault',
    type: 'vault',
    token: 'WETH',
    riskLevel: 'medium',
    currentValue: {
      amount: '8.72',
      symbol: 'WETH',
      usdValue: '$21,276.80',
    },
    unrealizedGain: {
      amount: '0.22',
      symbol: 'WETH',
      percentage: '+2.59%',
    },
    apy: '8.92%',
  },
  {
    id: '3',
    name: 'weETH / WETH 17x Leverage Token',
    type: 'leverage-token',
    token: 'weETH',
    riskLevel: 'high',
    currentValue: {
      amount: '6.12',
      symbol: 'weETH',
      usdValue: '$14,932.80',
    },
    unrealizedGain: {
      amount: '0.62',
      symbol: 'weETH',
      percentage: '+11.27%',
    },
    apy: '18.67%',
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether.fi ETH',
    },
    debtAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
    },
  },
]

// Mock portfolio performance data
export const mockPortfolioData: Array<PortfolioDataPoint> = [
  { date: 'Jan 1', value: 58000, earnings: 1200 },
  { date: 'Jan 2', value: 58200, earnings: 1250 },
  { date: 'Jan 3', value: 58500, earnings: 1300 },
  { date: 'Jan 4', value: 58300, earnings: 1350 },
  { date: 'Jan 5', value: 58700, earnings: 1400 },
  { date: 'Jan 6', value: 59000, earnings: 1450 },
  { date: 'Jan 7', value: 59200, earnings: 1500 },
  { date: 'Jan 8', value: 59500, earnings: 1550 },
  { date: 'Jan 9', value: 59800, earnings: 1600 },
  { date: 'Jan 10', value: 60100, earnings: 1650 },
  { date: 'Jan 11', value: 60400, earnings: 1700 },
  { date: 'Jan 12', value: 60700, earnings: 1750 },
  { date: 'Jan 13', value: 61000, earnings: 1800 },
  { date: 'Jan 14', value: 61200, earnings: 1850 },
  { date: 'Jan 15', value: 61500, earnings: 1900 },
  { date: 'Jan 16', value: 61800, earnings: 1950 },
  { date: 'Jan 17', value: 62000, earnings: 2000 },
  { date: 'Jan 18', value: 62200, earnings: 2050 },
  { date: 'Jan 19', value: 62500, earnings: 2100 },
  { date: 'Jan 20', value: 62800, earnings: 2150 },
  { date: 'Jan 21', value: 63000, earnings: 2200 },
  { date: 'Jan 22', value: 63200, earnings: 2250 },
  { date: 'Jan 23', value: 63500, earnings: 2300 },
  { date: 'Jan 24', value: 63800, earnings: 2350 },
  { date: 'Jan 25', value: 64000, earnings: 2400 },
  { date: 'Jan 26', value: 64200, earnings: 2450 },
  { date: 'Jan 27', value: 64500, earnings: 2500 },
  { date: 'Jan 28', value: 64800, earnings: 2550 },
  { date: 'Jan 29', value: 65000, earnings: 2600 },
  { date: 'Jan 30', value: 61829, earnings: 2650 },
]

// Mock portfolio summary data
export const mockPortfolioSummary = {
  totalValue: 61829,
  totalEarnings: 2650,
  activePositions: 3,
  changeAmount: 1829,
  changePercent: 3.05,
  averageAPY: 13.31, // This will be calculated from positions: (12.34 + 8.92 + 18.67) / 3
}

// Mock rewards data
export const mockRewardsData = {
  accruingAmount: '$1,294.34',
  seamToken: '247.83',
  protocolFees: '$156.42',
  tokenAddresses: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x4200000000000000000000000000000000000006', // WETH
    '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee', // weETH
    '0x1c7a460413dd4e964f96d8dcc56d0c1e3b4434c1', // SEAM
  ],
}

// Mock staking data
export const mockStakingData = {
  stakedAmount: '1,247.83',
  earnedRewards: '82.34',
  apy: '15.67',
  hasStakingPosition: true,
  availableToStake: '247.83',
}
