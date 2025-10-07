import type { Address } from 'viem'
import { BaseLogo, EthereumLogo } from '@/components/icons/logos'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { BASE_WETH } from '@/lib/contracts/addresses'

const BASE_UNISWAP_V2_ROUTER = '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24' as Address

// Leverage token keys enum for type safety
export enum LeverageTokenKey {
  WEETH_WETH_17X_TENDERLY = 'weeth-weth-17x-tenderly',
  CBBTC_USDC_2X_TENDERLY = 'cbbtc-usdc-2x-tenderly',
  WSTETH_WETH_2X_MAINNET = 'wsteth-weth-2x-mainnet',
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

// Leverage token configurations
export const leverageTokenConfigs: Record<string, LeverageTokenConfig> = {
  [LeverageTokenKey.WSTETH_WETH_2X_MAINNET]: {
    address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
    name: 'wstETH / WETH 2x Leverage Token',
    symbol: 'WSTETH-WETH-2x',
    description:
      'wstETH / WETH 2x leverage token that amplifies relative price movements between Wrapped stETH and Wrapped Ether',
    decimals: 18,
    leverageRatio: 2,
    chainId: 1,
    chainName: 'Ethereum',
    chainLogo: EthereumLogo,
    supplyCap: 200,
    collateralAsset: {
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
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
  [LeverageTokenKey.WEETH_WETH_17X_TENDERLY]: {
    address: '0x17533ef332083aD03417DEe7BC058D10e18b22c5' as Address,
    name: 'weETH / WETH 17x Leverage Token (Tenderly)',
    symbol: 'WEETH-WETH-17x',
    description:
      'Tenderly VNet deployment of the weETH / WETH 17x leverage token used for automated integration testing.',
    decimals: 18,
    leverageRatio: 17,
    chainId: 8453,
    chainName: 'Base (Tenderly VNet)',
    chainLogo: BaseLogo,
    supplyCap: 150,
    isTestOnly: true,
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether.fi ETH',
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
        type: 'uniswapV2',
        router: BASE_UNISWAP_V2_ROUTER,
      },
      collateralToDebt: {
        type: 'uniswapV2',
        router: BASE_UNISWAP_V2_ROUTER,
      },
    },
  },
  [LeverageTokenKey.CBBTC_USDC_2X_TENDERLY]: {
    address: '0x662c3f931D4101b7e2923f8493D6b35368a991aD' as Address,
    name: 'cbBTC / USDC 2x Leverage Token (Tenderly)',
    symbol: 'CBBTC-USDC-2x',
    description:
      'Tenderly VNet deployment of the cbBTC / USDC 2x leverage token used for automated integration testing.',
    decimals: 18,
    leverageRatio: 2,
    chainId: 1,
    chainName: 'Ethereum (Tenderly VNet)',
    chainLogo: EthereumLogo,
    supplyCap: 200,
    isTestOnly: true,
    collateralAsset: {
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as Address,
      decimals: 8,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
      decimals: 6,
    },
    swaps: {
      debtToCollateral: {
        type: 'uniswapV3',
        poolKey: 'usdc-cbbtc',
      },
      collateralToDebt: {
        type: 'uniswapV3',
        poolKey: 'usdc-cbbtc',
      },
    },
  },
}

// Helper function to get leverage token config by address
export function getLeverageTokenConfig(address: Address): LeverageTokenConfig | undefined {
  return getFilteredConfigs().find(
    (config) => config.address.toLowerCase() === address.toLowerCase(),
  )
}

// Helper function to get all leverage token configs
export function getAllLeverageTokenConfigs(): Array<LeverageTokenConfig> {
  return getFilteredConfigs()
}

function getFilteredConfigs(): Array<LeverageTokenConfig> {
  const includeTestTokens = import.meta.env['VITE_USE_TENDERLY_VNET'] === 'true'
  return Object.values(leverageTokenConfigs).filter((cfg) => includeTestTokens || !cfg.isTestOnly)
}
