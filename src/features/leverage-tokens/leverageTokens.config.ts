import { Building2, Coins, Globe, TrendingUp } from 'lucide-react'
import type { Address } from 'viem'
import { BaseLogo } from '@/components/icons/logos'

// Leverage token keys enum for type safety
export enum LeverageTokenKey {
  WEETH_WETH_17X = 'weeth-weth-17x',
  // Add more token keys here as they are added
  // ANOTHER_TOKEN = 'another-token',
}

// Define ResourceItem interface
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

// Leverage token configuration interface
export interface LeverageTokenConfig {
  // Basic token info
  address: Address
  name: string
  symbol: string
  description: string
  decimals: number
  leverageRatio: number
  chainId: number
  chainName: string
  chainLogo: React.ComponentType<React.SVGProps<SVGSVGElement>>

  // Asset configuration
  collateralAsset: {
    symbol: string
    name: string
    address: Address
    decimals: number
  }
  debtAsset: {
    symbol: string
    name: string
    address: Address
    decimals: number
  }

  // Related resources (optional)
  relatedResources?: {
    underlyingPlatforms: Array<ResourceItem>
    additionalRewards: Array<ResourceItem>
  }
}

// Leverage token configurations
export const leverageTokenConfigs: Record<string, LeverageTokenConfig> = {
  [LeverageTokenKey.WEETH_WETH_17X]: {
    address: '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address,
    name: 'weETH / WETH 17x Leverage Token',
    symbol: 'WEETH-WETH-17x',
    description:
      'weETH / WETH 17x leverage token that amplifies the performance difference between wrapped Ether.fi ETH and Wrapped Ether, providing enhanced returns from relative price movements',
    decimals: 18,
    leverageRatio: 17,
    chainId: 8453,
    chainName: 'Base',
    chainLogo: BaseLogo,
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether.fi ETH',
      address: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006' as Address,
      decimals: 18,
    },
    relatedResources: {
      underlyingPlatforms: [
        {
          id: 'morpho-lending',
          title: 'Morpho Lending Market',
          description: 'View the underlying lending market powering this leverage token',
          url: 'https://app.morpho.org/base/market/0xfd0895ba253889c243bf59bc4b96fd1e06d68631241383947b04d1c293a0cfea',
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
          url: 'https://www.ether.fi/app/portfolio',
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
    },
  },
}

// Helper function to get leverage token config by address
export function getLeverageTokenConfig(address: Address): LeverageTokenConfig | undefined {
  return Object.values(leverageTokenConfigs).find(
    (config) => config.address.toLowerCase() === address.toLowerCase(),
  )
}

// Helper function to get all leverage token configs
export function getAllLeverageTokenConfigs(): Array<LeverageTokenConfig> {
  return Object.values(leverageTokenConfigs)
}
