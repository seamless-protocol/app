"use client"

import { 
  USDCLogo, 
  EthereumLogo, 
  cbBTCLogo, 
  weETHLogo, 
  stETHLogo, 
  BitcoinLogo, 
  rETHLogo, 
  DAILogo, 
  cbETHLogo, 
  wstETHLogo, 
  GHOLogo,
  SEAMLogo
} from "../ui/crypto-logos"
import BaseLogo from "../../imports/BaseLogo"

export interface Asset {
  symbol: string
  name: string
  logo: React.ComponentType<any> | string // Allow both component and string for backwards compatibility
  balance?: string
  price?: number
}

export interface RiskMetrics {
  marketRisk: string
  smartContractRisk: string
  liquidityRisk: string
  impermanentLoss: string
}

export interface Fees {
  managementFee: number
  performanceFee: number
  depositFee: number
  withdrawalFee: number
}

export interface Metrics {
  utilization: number
  participants: number
  averagePosition: number
  successRate: number
}

export interface RewardInfo {
  types: string[]
  tokens: string[]
  description: string
}

export interface CuratorInfo {
  name: string
  logo: React.ComponentType<any> | string
  description: string
  website?: string
}

export interface CollateralInfo {
  type: string
  assets: string[]
  description: string
}

export interface LeverageTokenInfo {
  symbol: string
  leverageAmount: number
  collateralAsset: Asset
  debtAsset: Asset
  supplyCap: number
  currentSupply: number
  chain: {
    id: string
    name: string
    logo: React.ComponentType<any> | string
  }
  apyBreakdown: {
    baseYield: number
    leverageMultiplier: number
    borrowCost: number
    netAPY: number
  }
}

export interface Strategy {
  id: string
  name: string
  description: string
  longDescription: string
  category: string
  apy: number
  tvl: number
  assets: Asset[]
  riskLevel: string
  riskMetrics: RiskMetrics
  fees: Fees
  metrics: Metrics
  launchDate: string
  isActive: boolean
  minDeposit: number
  maxDeposit?: number
  lockPeriod?: number
  tags: string[]
  // Chain information for all strategies
  chain: {
    id: string
    name: string
    logo: React.ComponentType<any> | string
  }
  // New fields for vault information
  curator?: CuratorInfo
  collateral?: CollateralInfo
  rewards?: RewardInfo
  // New field for leverage token information
  leverageToken?: LeverageTokenInfo
}

// Mock strategy data
const mockStrategies: Strategy[] = [
  // Vault Strategies
  {
    id: 'seamless-usdc-vault',
    name: 'Seamless USDC Vault',
    description: 'Earn stable yields on USDC through optimized lending strategies',
    longDescription: 'The Seamless USDC Vault employs sophisticated yield optimization strategies across multiple DeFi protocols to maximize returns on USDC deposits. Our automated rebalancing ensures optimal allocation while maintaining low risk exposure.',
    category: 'Vaults',
    apy: 12.34,
    tvl: 45200000,
    assets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'Low',
    riskMetrics: {
      marketRisk: 'Low',
      smartContractRisk: 'Low',
      liquidityRisk: 'Very Low',
      impermanentLoss: 'None'
    },
    fees: {
      managementFee: 2.0,
      performanceFee: 10.0,
      depositFee: 0.0,
      withdrawalFee: 0.1
    },
    metrics: {
      utilization: 87.3,
      participants: 2847,
      averagePosition: 15890.34,
      successRate: 98.7
    },
    launchDate: '2023-08-15',
    isActive: true,
    minDeposit: 100,
    maxDeposit: 1000000,
    tags: ['Stable', 'Low Risk', 'USDC'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    curator: {
      name: 'Gauntlet',
      logo: '🛡️',
      description: 'Leading DeFi risk management and optimization platform',
      website: 'https://gauntlet.network'
    },
    collateral: {
      type: 'Stablecoin',
      assets: ['USDC'],
      description: 'Fully collateralized by USDC deposits'
    },
    rewards: {
      types: ['Lending Yield', 'Protocol Rewards'],
      tokens: ['USDC', 'SEAM'],
      description: 'Earn lending yield plus SEAM protocol rewards'
    }
  },
  {
    id: 'seamless-weth-vault',
    name: 'Seamless WETH Vault',
    description: 'Generate yield on ETH through advanced DeFi strategies',
    longDescription: 'The Seamless WETH Vault leverages multiple yield-generating opportunities in the Ethereum ecosystem, including lending, staking rewards, and MEV capture strategies to maximize returns on ETH holdings.',
    category: 'Vaults',
    apy: 8.92,
    tvl: 28700000,
    assets: [
      {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        logo: EthereumLogo
      }
    ],
    riskLevel: 'Medium',
    riskMetrics: {
      marketRisk: 'Medium',
      smartContractRisk: 'Low',
      liquidityRisk: 'Low',
      impermanentLoss: 'None'
    },
    fees: {
      managementFee: 2.0,
      performanceFee: 15.0,
      depositFee: 0.0,
      withdrawalFee: 0.1
    },
    metrics: {
      utilization: 92.1,
      participants: 1743,
      averagePosition: 16472.85,
      successRate: 97.2
    },
    launchDate: '2023-09-01',
    isActive: true,
    minDeposit: 0.1,
    maxDeposit: 100,
    tags: ['ETH', 'Medium Risk', 'Staking'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    curator: {
      name: 'Gauntlet',
      logo: '🛡️',
      description: 'Leading DeFi risk management and optimization platform',
      website: 'https://gauntlet.network'
    },
    collateral: {
      type: 'ETH Asset',
      assets: ['WETH'],
      description: 'Backed by Wrapped Ethereum deposits'
    },
    rewards: {
      types: ['Staking Rewards', 'Lending Yield', 'MEV Capture'],
      tokens: ['ETH', 'SEAM'],
      description: 'Earn ETH staking rewards, lending yield, and MEV capture plus SEAM tokens'
    }
  },
  {
    id: 'seamless-cbbtc-vault',
    name: 'Seamless cbBTC Vault',
    description: 'Earn yield on Bitcoin through wrapped BTC strategies',
    longDescription: 'The Seamless cbBTC Vault provides exposure to Bitcoin yield opportunities through Coinbase Wrapped BTC, utilizing lending protocols and Bitcoin-denominated yield strategies while maintaining custody through trusted infrastructure.',
    category: 'Vaults',
    apy: 10.56,
    tvl: 22100000,
    assets: [
      {
        symbol: 'cbBTC',
        name: 'Coinbase Wrapped BTC',
        logo: cbBTCLogo
      }
    ],
    riskLevel: 'Medium',
    riskMetrics: {
      marketRisk: 'Medium',
      smartContractRisk: 'Low',
      liquidityRisk: 'Medium',
      impermanentLoss: 'None'
    },
    fees: {
      managementFee: 2.5,
      performanceFee: 15.0,
      depositFee: 0.0,
      withdrawalFee: 0.2
    },
    metrics: {
      utilization: 78.9,
      participants: 892,
      averagePosition: 24775.42,
      successRate: 96.8
    },
    launchDate: '2023-10-10',
    isActive: true,
    minDeposit: 0.01,
    maxDeposit: 10,
    tags: ['Bitcoin', 'cbBTC', 'Medium Risk'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    curator: {
      name: 'Gauntlet',
      logo: '🛡️',
      description: 'Leading DeFi risk management and optimization platform',
      website: 'https://gauntlet.network'
    },
    collateral: {
      type: 'Bitcoin Asset',
      assets: ['cbBTC'],
      description: 'Secured by Coinbase Wrapped Bitcoin'
    },
    rewards: {
      types: ['Lending Yield', 'Bitcoin Rewards'],
      tokens: ['BTC', 'SEAM'],
      description: 'Earn Bitcoin-denominated lending yield plus SEAM protocol rewards'
    }
  },
  // Leverage Token Strategies
  {
    id: 'weeth-weth-17x-leverage',
    name: 'weETH / WETH 17x Leverage Token',
    description: 'Amplified exposure to weETH/WETH price performance with 17x leverage',
    longDescription: 'The weETH / WETH 17x Leverage Token provides sophisticated traders with amplified exposure to the relative performance between weETH and WETH. This product automatically manages leverage through advanced rebalancing mechanisms while targeting a 17x leverage ratio.',
    category: 'Leverage Tokens',
    apy: 18.67,
    tvl: 8900000,
    assets: [
      {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        logo: weETHLogo
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        logo: EthereumLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'Very High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'High',
      impermanentLoss: 'Very High'
    },
    fees: {
      managementFee: 3.0,
      performanceFee: 20.0,
      depositFee: 0.1,
      withdrawalFee: 0.2
    },
    metrics: {
      utilization: 95.4,
      participants: 456,
      averagePosition: 19517.86,
      successRate: 94.1
    },
    launchDate: '2023-11-15',
    isActive: true,
    minDeposit: 0.01,
    maxDeposit: 50,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'weETH', 'Advanced'],
    leverageToken: {
      symbol: 'weETH17x',
      leverageAmount: 17,
      collateralAsset: {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        logo: weETHLogo
      },
      debtAsset: {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        logo: EthereumLogo
      },
      supplyCap: 10000,
      currentSupply: 9650,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 4.2,
        leverageMultiplier: 17,
        borrowCost: 2.8,
        netAPY: 18.67
      }
    }
  },
  {
    id: 'steth-eth-12x-leverage',
    name: 'stETH / ETH 12x Leverage Token',
    description: 'Leveraged exposure to stETH staking yield against ETH with 12x amplification',
    longDescription: 'The stETH / ETH 12x Leverage Token amplifies the yield differential between staked ETH and regular ETH, providing sophisticated exposure to Ethereum staking rewards through automated leverage management.',
    category: 'Leverage Tokens',
    apy: 15.23,
    tvl: 6200000,
    assets: [
      {
        symbol: 'stETH',
        name: 'Lido Staked ETH',
        logo: stETHLogo
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'High'
    },
    fees: {
      managementFee: 2.5,
      performanceFee: 18.0,
      depositFee: 0.1,
      withdrawalFee: 0.15
    },
    metrics: {
      utilization: 88.7,
      participants: 324,
      averagePosition: 19135.80,
      successRate: 95.8
    },
    launchDate: '2023-12-01',
    isActive: true,
    minDeposit: 0.1,
    maxDeposit: 25,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'stETH', 'Staking'],
    leverageToken: {
      symbol: 'stETH12x',
      leverageAmount: 12,
      collateralAsset: {
        symbol: 'stETH',
        name: 'Lido Staked ETH',
        logo: stETHLogo
      },
      debtAsset: {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      supplyCap: 15000,
      currentSupply: 13650,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 3.8,
        leverageMultiplier: 12,
        borrowCost: 2.1,
        netAPY: 15.23
      }
    }
  },
  {
    id: 'wbtc-btc-8x-leverage',
    name: 'WBTC / BTC 8x Leverage Token',
    description: 'Leveraged exposure to wrapped Bitcoin performance with 8x amplification',
    longDescription: 'The WBTC / BTC 8x Leverage Token provides amplified exposure to Bitcoin through wrapped Bitcoin strategies, utilizing automated rebalancing to maintain target leverage while maximizing Bitcoin-denominated returns.',
    category: 'Leverage Tokens',
    apy: 12.94,
    tvl: 4500000,
    assets: [
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        logo: cbBTCLogo
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        logo: BitcoinLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'High'
    },
    fees: {
      managementFee: 2.8,
      performanceFee: 16.0,
      depositFee: 0.08,
      withdrawalFee: 0.12
    },
    metrics: {
      utilization: 82.3,
      participants: 198,
      averagePosition: 22727.27,
      successRate: 93.2
    },
    launchDate: '2024-01-10',
    isActive: true,
    minDeposit: 0.005,
    maxDeposit: 5,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'Bitcoin', 'WBTC'],
    leverageToken: {
      symbol: 'WBTC8x',
      leverageAmount: 8,
      collateralAsset: {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        logo: cbBTCLogo
      },
      debtAsset: {
        symbol: 'BTC',
        name: 'Bitcoin',
        logo: BitcoinLogo
      },
      supplyCap: 500,
      currentSupply: 489,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 2.1,
        leverageMultiplier: 8,
        borrowCost: 1.8,
        netAPY: 12.94
      }
    }
  },
  {
    id: 'reth-eth-10x-leverage',
    name: 'rETH / ETH 10x Leverage Token',
    description: 'Rocket Pool staked ETH leverage with 10x amplification for enhanced staking yields',
    longDescription: 'The rETH / ETH 10x Leverage Token maximizes exposure to Rocket Pool staking rewards through strategic leverage. This token automatically compounds rETH staking rewards while maintaining optimal leverage ratios through sophisticated rebalancing algorithms.',
    category: 'Leverage Tokens',
    apy: 16.34,
    tvl: 5300000,
    assets: [
      {
        symbol: 'rETH',
        name: 'Rocket Pool ETH',
        logo: rETHLogo
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'High'
    },
    fees: {
      managementFee: 2.3,
      performanceFee: 17.0,
      depositFee: 0.08,
      withdrawalFee: 0.12
    },
    metrics: {
      utilization: 91.2,
      participants: 387,
      averagePosition: 13695.89,
      successRate: 96.1
    },
    launchDate: '2024-01-25',
    isActive: true,
    minDeposit: 0.05,
    maxDeposit: 15,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'rETH', 'Rocket Pool', 'Popular'],
    leverageToken: {
      symbol: 'rETH10x',
      leverageAmount: 10,
      collateralAsset: {
        symbol: 'rETH',
        name: 'Rocket Pool ETH',
        logo: rETHLogo
      },
      debtAsset: {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      supplyCap: 8500,
      currentSupply: 6800,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 3.67,
        leverageMultiplier: 10,
        borrowCost: 2.21,
        netAPY: 16.34
      }
    }
  },
  {
    id: 'usdc-dai-5x-leverage',
    name: 'USDC / DAI 5x Leverage Token',
    description: 'Conservative leverage on stablecoin spread with 5x amplification',
    longDescription: 'The USDC / DAI 5x Leverage Token captures yield opportunities between major stablecoins through moderate leverage. This strategy focuses on interest rate differentials and stablecoin yield farming while maintaining lower risk through conservative leverage.',
    category: 'Leverage Tokens',
    apy: 8.15,
    tvl: 15200000,
    assets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        logo: DAILogo
      }
    ],
    riskLevel: 'Medium',
    riskMetrics: {
      marketRisk: 'Low',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Low',
      impermanentLoss: 'Low'
    },
    fees: {
      managementFee: 1.8,
      performanceFee: 12.0,
      depositFee: 0.05,
      withdrawalFee: 0.08
    },
    metrics: {
      utilization: 76.8,
      participants: 1521,
      averagePosition: 9993.42,
      successRate: 98.4
    },
    launchDate: '2024-02-15',
    isActive: true,
    minDeposit: 100,
    maxDeposit: 100000,
    lockPeriod: 0,
    tags: ['Leverage', 'Medium Risk', 'Stablecoins', 'Conservative', 'Popular'],
    leverageToken: {
      symbol: 'USDC5x',
      leverageAmount: 5,
      collateralAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      debtAsset: {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        logo: DAILogo
      },
      supplyCap: 50000,
      currentSupply: 38400,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 2.45,
        leverageMultiplier: 5,
        borrowCost: 1.82,
        netAPY: 8.15
      }
    }
  },
  {
    id: 'cbeth-eth-15x-leverage',
    name: 'cbETH / ETH 15x Leverage Token',
    description: 'Coinbase staked ETH leverage with 15x amplification for institutional exposure',
    longDescription: 'The cbETH / ETH 15x Leverage Token provides institutional-grade leveraged exposure to Coinbase staked ETH. This token leverages the premium and yield opportunities of cbETH against ETH through sophisticated automated strategies.',
    category: 'Leverage Tokens',
    apy: 21.78,
    tvl: 3900000,
    assets: [
      {
        symbol: 'cbETH',
        name: 'Coinbase Staked ETH',
        logo: cbETHLogo
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'Very High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'High',
      impermanentLoss: 'Very High'
    },
    fees: {
      managementFee: 2.9,
      performanceFee: 19.0,
      depositFee: 0.12,
      withdrawalFee: 0.18
    },
    metrics: {
      utilization: 93.7,
      participants: 267,
      averagePosition: 14606.74,
      successRate: 92.8
    },
    launchDate: '2024-03-01',
    isActive: true,
    minDeposit: 0.1,
    maxDeposit: 20,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'cbETH', 'Institutional'],
    leverageToken: {
      symbol: 'cbETH15x',
      leverageAmount: 15,
      collateralAsset: {
        symbol: 'cbETH',
        name: 'Coinbase Staked ETH',
        logo: cbETHLogo
      },
      debtAsset: {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      supplyCap: 6000,
      currentSupply: 4920,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 4.23,
        leverageMultiplier: 15,
        borrowCost: 2.89,
        netAPY: 21.78
      }
    }
  },
  {
    id: 'wsteth-eth-6x-leverage',
    name: 'wstETH / ETH 6x Leverage Token',
    description: 'Wrapped staked ETH leverage with 6x amplification for balanced risk-reward',
    longDescription: 'The wstETH / ETH 6x Leverage Token offers balanced exposure to Lido wrapped staked ETH through moderate leverage. This strategy optimizes for consistent returns while managing risk through conservative leverage ratios and active rebalancing.',
    category: 'Leverage Tokens',
    apy: 12.67,
    tvl: 7100000,
    assets: [
      {
        symbol: 'wstETH',
        name: 'Wrapped liquid staked Ether 2.0',
        logo: wstETHLogo
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      }
    ],
    riskLevel: 'Medium',
    riskMetrics: {
      marketRisk: 'Medium',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'Medium'
    },
    fees: {
      managementFee: 2.1,
      performanceFee: 14.0,
      depositFee: 0.06,
      withdrawalFee: 0.09
    },
    metrics: {
      utilization: 84.6,
      participants: 678,
      averagePosition: 10472.57,
      successRate: 97.3
    },
    launchDate: '2024-03-15',
    isActive: true,
    minDeposit: 0.08,
    maxDeposit: 30,
    lockPeriod: 0,
    tags: ['Leverage', 'Medium Risk', 'wstETH', 'Balanced'],
    leverageToken: {
      symbol: 'wstETH6x',
      leverageAmount: 6,
      collateralAsset: {
        symbol: 'wstETH',
        name: 'Wrapped liquid staked Ether 2.0',
        logo: wstETHLogo
      },
      debtAsset: {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      supplyCap: 12000,
      currentSupply: 9360,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 3.94,
        leverageMultiplier: 6,
        borrowCost: 2.11,
        netAPY: 12.67
      }
    }
  },
  {
    id: 'gho-usdc-4x-leverage',
    name: 'GHO / USDC 4x Leverage Token',
    description: 'Aave GHO stablecoin leverage with 4x amplification for yield optimization',
    longDescription: 'The GHO / USDC 4x Leverage Token leverages yield opportunities between Aave\'s native stablecoin GHO and USDC. This conservative strategy captures interest rate differentials while maintaining stability through lower leverage ratios.',
    category: 'Leverage Tokens',
    apy: 6.89,
    tvl: 2800000,
    assets: [
      {
        symbol: 'GHO',
        name: 'Aave GHO',
        logo: GHOLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'Medium',
    riskMetrics: {
      marketRisk: 'Low',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'Low'
    },
    fees: {
      managementFee: 1.5,
      performanceFee: 10.0,
      depositFee: 0.04,
      withdrawalFee: 0.06
    },
    metrics: {
      utilization: 68.9,
      participants: 234,
      averagePosition: 11965.81,
      successRate: 96.8
    },
    launchDate: '2024-04-01',
    isActive: true,
    minDeposit: 50,
    maxDeposit: 25000,
    lockPeriod: 0,
    tags: ['Leverage', 'Medium Risk', 'GHO', 'Aave', 'Stablecoins'],
    leverageToken: {
      symbol: 'GHO4x',
      leverageAmount: 4,
      collateralAsset: {
        symbol: 'GHO',
        name: 'Aave GHO',
        logo: GHOLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 20000,
      currentSupply: 13780,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 2.67,
        leverageMultiplier: 4,
        borrowCost: 1.94,
        netAPY: 6.89
      }
    }
  },
  {
    id: 'cbbtc-btc-11x-leverage',
    name: 'cbBTC / BTC 11x Leverage Token',
    description: 'Coinbase wrapped Bitcoin leverage with 11x amplification for premium exposure',
    longDescription: 'The cbBTC / BTC 11x Leverage Token provides leveraged exposure to the Coinbase wrapped Bitcoin premium against native Bitcoin. This token captures yield opportunities and price differentials through automated leverage management.',
    category: 'Leverage Tokens',
    apy: 14.52,
    tvl: 3200000,
    assets: [
      {
        symbol: 'cbBTC',
        name: 'Coinbase Wrapped BTC',
        logo: cbBTCLogo
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        logo: BitcoinLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'High',
      impermanentLoss: 'High'
    },
    fees: {
      managementFee: 2.6,
      performanceFee: 17.5,
      depositFee: 0.09,
      withdrawalFee: 0.14
    },
    metrics: {
      utilization: 89.3,
      participants: 156,
      averagePosition: 20512.82,
      successRate: 94.7
    },
    launchDate: '2024-04-15',
    isActive: true,
    minDeposit: 0.01,
    maxDeposit: 8,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'cbBTC', 'Bitcoin'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    leverageToken: {
      symbol: 'cbBTC11x',
      leverageAmount: 11,
      collateralAsset: {
        symbol: 'cbBTC',
        name: 'Coinbase Wrapped BTC',
        logo: cbBTCLogo
      },
      debtAsset: {
        symbol: 'BTC',
        name: 'Bitcoin',
        logo: BitcoinLogo
      },
      supplyCap: 400,
      currentSupply: 357,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 2.34,
        leverageMultiplier: 11,
        borrowCost: 1.89,
        netAPY: 14.52
      }
    }
  },
  {
    id: 'seam-usdc-20x-leverage',
    name: 'SEAM / USDC 20x Leverage Token',
    description: 'Seamless Protocol token leverage with 20x amplification for governance exposure',
    longDescription: 'The SEAM / USDC 20x Leverage Token provides maximum leverage exposure to the Seamless Protocol governance token. This high-risk, high-reward token amplifies SEAM price movements for sophisticated traders seeking governance token exposure.',
    category: 'Leverage Tokens',
    apy: 28.94,
    tvl: 1800000,
    assets: [
      {
        symbol: 'SEAM',
        name: 'Seamless Token',
        logo: SEAMLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'Very High',
      smartContractRisk: 'Low',
      liquidityRisk: 'Very High',
      impermanentLoss: 'Very High'
    },
    fees: {
      managementFee: 3.5,
      performanceFee: 22.0,
      depositFee: 0.15,
      withdrawalFee: 0.25
    },
    metrics: {
      utilization: 97.2,
      participants: 89,
      averagePosition: 20224.72,
      successRate: 89.4
    },
    launchDate: '2024-05-01',
    isActive: true,
    minDeposit: 100,
    maxDeposit: 10000,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'SEAM', 'Governance', 'New'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    leverageToken: {
      symbol: 'SEAM20x',
      leverageAmount: 20,
      collateralAsset: {
        symbol: 'SEAM',
        name: 'Seamless Token',
        logo: SEAMLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 1000000,
      currentSupply: 972000,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 5.12,
        leverageMultiplier: 20,
        borrowCost: 3.67,
        netAPY: 28.94
      }
    }
  },
  {
    id: 'dai-usdc-3x-leverage',
    name: 'DAI / USDC 3x Leverage Token',
    description: 'Ultra-conservative stablecoin leverage with 3x amplification for stable yield',
    longDescription: 'The DAI / USDC 3x Leverage Token offers the most conservative leverage approach in the Seamless ecosystem. This token captures minimal yield differentials between major stablecoins with ultra-low leverage for maximum stability.',
    category: 'Leverage Tokens',
    apy: 5.23,
    tvl: 22500000,
    assets: [
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        logo: DAILogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'Low',
    riskMetrics: {
      marketRisk: 'Very Low',
      smartContractRisk: 'Low',
      liquidityRisk: 'Very Low',
      impermanentLoss: 'Very Low'
    },
    fees: {
      managementFee: 1.2,
      performanceFee: 8.0,
      depositFee: 0.02,
      withdrawalFee: 0.03
    },
    metrics: {
      utilization: 72.1,
      participants: 3456,
      averagePosition: 6510.58,
      successRate: 99.1
    },
    launchDate: '2024-05-15',
    isActive: true,
    minDeposit: 250,
    maxDeposit: 250000,
    lockPeriod: 0,
    tags: ['Leverage', 'Low Risk', 'Stablecoins', 'Conservative', 'Popular'],
    chain: {
      id: 'ethereum',
      name: 'Ethereum',
      logo: EthereumLogo
    },
    leverageToken: {
      symbol: 'DAI3x',
      leverageAmount: 3,
      collateralAsset: {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        logo: DAILogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 100000,
      currentSupply: 72100,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 2.15,
        leverageMultiplier: 3,
        borrowCost: 1.37,
        netAPY: 5.23
      }
    }
  },
  {
    id: 'weth-usdc-9x-leverage',
    name: 'WETH / USDC 9x Leverage Token',
    description: 'Ethereum vs USD leverage with 9x amplification for directional exposure',
    longDescription: 'The WETH / USDC 9x Leverage Token provides directional exposure to Ethereum price movements against the US dollar with moderate-high leverage. This token captures ETH price appreciation opportunities through automated position management.',
    category: 'Leverage Tokens',
    apy: 19.87,
    tvl: 6800000,
    assets: [
      {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        logo: EthereumLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'Very High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'Very High'
    },
    fees: {
      managementFee: 2.7,
      performanceFee: 18.5,
      depositFee: 0.11,
      withdrawalFee: 0.16
    },
    metrics: {
      utilization: 91.8,
      participants: 534,
      averagePosition: 12734.46,
      successRate: 93.6
    },
    launchDate: '2024-06-01',
    isActive: true,
    minDeposit: 0.05,
    maxDeposit: 25,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'WETH', 'Directional', 'Popular'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    leverageToken: {
      symbol: 'WETH9x',
      leverageAmount: 9,
      collateralAsset: {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        logo: EthereumLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 5000,
      currentSupply: 4590,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 3.98,
        leverageMultiplier: 9,
        borrowCost: 2.54,
        netAPY: 19.87
      }
    }
  },
  {
    id: 'steth-usdc-7x-leverage',
    name: 'stETH / USDC 7x Leverage Token',
    description: 'Lido staked ETH vs USD leverage with 7x amplification for yield and price exposure',
    longDescription: 'The stETH / USDC 7x Leverage Token combines Ethereum staking yield with directional price exposure against USD. This strategy captures both stETH staking rewards and ETH price appreciation through balanced leverage.',
    category: 'Leverage Tokens',
    apy: 17.43,
    tvl: 4700000,
    assets: [
      {
        symbol: 'stETH',
        name: 'Lido Staked ETH',
        logo: stETHLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'High'
    },
    fees: {
      managementFee: 2.4,
      performanceFee: 16.5,
      depositFee: 0.08,
      withdrawalFee: 0.12
    },
    metrics: {
      utilization: 86.4,
      participants: 312,
      averagePosition: 15064.10,
      successRate: 95.2
    },
    launchDate: '2024-06-15',
    isActive: true,
    minDeposit: 0.1,
    maxDeposit: 20,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'stETH', 'Staking', 'Yield'],
    chain: {
      id: 'ethereum',
      name: 'Ethereum',
      logo: EthereumLogo
    },
    leverageToken: {
      symbol: 'stETH7x',
      leverageAmount: 7,
      collateralAsset: {
        symbol: 'stETH',
        name: 'Lido Staked ETH',
        logo: stETHLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 3500,
      currentSupply: 3024,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 3.72,
        leverageMultiplier: 7,
        borrowCost: 2.31,
        netAPY: 17.43
      }
    }
  },
  {
    id: 'reth-usdc-13x-leverage',
    name: 'rETH / USDC 13x Leverage Token',
    description: 'Rocket Pool staked ETH vs USD leverage with 13x amplification for maximum yield exposure',
    longDescription: 'The rETH / USDC 13x Leverage Token maximizes exposure to Rocket Pool staking rewards while providing directional ETH price exposure against USD. This high-leverage strategy targets sophisticated traders seeking maximum rETH yield amplification.',
    category: 'Leverage Tokens',
    apy: 24.61,
    tvl: 2900000,
    assets: [
      {
        symbol: 'rETH',
        name: 'Rocket Pool ETH',
        logo: rETHLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'Very High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'High',
      impermanentLoss: 'Very High'
    },
    fees: {
      managementFee: 3.1,
      performanceFee: 20.5,
      depositFee: 0.13,
      withdrawalFee: 0.19
    },
    metrics: {
      utilization: 94.6,
      participants: 178,
      averagePosition: 16292.13,
      successRate: 91.8
    },
    launchDate: '2024-07-01',
    isActive: true,
    minDeposit: 0.08,
    maxDeposit: 15,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'rETH', 'Rocket Pool', 'Advanced'],
    chain: {
      id: 'ethereum',
      name: 'Ethereum',
      logo: EthereumLogo
    },
    leverageToken: {
      symbol: 'rETH13x',
      leverageAmount: 13,
      collateralAsset: {
        symbol: 'rETH',
        name: 'Rocket Pool ETH',
        logo: rETHLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 2500,
      currentSupply: 2365,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 4.18,
        leverageMultiplier: 13,
        borrowCost: 2.93,
        netAPY: 24.61
      }
    }
  },
  {
    id: 'cbeth-usdc-14x-leverage',
    name: 'cbETH / USDC 14x Leverage Token',
    description: 'Coinbase staked ETH vs USD leverage with 14x amplification for institutional directional exposure',
    longDescription: 'The cbETH / USDC 14x Leverage Token provides institutional-grade leveraged exposure to Coinbase staked ETH against USD. This token combines cbETH staking rewards with high leverage for directional ETH price movements.',
    category: 'Leverage Tokens',
    apy: 26.34,
    tvl: 3400000,
    assets: [
      {
        symbol: 'cbETH',
        name: 'Coinbase Staked ETH',
        logo: cbETHLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'Very High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'High',
      impermanentLoss: 'Very High'
    },
    fees: {
      managementFee: 3.0,
      performanceFee: 21.0,
      depositFee: 0.14,
      withdrawalFee: 0.20
    },
    metrics: {
      utilization: 92.7,
      participants: 143,
      averagePosition: 23776.22,
      successRate: 90.9
    },
    launchDate: '2024-07-15',
    isActive: true,
    minDeposit: 0.1,
    maxDeposit: 18,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'cbETH', 'Institutional', 'Advanced'],
    chain: {
      id: 'ethereum',
      name: 'Ethereum',
      logo: EthereumLogo
    },
    leverageToken: {
      symbol: 'cbETH14x',
      leverageAmount: 14,
      collateralAsset: {
        symbol: 'cbETH',
        name: 'Coinbase Staked ETH',
        logo: cbETHLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 3000,
      currentSupply: 2781,
      chain: {
        id: 'ethereum',
        name: 'Ethereum',
        logo: EthereumLogo
      },
      apyBreakdown: {
        baseYield: 4.45,
        leverageMultiplier: 14,
        borrowCost: 3.12,
        netAPY: 26.34
      }
    }
  },
  {
    id: 'wsteth-usdc-8x-leverage',
    name: 'wstETH / USDC 8x Leverage Token',
    description: 'Wrapped staked ETH vs USD leverage with 8x amplification for balanced directional exposure',
    longDescription: 'The wstETH / USDC 8x Leverage Token offers balanced leveraged exposure to Lido wrapped staked ETH against USD. This strategy provides moderate-high leverage for directional ETH exposure while capturing wstETH staking benefits.',
    category: 'Leverage Tokens',
    apy: 18.92,
    tvl: 5600000,
    assets: [
      {
        symbol: 'wstETH',
        name: 'Wrapped liquid staked Ether 2.0',
        logo: wstETHLogo
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      }
    ],
    riskLevel: 'High',
    riskMetrics: {
      marketRisk: 'High',
      smartContractRisk: 'Medium',
      liquidityRisk: 'Medium',
      impermanentLoss: 'High'
    },
    fees: {
      managementFee: 2.5,
      performanceFee: 17.0,
      depositFee: 0.09,
      withdrawalFee: 0.13
    },
    metrics: {
      utilization: 88.2,
      participants: 421,
      averagePosition: 13301.90,
      successRate: 94.3
    },
    launchDate: '2024-08-01',
    isActive: true,
    minDeposit: 0.08,
    maxDeposit: 22,
    lockPeriod: 0,
    tags: ['Leverage', 'High Risk', 'wstETH', 'Directional', 'Popular'],
    chain: {
      id: 'base',
      name: 'Base',
      logo: BaseLogo
    },
    leverageToken: {
      symbol: 'wstETH8x',
      leverageAmount: 8,
      collateralAsset: {
        symbol: 'wstETH',
        name: 'Wrapped liquid staked Ether 2.0',
        logo: wstETHLogo
      },
      debtAsset: {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: USDCLogo
      },
      supplyCap: 4500,
      currentSupply: 3969,
      chain: {
        id: 'base',
        name: 'Base',
        logo: BaseLogo
      },
      apyBreakdown: {
        baseYield: 3.86,
        leverageMultiplier: 8,
        borrowCost: 2.42,
        netAPY: 18.92
      }
    }
  }
]

// Export function to get strategy by ID
export function getStrategyData(strategyId: string): Strategy {
  const strategy = mockStrategies.find(s => s.id === strategyId)
  if (!strategy) {
    // Return default USDC vault if strategy not found
    return mockStrategies[0]
  }
  return strategy
}

// Export function to get all strategies
export function getAllStrategies(): Strategy[] {
  return mockStrategies.filter(strategy => strategy.isActive)
}

// Export function to get strategies by category
export function getStrategiesByCategory(category: string): Strategy[] {
  return mockStrategies.filter(strategy => 
    strategy.isActive && strategy.category === category
  )
}

// Export function to get strategies by risk level
export function getStrategiesByRisk(riskLevel: string): Strategy[] {
  return mockStrategies.filter(strategy => 
    strategy.isActive && strategy.riskLevel === riskLevel
  )
}

// Export function to search strategies
export function searchStrategies(query: string): Strategy[] {
  const lowercaseQuery = query.toLowerCase()
  return mockStrategies.filter(strategy => 
    strategy.isActive && (
      strategy.name.toLowerCase().includes(lowercaseQuery) ||
      strategy.description.toLowerCase().includes(lowercaseQuery) ||
      strategy.category.toLowerCase().includes(lowercaseQuery) ||
      strategy.assets.some(asset => 
        asset.symbol.toLowerCase().includes(lowercaseQuery) ||
        asset.name.toLowerCase().includes(lowercaseQuery)
      ) ||
      strategy.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  )
}

// Export categories for filtering
export const STRATEGY_CATEGORIES = [
  'Vaults',
  'Leverage Tokens'
] as const

// Export risk levels for filtering
export const RISK_LEVELS = [
  'Low',
  'Medium', 
  'High'
] as const

// Export default strategy ID
export const DEFAULT_STRATEGY_ID = 'seamless-usdc-vault'