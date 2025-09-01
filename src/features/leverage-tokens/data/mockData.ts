import { Building2, Coins, Globe, TrendingUp } from 'lucide-react'
import type { Address } from 'viem'
import type { FAQItem } from '@/components/FAQ'
import { EthereumLogo } from '@/components/icons/logos'
import type { PriceDataPoint } from '@/components/ui/price-line-chart'
import type { LeverageTokenMetrics } from '../components/LeverageTokenDetailedMetrics'

// Define ResourceItem interface locally since it's not exported
interface ResourceItem {
  id: string
  title: string
  description: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge: {
    text: string
    color:
      | 'amber'
      | 'blue'
      | 'emerald'
      | 'purple'
      | 'red'
      | 'green'
      | 'yellow'
      | 'indigo'
      | 'pink'
      | 'gray'
  }
  highlight?: boolean
}

// Mock leverage token data based on Figma design
export const mockLeverageTokenData = {
  // Basic token info
  token: {
    address: '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address,
    name: 'weETH / WETH 17x Leverage Token',
    symbol: 'WEETH-WETH-17x',
    decimals: 18,
    underlying: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, // WETH
    leverageRatio: 17,
    totalSupply: BigInt('1000000000000000000000'), // 1000 tokens
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
  },

  // Price and market data
  price: {
    current: BigInt('2500000000000000000'), // $2.50 per token
    change24h: 0.05, // +5%
    change7d: -0.02, // -2%
    marketCap: 2500000, // $2.5M
    volume24h: 125000, // $125K
  },

  // User position (if connected)
  userPosition: {
    hasPosition: true,
    balance: '1,250.00',
    balanceUSD: '$3,125.00',
    allTimePercentage: '+12.5%',
    shareToken: 'WEETH-WETH-17x',
    entryPrice: BigInt('2200000000000000000'), // $2.20
    currentPrice: BigInt('2500000000000000000'), // $2.50
    pnl: BigInt('375000000000000000'), // $375 profit
    pnlPercentage: 12.5,
  },

  // Supply and capacity
  supply: {
    currentSupply: 850000, // 850K tokens
    supplyCap: 1000000, // 1M tokens
    utilizationRate: 85, // 85%
    isNearCapacity: false,
  },

  // APY and rewards
  apy: {
    total: 15.2,
    baseYield: 8.5,
    borrowRate: -3.2,
    rewardMultiplier: 1.5,
    pointsPerDay: 1250,
  },

  // Risk metrics
  risk: {
    liquidationThreshold: 0.85,
    healthFactor: 1.18,
    maxLeverage: 17,
    rebalanceThreshold: 0.05,
  },

  // Key metrics for the main dashboard
  keyMetrics: {
    tvl: 1800000, // $1.80M
    totalCollateral: {
      amount: 42860, // 42.86K weETH
      amountUSD: 106750000, // ~$106.75M
    },
    targetLeverage: {
      target: 17.0,
      current: 17,
    },
  },

  // Rebalancing info
  rebalancing: {
    lastRebalance: Date.now() - 86400000, // 1 day ago
    nextRebalance: Date.now() + 172800000, // 2 days from now
    isRebalancing: false,
    currentRatio: 16.8,
    targetRatio: 17.0,
    thresholdBreached: false,
  },
}

// Detailed metrics for the collapsible section
export const mockDetailedMetrics: LeverageTokenMetrics = {
  'Leverage Settings': [
    {
      label: 'Target Leverage',
      value: '17.00x',
      highlight: true,
      color: 'text-white',
      tooltip: 'The target leverage ratio for this token.',
    },
    {
      label: 'Min - Max Leverage',
      value: '16.90x - 17.30x',
      color: 'text-white',
      tooltip: 'The minimum and maximum leverage range allowed.',
    },
  ],
  Fees: [
    {
      label: 'Mint Token Fee',
      value: '0.00%',
      highlight: true,
      color: 'text-green-400',
      tooltip: 'Fee charged when minting new leverage tokens.',
    },
    {
      label: 'Redeem Token Fee',
      value: '0.10%',
      color: 'text-white',
      tooltip: 'Fee charged when redeeming leverage tokens.',
    },
  ],
  'Auction Parameters': [
    {
      label: 'Dutch Auction Duration',
      value: '1 hour',
      color: 'text-white',
      tooltip: 'Duration of the Dutch auction for token redemptions.',
    },
    {
      label: 'Initial Price Multiplier',
      value: '1.01x',
      color: 'text-white',
      tooltip: 'Initial price multiplier for the auction.',
    },
    {
      label: 'Min Price Multiplier',
      value: '0.99x',
      color: 'text-white',
      tooltip: 'Minimum price multiplier for the auction.',
    },
  ],
  'Risk Management': [
    {
      label: 'Pre-liquidation Leverage',
      value: '17.50x',
      color: 'text-white',
      tooltip: 'Leverage threshold before liquidation is triggered.',
    },
    {
      label: 'Rebalance Reward',
      value: '0.50%',
      color: 'text-white',
      tooltip: 'Reward percentage for successful rebalancing.',
    },
  ],
}

// Related resources data
export const mockRelatedResources = {
  underlyingPlatforms: [
    {
      id: 'morpho-lending',
      title: 'Morpho Lending Market',
      description: 'View the underlying lending market powering this leverage token',
      url: 'https://app.morpho.org/market?id=0x123...',
      icon: Building2,
      badge: {
        text: 'Primary Market',
        color: 'amber' as const,
      },
      highlight: true,
    },
    {
      id: 'etherfi-protocol',
      title: 'Ether.fi Protocol',
      description: 'Learn more about the weETH liquid staking token',
      url: 'https://ether.fi/',
      icon: Globe,
      badge: {
        text: 'Protocol Info',
        color: 'blue' as const,
      },
    },
  ],
  additionalRewards: [
    {
      id: 'etherfi-points',
      title: 'Ether.fi Points',
      description: 'Track your points and rewards from weETH staking activity',
      url: 'https://ether.fi/points',
      icon: Coins,
      badge: {
        text: 'Rewards Program',
        color: 'emerald' as const,
      },
      highlight: true,
    },
    {
      id: 'merkl-rewards',
      title: 'Merkl Rewards',
      description: 'Additional DeFi rewards and incentive tracking',
      url: 'https://merkl.xyz/',
      icon: TrendingUp,
      badge: {
        text: 'Incentives',
        color: 'purple' as const,
      },
    },
  ],
} satisfies {
  underlyingPlatforms: Array<ResourceItem>
  additionalRewards: Array<ResourceItem>
}

// Price history data generation
export const generatePriceHistory = (selectedTimeframe: string): Array<PriceDataPoint> => {
  const data: Array<PriceDataPoint> = []
  const now = Date.now()
  const days =
    selectedTimeframe === '1H'
      ? 1
      : selectedTimeframe === '1D'
        ? 7
        : selectedTimeframe === '1W'
          ? 30
          : selectedTimeframe === '1M'
            ? 90
            : 365
  const interval = selectedTimeframe === '1H' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 1 hour or 1 day

  let basePrice = 2.5
  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * interval
    const date = new Date(timestamp)

    // Add some realistic price movement
    const volatility = 0.05
    const change = (Math.random() - 0.5) * volatility
    basePrice = Math.max(0.1, basePrice + change)

    data.push({
      date: date.toISOString(),
      price: basePrice,
      weethPrice: basePrice * 0.8 + Math.random() * 0.4, // weETH price variation
      leverageTokenPrice: basePrice,
    })
  }
  return data
}

// FAQ data for leverage tokens
export const mockFAQData: Array<FAQItem> = [
  {
    id: 'how-leverage-token-works',
    question: 'How does this Leverage Token work?',
    answer:
      'This 17x leverage token amplifies the performance difference between weETH and WETH, allowing traders to benefit from relative price movements with enhanced returns. The token automatically rebalances to maintain the target leverage ratio.',
  },
  {
    id: 'risks',
    question: 'What are the risks involved?',
    answer:
      'Leverage tokens carry amplified risks including higher volatility, potential for significant losses during adverse price movements, rebalancing costs, and smart contract risks. The 17x leverage means small price movements are magnified significantly.',
  },
]

// Export all mock data
export const leverageTokenPageData = {
  ...mockLeverageTokenData,
  detailedMetrics: mockDetailedMetrics,
  relatedResources: mockRelatedResources,
  faqData: mockFAQData,
}
