# Adding New Leverage Tokens

This guide explains how to add new leverage tokens to the Seamless Protocol frontend application.

## Overview

Leverage tokens are configured in [`src/features/leverage-tokens/leverageTokens.config.ts`](../src/features/leverage-tokens/leverageTokens.config.ts). Each token requires specific configuration parameters and assets (logos) to be properly displayed in the UI.

## Step-by-Step Guide

### 1. Add Token Key

First, add a new key to the `LeverageTokenKey` enum:

```typescript
export enum LeverageTokenKey {
  WSTETH_ETH_2X_MAINNET = 'wsteth-eth-2x-mainnet',
  // Add your new token key here
  YOUR_NEW_TOKEN = 'your-new-token-key',
}
```

### 2. Create Token Logo Components

Create logo components for your token's assets in `src/components/icons/logos/`:

1. Create individual logo files (e.g., `your-token-logo.tsx`)
2. Export them from `src/components/icons/logos/index.ts`

**Logo Component Template:**
```typescript
import type { SVGProps } from 'react'
import { useId } from 'react'

export function YourTokenLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()

  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>Your Token Logo</title>
      {/* Your SVG content here */}
    </svg>
  )
}
```

### 3. Add Token Configuration

Add your token configuration to the `leverageTokenConfigs` object using the example below:

## Configuration Example

Here's the complete configuration for `WSTETH_ETH_2X_MAINNET` as a reference:

```typescript
[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]: {
  // === MANDATORY FIELDS ===
  address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
  name: 'wstETH / ETH 2x Leverage Token',
  symbol: 'WSTETH-ETH-2x',
  description: 'wstETH / ETH 2x leverage token that amplifies relative price movements between Wrapped stETH and Wrapped Ether',
  decimals: 18,
  leverageRatio: 2,
  chainId: 1,
  chainName: 'Ethereum',
  chainLogo: EthereumLogo,
  
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

  // === OPTIONAL FIELDS ===
  supplyCap: 150,
  isTestOnly: true, // Optional: Only shows when VITE_INCLUDE_TEST_TOKENS=true
  
  // APY Configuration (optional)
  apyConfig: {
    aprProvider: {
      type: APR_PROVIDERS.LIDO,
      id: 'steth',
    },
    pointsMultiplier: 2, // Optional: Points multiplier for rewards (defaults to 0 if not provided)
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
        // Default goes to dashboard; if connected, deep-link to user page
        url: 'https://app.merkl.xyz/users/',
        getUrl: ({ address }) =>
          address ? `https://app.merkl.xyz/users/${address}` : 'https://app.merkl.xyz/users/',
        icon: TrendingUp,
        badge: {
          text: 'Incentives',
          color: 'purple' as const,
        },
      },
    ],
  },
},
```

## APY Configuration

The `apyConfig` section allows you to configure how APY data is calculated and displayed for your leverage token:

### Available Options

```typescript
apyConfig: {
  // APR Provider Configuration
  aprProvider?: {
    type: APR_PROVIDERS.LIDO | APR_PROVIDERS.ETHERFI,
    id?: string // Optional provider-specific identifier
  },
  
  // Borrow APR Provider Configuration  
  borrowAprProvider?: {
    type: BORROW_APR_PROVIDERS.MORPHO,
    id?: string // Optional provider-specific identifier
  },
  
  // Rewards Provider Configuration
  rewardsProvider?: {
    type: REWARDS_PROVIDERS.MERKL,
    id?: string // Optional provider-specific identifier
  },
  
  // Points Multiplier Configuration
  pointsMultiplier?: number // Points multiplier for rewards calculation
}
```

### Default Values

- **`pointsMultiplier`**: Defaults to `0` if not provided
- **APR Providers**: Defaults to Ether.fi if no provider specified
- **Borrow APR**: Defaults to Morpho if no provider specified  
- **Rewards**: Defaults to Merkl if no provider specified

### Points Multiplier Behavior

- **When `pointsMultiplier` is defined**: Points are calculated as `pointsMultiplier` (static value)
- **When `pointsMultiplier` is not defined**: Points default to `0` and are hidden in the UI
- **UI Display**: Points are only shown when they have a non-zero value

### Example Configurations

**Basic Configuration (no points):**
```typescript
apyConfig: {
  aprProvider: {
    type: APR_PROVIDERS.LIDO,
    id: 'steth',
  },
  // No pointsMultiplier = points will be 0 and hidden
}
```

**With Points Rewards:**
```typescript
apyConfig: {
  aprProvider: {
    type: APR_PROVIDERS.ETHERFI,
  },
  pointsMultiplier: 5, // Shows "5 x" points in UI
}
```

## Test-Only Tokens

Tokens marked with `isTestOnly: true` will only appear in the UI when the environment variable `VITE_INCLUDE_TEST_TOKENS=true` is set. This is useful for:

- Development and testing environments
- Tenderly VNet deployments
- Staging environments

## Swap Configuration

For production leverage tokens, use LiFi routing with bridges disabled:

```typescript
swaps: {
  debtToCollateral: {
    type: 'lifi',
    allowBridges: 'none',
  },
  collateralToDebt: {
    type: 'lifi',
    allowBridges: 'none',
  },
}
```

For test-only tokens, you can use specific Uniswap V3 pool configurations for deterministic testing.
