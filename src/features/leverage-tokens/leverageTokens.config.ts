import type { Address } from 'viem'
import { getAddress, isAddressEqual } from 'viem'
import {
  BaseLogo,
  EthereumLogo,
  EtherfiLogo,
  LidoLogo,
  MerklLogo,
  MorphoLogo,
  PendleLogo,
  ResolvLogo,
  siUSDLogo,
} from '@/components/icons'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { BASE_WETH } from '@/lib/contracts/addresses'
import { APR_PROVIDERS } from './utils/apy-calculations/apr-providers'
import type { BORROW_APR_PROVIDERS } from './utils/apy-calculations/borrow-apy-providers'
import type { REWARDS_PROVIDERS } from './utils/apy-calculations/rewards-providers'

// Leverage token keys enum for type safety
export enum LeverageTokenKey {
  WSTETH_ETH_2X_MAINNET = 'wsteth-eth-2x-mainnet',
  WEETH_WETH_17X_BASE_MAINNET = 'weeth-weth-17x-base-mainnet',
  WSTETH_ETH_25X_ETHEREUM_MAINNET = 'wsteth-eth-25x-ethereum-mainnet',
  RLP_USDC_6_75X_ETHEREUM_MAINNET = 'rlp-usdc-6.75x-ethereum-mainnet',
  SIUSD_USDC_11X_ETHEREUM_MAINNET = 'siUSD-usdc-11x-ethereum-mainnet',
  PT_RLP_4DEC2025_USDC_2X_ETHEREUM_MAINNET = 'pt-rlp-4dec2025-usdc-2x-ethereum-mainnet',
  // Add more token keys here as they are added
  // ANOTHER_TOKEN = 'another-token',
}

// Define ResourceItem interface
interface ResourceItem {
  id: string
  title: string
  description: string
  url: string
  getUrl?: (ctx: { address?: Address }) => string
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

type SwapConfig = CollateralToDebtSwapConfig

// Leverage token configuration interface
export interface LeverageTokenConfig {
  // Basic token info
  address: Address
  featuredRank?: number
  name: string
  symbol: string
  description: string
  decimals: number
  leverageRatio: number
  chainId: number
  chainName: string
  chainLogo: React.ComponentType<React.SVGProps<SVGSVGElement>>
  // Supply cap (token units) - hardcoded until contract supports dynamic fetching
  supplyCap?: number
  // When true, omit from production UI but keep accessible for testing harnesses
  isTestOnly?: boolean

  // APY configuration
  apyConfig?: {
    aprProvider?: {
      type: APR_PROVIDERS
      id?: string // Optional provider-specific identifier
    }
    borrowAprProvider?: {
      type: BORROW_APR_PROVIDERS
    }
    rewardsProvider?: {
      type: REWARDS_PROVIDERS
    }
    pointsMultiplier?: number // Optional points multiplier (defaults to 0 if not provided)
  }

  // Asset configuration
  collateralAsset: {
    symbol: string
    name: string
    description: string
    address: Address
    decimals: number
    protocol?: {
      name: string
      url: string
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    }
  }
  debtAsset: {
    symbol: string
    name: string
    address: Address
    decimals: number
  }

  swaps?: {
    debtToCollateral?: SwapConfig
    collateralToDebt?: SwapConfig
  }

  // Related resources (optional)
  relatedResources?: {
    underlyingPlatforms: Array<ResourceItem>
    additionalRewards: Array<ResourceItem>
  }
}

/**
 * Get token decimals by address from leverage token configurations.
 * Falls back to common token decimals if not found in config.
 */
export function getTokenDecimals(tokenAddress: Address): number {
  // First, check if this token is a collateral or debt asset in any leverage token config
  for (const config of Object.values(leverageTokenConfigs)) {
    if (getAddress(config.collateralAsset.address) === getAddress(tokenAddress)) {
      return config.collateralAsset.decimals
    }
    if (getAddress(config.debtAsset.address) === getAddress(tokenAddress)) {
      return config.debtAsset.decimals
    }
  }
  throw new Error(`Token decimals not found for address: ${tokenAddress}`)
}

// Leverage token configurations
export const leverageTokenConfigs: Record<string, LeverageTokenConfig> = {
  [LeverageTokenKey.WSTETH_ETH_25X_ETHEREUM_MAINNET]: {
    featuredRank: 1,
    address: '0x98c4E43e3Bde7B649E5aa2F88DE1658E8d3eD1bF' as Address,
    name: 'wstETH / ETH 25x Leverage Token',
    symbol: 'WSTETH-ETH-25x',
    description:
      'wstETH / ETH 25x Leverage Token that amplifies relative price movements between Wrapped stETH and Ether',
    decimals: 18,
    leverageRatio: 25,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
    supplyCap: 822,
    apyConfig: {
      aprProvider: {
        type: APR_PROVIDERS.DEFI_LLAMA,
        id: '747c1d2a-c668-4682-b9f9-296708a3dd90',
      },
    },
    collateralAsset: {
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      description:
        "wstETH is Lido's wrapped, non-rebasing version of stETH. It represents a user's share of ETH staked through Lido's validators and accrues staking rewards over time. These staking rewards make wstETH's price increase relative to ETH as more rewards accrue.",
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'ETH',
      name: 'Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
      decimals: 18,
    },
    swaps: {
      debtToCollateral: {
        type: 'lifi',
        allowBridges: 'none',
      },
      collateralToDebt: {
        type: 'lifi',
        allowBridges: 'none',
      },
    },
    relatedResources: {
      additionalRewards: [
        {
          id: 'merkl-rewards',
          title: 'Merkl Rewards',
          description: 'Additional DeFi rewards and incentive tracking',
          // Default goes to dashboard; if connected, deep-link to user page
          url: 'https://app.merkl.xyz/users/',
          getUrl: ({ address }) =>
            address ? `https://app.merkl.xyz/users/${address}` : 'https://app.merkl.xyz/users/',
          icon: MerklLogo,
          badge: {
            text: 'Rewards Program',
            color: 'purple' as const,
          },
        },
      ],
      underlyingPlatforms: [
        {
          id: 'morpho-lending',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this Leverage Token',
          url: 'https://app.morpho.org/ethereum/market/0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e',
          icon: MorphoLogo,
          badge: {
            text: 'Lending Market',
            color: 'blue' as const,
          },
        },
        {
          id: 'lido',
          title: 'Lido',
          description: 'Lido',
          url: 'https://lido.fi/',
          icon: LidoLogo,
          badge: {
            text: 'Protocol Info',
            color: 'yellow' as const,
          },
        },
      ],
    },
  },
  [LeverageTokenKey.RLP_USDC_6_75X_ETHEREUM_MAINNET]: {
    address: '0x6426811fF283Fa7c78F0BC5D71858c2f79c0Fc3d' as Address,
    featuredRank: 3,
    name: 'RLP / USDC 6.75x Leverage Token',
    symbol: 'RLP-USDC-6.75x',
    description:
      'RLP / USDC 6.75x Leverage Token that amplifies relative price movements between RLP and USDC',
    decimals: 18,
    leverageRatio: 6.75,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
    supplyCap: 480000,
    apyConfig: {
      aprProvider: {
        type: APR_PROVIDERS.DEFI_LLAMA,
        id: '2ad8497d-c855-4840-85ad-cdc536b92ced',
      },
      pointsMultiplier: 6.75,
    },
    collateralAsset: {
      symbol: 'RLP',
      name: 'RLP',
      description:
        "RLP is Resolv's insurance or junior-tranche token. It captures excess yield from Resolv's delta-neutral strategy, which involves staking ETH while shorting ETH perpetuals to earn funding rates. RLP holders receive a larger share of profits when funding rates and staking are positive, but also absorb losses first if funding turns negative, helping to protect USR's peg.",
      address: '0x4956b52aE2fF65D74CA2d61207523288e4528f96' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
      decimals: 6,
    },
    swaps: {
      debtToCollateral: {
        type: 'lifi',
        allowBridges: 'none',
      },
      collateralToDebt: {
        type: 'lifi',
        allowBridges: 'none',
      },
    },
    relatedResources: {
      additionalRewards: [
        {
          id: 'resolv-points',
          title: 'Resolv Points',
          description: 'Resolv Points',
          url: 'https://app.resolv.xyz/points',
          icon: ResolvLogo,
          badge: {
            text: 'Rewards Program',
            color: 'yellow' as const,
          },
        },
        {
          id: 'merkl-rewards',
          title: 'Merkl Rewards',
          description: 'Additional DeFi rewards and incentive tracking',
          // Default goes to dashboard; if connected, deep-link to user page
          url: 'https://app.merkl.xyz/users/',
          getUrl: ({ address }) =>
            address ? `https://app.merkl.xyz/users/${address}` : 'https://app.merkl.xyz/users/',
          icon: MerklLogo,
          badge: {
            text: 'Rewards Program',
            color: 'purple' as const,
          },
        },
      ],
      underlyingPlatforms: [
        {
          id: 'morpho-lending',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this Leverage Token',
          url: 'https://app.morpho.org/ethereum/market/0xe1b65304edd8ceaea9b629df4c3c926a37d1216e27900505c04f14b2ed279f33',
          icon: MorphoLogo,
          badge: {
            text: 'Lending Market',
            color: 'blue' as const,
          },
        },
        {
          id: 'resolv',
          title: 'Resolv',
          description: 'Resolv',
          url: 'https://resolv.xyz/',
          icon: ResolvLogo,
          badge: {
            text: 'Protocol Info',
            color: 'yellow' as const,
          },
        },
      ],
    },
  },
  [LeverageTokenKey.PT_RLP_4DEC2025_USDC_2X_ETHEREUM_MAINNET]: {
    isTestOnly: true,
    address: '0x0E5eB844bc0A29c9B949137bbb13327f86809779' as Address,
    name: 'PT-RLP-4DEC2025 / USDC 2x Leverage Token',
    symbol: 'PT-RLP-4DEC2025-USDC-2x',
    description:
      'PT-RLP-4DEC2025 / USDC 2x Leverage Token that amplifies relative price movements between PT-RLP-4DEC2025 and USDC',
    decimals: 18,
    leverageRatio: 2,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
    supplyCap: 1000000,
    apyConfig: {
      aprProvider: {
        type: APR_PROVIDERS.DEFI_LLAMA,
        id: '4fa9f597-3907-48b7-b89d-5beb820e9f03',
      },
    },
    collateralAsset: {
      symbol: 'PT-RLP-4DEC2025',
      name: 'PT-RLP-4DEC2025',
      description:
        "PT-RLP-4DEC2025 is the Pendle Principal Token (PT) representation of Resolv's RLP, a junior-tranche insurance token. This tokenized form entitles holders to the underlying RLP at maturity, allowing users to gain exposure to RLP's excess yield from Resolv's delta-neutral strategy until December 4, 2025. RLP captures profit from staking ETH and shorting ETH perpetuals, and as a junior tranche, absorbs losses first and receives a larger share of profits, helping to protect USR's peg.",
      address: '0x3A70F0C696dcB3A4aB3833cD9726397dD61AC85e' as Address,
      decimals: 6,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
      decimals: 6,
    },
    swaps: {
      debtToCollateral: {
        type: 'pendle',
      },
      collateralToDebt: {
        type: 'pendle',
      },
    },
    relatedResources: {
      additionalRewards: [
        {
          id: 'merkl-rewards',
          title: 'Merkl Rewards',
          description: 'Additional DeFi rewards and incentive tracking',
          // Default goes to dashboard; if connected, deep-link to user page
          url: 'https://app.merkl.xyz/users/',
          getUrl: ({ address }) =>
            address ? `https://app.merkl.xyz/users/${address}` : 'https://app.merkl.xyz/users/',
          icon: MerklLogo,
          badge: {
            text: 'Rewards Program',
            color: 'purple' as const,
          },
        },
      ],
      underlyingPlatforms: [
        {
          id: 'morpho-lending',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this Leverage Token',
          url: 'https://app.morpho.org/ethereum/market/0xa02ad0cf521ba5e5b20d1bcb98043eb091807e2b3bf26df5aad1ad154a3b8d45',
          icon: MorphoLogo,
          badge: {
            text: 'Lending Market',
            color: 'blue' as const,
          },
        },
        {
          id: 'resolv',
          title: 'Resolv',
          description: 'Resolv',
          url: 'https://resolv.xyz/',
          icon: ResolvLogo,
          badge: {
            text: 'Protocol Info',
            color: 'yellow' as const,
          },
        },
        {
          id: 'pendle',
          title: 'Pendle',
          description: 'Pendle',
          url: 'https://pendle.finance/',
          icon: PendleLogo,
          badge: {
            text: 'Protocol Info',
            color: 'green' as const,
          },
        },
      ],
    },
  },
  [LeverageTokenKey.WEETH_WETH_17X_BASE_MAINNET]: {
    address: '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address,
    name: 'weETH / WETH 17x Leverage Token',
    symbol: 'WEETH-WETH-17x',
    description:
      'weETH / WETH 17x Leverage Token that amplifies relative price movements between weETH and WETH on Base',
    decimals: 18,
    leverageRatio: 17,
    chainId: 8453,
    chainName: 'Base',
    chainLogo: BaseLogo,
    supplyCap: 120,
    apyConfig: {
      aprProvider: {
        type: APR_PROVIDERS.ETHERFI,
      },
      pointsMultiplier: 34,
    },
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether.fi ETH',
      description:
        "weETH is Ether.fi's wrapped, non-rebasing version of eETH. It represents ETH staked through Ether.fi's liquid restaking system and accumulates staking rewards over time, making its price increase relative to ETH as more rewards accrue.",
      address: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: BASE_WETH,
      decimals: 18,
    },
    swaps: {
      debtToCollateral: {
        type: 'lifi',
        allowBridges: 'none',
      },
      collateralToDebt: {
        type: 'lifi',
        allowBridges: 'none',
      },
    },
    relatedResources: {
      additionalRewards: [
        {
          id: 'etherfi-points',
          title: 'Ether.fi Points',
          description: 'Track your points and rewards from weETH staking activity',
          url: 'https://www.ether.fi/app/portfolio',
          icon: EtherfiLogo,
          badge: {
            text: 'Rewards Program',
            color: 'indigo' as const,
          },
        },
        {
          id: 'merkl-rewards',
          title: 'Merkl Rewards',
          description: 'Additional DeFi rewards and incentive tracking',
          url: 'https://app.merkl.xyz/users/',
          getUrl: ({ address }) =>
            address ? `https://app.merkl.xyz/users/${address}` : 'https://app.merkl.xyz/users/',
          icon: MerklLogo,
          badge: {
            text: 'Rewards Program',
            color: 'purple' as const,
          },
        },
      ],
      underlyingPlatforms: [
        {
          id: 'morpho-lending',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this Leverage Token',
          url: 'https://app.morpho.org/base/market/0xfd0895ba253889c243bf59bc4b96fd1e06d68631241383947b04d1c293a0cfea',
          icon: MorphoLogo,
          badge: {
            text: 'Lending Market',
            color: 'blue' as const,
          },
        },
        {
          id: 'etherfi-protocol',
          title: 'Ether.fi Protocol',
          description: 'Learn more about the weETH liquid staking token',
          url: 'https://ether.fi/',
          icon: EtherfiLogo,
          badge: {
            text: 'Protocol Info',
            color: 'indigo' as const,
          },
        },
      ],
    },
  },
  [LeverageTokenKey.WSTETH_ETH_2X_MAINNET]: {
    isTestOnly: true,
    address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
    name: 'wstETH / WETH 2x Leverage Token',
    symbol: 'WSTETH-ETH-2x',
    description:
      'wstETH / ETH 2x Leverage Token that amplifies relative price movements between Wrapped stETH and Ether',
    decimals: 18,
    leverageRatio: 2,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
    supplyCap: 200,
    apyConfig: {
      aprProvider: {
        type: APR_PROVIDERS.DEFI_LLAMA,
        id: '747c1d2a-c668-4682-b9f9-296708a3dd90',
      },
    },
    collateralAsset: {
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      description: "Wrapped version of Lido's staked ETH token, providing liquid staking rewards",
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'ETH',
      name: 'Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
      decimals: 18,
    },
    swaps: {
      debtToCollateral: {
        type: 'lifi',
        allowBridges: 'none',
      },
      collateralToDebt: {
        type: 'lifi',
        allowBridges: 'none',
      },
    },
  },
  [LeverageTokenKey.SIUSD_USDC_11X_ETHEREUM_MAINNET]: {
    featuredRank: 2,
    address: '0x604d37747f3382fA51519e7542d54F1e730B97A3' as Address,
    name: 'siUSD / USDC 11x Leverage Token',
    symbol: 'SIUSD-USDC-11x',
    description:
      'siUSD / USDC 11x Leverage Token that amplifies relative price movements between siUSD and USDC on Ethereum',
    decimals: 18,
    leverageRatio: 11,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
    supplyCap: 625000,
    apyConfig: {
      aprProvider: {
        type: APR_PROVIDERS.DEFI_LLAMA,
        id: '8fa2e60e-365a-41fc-8d50-fadde5041f94',
      },
      pointsMultiplier: 16.5,
    },
    collateralAsset: {
      symbol: 'siUSD',
      name: 'Staked infiniFi USD',
      description:
        "siUSD is infiniFi's senior-debt tranche token. It captures yield from infiniFi's fractional reserve yield strategy, which involves various liquid and illiquid yield strategies, always keeping a portion of reserves in liquid positions to facilitate instant withdrawals. Learn more here.",
      address: '0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB' as Address,
      decimals: 18,
      protocol: {
        name: 'infiniFi',
        url: 'https://infinifi.xyz/',
        icon: siUSDLogo,
      },
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
      decimals: 6,
    },
    swaps: {
      debtToCollateral: {
        type: 'infinifi',
      },
      collateralToDebt: {
        type: 'infinifi',
      },
    },
    relatedResources: {
      additionalRewards: [
        {
          id: 'infinifi-points',
          title: 'infiniFi Points',
          description: 'infiniFi Points',
          url: 'https://app.infinifi.xyz/points',
          icon: siUSDLogo,
          badge: {
            text: 'Rewards Program',
            color: 'yellow' as const,
          },
        },
        {
          id: 'merkl-rewards',
          title: 'Merkl Rewards',
          description: 'Additional DeFi rewards and incentive tracking',
          // Default goes to dashboard; if connected, deep-link to user page
          url: 'https://app.merkl.xyz/users/',
          getUrl: ({ address }) =>
            address ? `https://app.merkl.xyz/users/${address}` : 'https://app.merkl.xyz/users/',
          icon: MerklLogo,
          badge: {
            text: 'Rewards Program',
            color: 'purple' as const,
          },
        },
      ],
      underlyingPlatforms: [
        {
          id: 'morpho-lending',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this Leverage Token',
          url: 'https://app.morpho.org/ethereum/market/0xbbf7ce1b40d32d3e3048f5cf27eeaa6de8cb27b80194690aab191a63381d8c99/',
          icon: MorphoLogo,
          badge: {
            text: 'Lending Market',
            color: 'blue' as const,
          },
        },
        {
          id: 'infinifi',
          title: 'infiniFi Transparency Dashboard',
          description: 'infiniFi Transparency Dashboard',
          url: 'https://stats.infinifi.xyz/',
          icon: siUSDLogo,
          badge: {
            text: 'Protocol Info',
            color: 'yellow' as const,
          },
        },
        {
          id: 'infinifi',
          title: 'infiniFi',
          description: 'infiniFi',
          url: 'https://infinifi.xyz/',
          icon: siUSDLogo,
          badge: {
            text: 'Protocol Info',
            color: 'yellow' as const,
          },
        },
      ],
    },
  },
}

// Helper function to get leverage token config by address and optionally chain ID
export function getLeverageTokenConfig(
  address: Address,
  chainId?: number,
): LeverageTokenConfig | undefined {
  return getFilteredConfigs().find(
    (config) =>
      isAddressEqual(config.address, address) &&
      (chainId === undefined || config.chainId === chainId),
  )
}

// Helper function to get all leverage token configs
export function getAllLeverageTokenConfigs(): Array<LeverageTokenConfig> {
  return getFilteredConfigs()
}

function getFilteredConfigs(): Array<LeverageTokenConfig> {
  const includeTestTokens = import.meta.env['VITE_INCLUDE_TEST_TOKENS'] === 'true'
  return Object.values(leverageTokenConfigs).filter((cfg) => includeTestTokens || !cfg.isTestOnly)
}
