# Adding New Blockchain Networks

This guide explains how to add support for new blockchain networks to the Seamless Protocol frontend application.

## Step-by-Step Guide

### 1. Add Chain to Wagmi Configuration

**File**: `src/lib/config/wagmi.config.ts`

Add your new chain to the wagmi configuration:

```typescript
import { base, mainnet, polygon } from 'wagmi/chains' // Import your chain

// Add RPC URL resolution for your chain
const polygonRpc = 
  (rpcMap?.['137'] || rpcMap?.['polygon']) ??
  (import.meta.env['VITE_POLYGON_RPC_URL'] || 'https://polygon-rpc.com')

// Update the config
export const config = getDefaultConfig({
  appName: 'Seamless Protocol',
  projectId: walletConnectProjectId || 'YOUR_PROJECT_ID',
  chains: [base, mainnet, polygon], // Add your chain here
  transports: {
    [base.id]: http(baseRpc),
    [mainnet.id]: http(mainnetRpc),
    [polygon.id]: http(polygonRpc), // Add transport for your chain
  },
  ssr: false,
  syncConnectedChain: true,
})
```

### 2. Update Contract Addresses

**File**: `src/lib/contracts/addresses.ts`

Add your chain's contract addresses:

```typescript
// Update the SupportedChainId type
export type SupportedChainId = typeof mainnet.id | typeof base.id | typeof polygon.id

// Add your chain's contract addresses
const polygonContracts: ContractAddresses = {
  // Core Protocol
  leverageTokenFactory: '0x...' as Address,
  leverageManager: '0x...' as Address,
  leverageRouter: '0x...' as Address,
  leverageManagerV2: '0x...' as Address,
  leverageRouterV2: '0x...' as Address,
  
  // Tokens
  seamlessToken: '0x...' as Address,
  tokens: {
    usdc: '0x...' as Address,
    weth: '0x...' as Address,
    // Add other tokens as needed
  },
  
  // Add other contract addresses...
}

// Update the contractAddresses record
export const contractAddresses: Record<number, ContractAddresses> = {
  [base.id]: baseContracts,
  [mainnet.id]: mainnetContracts,
  [polygon.id]: polygonContracts, // Add your chain
}
```

### 3. Create Chain Logo Component

**File**: `src/components/icons/logos/polygon-logo.tsx`

Create a logo component for your chain:

```typescript
import type { SVGProps } from 'react'
import { useId } from 'react'

export function PolygonLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <title id={logoId}>Polygon Logo</title>
      {/* Your SVG content here */}
    </svg>
  )
}
```

**File**: `src/components/icons/logos/index.ts`

Export your new logo:

```typescript
export { BaseLogo } from './base-logo'
export { EthereumLogo } from './ethereum-logo'
export { PolygonLogo } from './polygon-logo' // Add your logo
// ... other exports
```

### 4. Update Environment Variables

**File**: `src/lib/env.ts`

Add your chain's RPC URL to required environment variables:

```typescript
const REQUIRED_ENV_VARS = [
  'VITE_WALLETCONNECT_PROJECT_ID',
  'VITE_BASE_RPC_URL',
  'VITE_ETHEREUM_RPC_URL',
  'VITE_POLYGON_RPC_URL', // Add your chain's RPC URL
  'VITE_THEGRAPH_API_KEY',
] as const
```

### 5. Update GraphQL Configuration

**File**: `src/lib/graphql/utils.ts`

Add your chain to GraphQL endpoints:

```typescript
const SUBGRAPH_ENDPOINTS = {
  8453: 'https://api.thegraph.com/subgraphs/name/seamless-protocol/base',
  1: 'https://api.thegraph.com/subgraphs/name/seamless-protocol/ethereum',
  137: 'https://api.thegraph.com/subgraphs/name/seamless-protocol/polygon', // Add your chain
} as const

export type SupportedChainId = keyof typeof SUBGRAPH_ENDPOINTS
```

### 6. Update Uniswap V3 Configuration

**File**: `src/lib/config/uniswapV3.ts`

Add your chain to Uniswap V3 configuration:

```typescript
const UNISWAP_V3_CONFIGS: Record<number, UniswapV3ChainConfig> = {
  8453: { // Base
    factory: '0x...',
    quoter: '0x...',
    router: '0x...',
  },
  1: { // Ethereum
    factory: '0x...',
    quoter: '0x...',
    router: '0x...',
  },
  137: { // Polygon
    factory: '0x...',
    quoter: '0x...',
    router: '0x...',
  },
}
```

### 7. Update Environment Variable Types

**File**: `src/vite-env.d.ts`

Add your chain's environment variables:

```typescript
interface ImportMetaEnv {
  // ... existing variables
  readonly VITE_POLYGON_RPC_URL?: string
  // Add other chain-specific variables
}
```

## Required Information

### Contract Addresses Needed

You'll need the following contract addresses for your new chain:

**Core Protocol:**
- `leverageTokenFactory` - Factory contract for creating leverage tokens
- `leverageManager` - V1 manager contract
- `leverageManagerV2` - V2 manager contract  
- `leverageRouter` - V1 router contract
- `leverageRouterV2` - V2 router contract
- `leverageTokenImpl` - Implementation contract for leverage tokens

**Adapters:**
- `morphoLendingAdapterFactory` - Morpho lending adapter factory
- `morphoLendingAdapterImpl` - Morpho lending adapter implementation
- `rebalanceAdapter` - Rebalancing adapter
- `lendingAdapter` - General lending adapter
- `veloraAdapter` - Velora adapter
- `pricingAdapter` - Price oracle adapter

**Tokens:**
- `seamlessToken` - SEAM token address
- `stakedSeam` - Staked SEAM token
- `tokens.usdc` - USDC token address
- `tokens.weth` - WETH token address
- `tokens.weeth` - weETH token address (if applicable)

**Governance:**
- `governance` - Governor contract address
- `timelockShort` - Short timelock contract
- `timelockLong` - Long timelock contract

**Helpers:**
- `multicall` - Multicall contract address
- `priceOracle` - Price oracle contract

### RPC Endpoints

You'll need reliable RPC endpoints for your chain:

```bash
# Add to your .env file
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
```