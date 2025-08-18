# Mission

Rebuild Seamless Protocol's frontend from scratch - a DeFi protocol on Base that wraps complex leverage strategies into simple ERC-20 tokens.

## Key Requirements

- **IPFS deployment** - True decentralization, no server
- **React + wagmi/viem** - Blockchain interaction
- **7 phased releases** - Each production-ready
- **Heavy testing** - Unit, integration, E2E
- **Direct ERC4626** - No Morpho SDK dependency ( not a hard requirement)

## Tech Stack

### Core

- **Vite + React** - Static build for IPFS (NOT TanStack Start)
- **wagmi + viem** - Blockchain interaction
- **RainbowKit** - Wallet connections
- **TanStack Query** - Data fetching/caching
- **TanStack Router** - Client-side routing only

### UI & Design

- **ShadCN UI** - Component library
- **Tailwind CSS** - Styling
- **Storybook** - Component documentation

### Developer Tools

- **Bun** - Package manager & test runner
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Anvil** - Blockchain testing
- **Biome** - Linting/formatting

### Infrastructure

- **GitHub Actions** - CI/CD
- **IPFS** - Deployment (via Pinata/Fleek)
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring

## Why This Stack

### Why NOT TanStack Start?

- Server-side features useless on IPFS
- No SSR, no server functions, no API routes
- Extra 40kb bundle for features we can't use
- DeFi data needs wallet connection (client-side only)

### Why This Works for DeFi

- **No server** - Everything runs in browser
- **Wallet-first** - All data depends on connected wallet
- **Simple routing** - DeFi apps have ~10 routes max
- **Minimal bundle** - Every KB matters on IPFS
- **Blockchain complexity** - Not routing complexity

## Phase Breakdown

### Phase 1: Foundation & Infrastructure ✅

- Multi-chain configuration (Base + Ethereum ready)
- Wallet connection (MetaMask, WalletConnect, Safe, etc)
- ShadCN component library
- Storybook documentation
- Testing pyramid (unit/integration/E2E)
- CI/CD pipeline
- Error monitoring (Sentry)
- Feature flags system

### Phase 2: Leverage Tokens

- Token table with filters/sort
- Token detail pages
- Mint/redeem functionality
- KyberSwap widget integration

### Phase 3: User Dashboard

- Portfolio overview
- Historical performance (from subgraph)
- Reward claiming

### Phase 4: Morpho Vaults

- Vault table interface
- Deposit/withdrawal operations
- APY calculations

### Phase 5: Staking

- Staking positions
- Stake/unstake operations
- Reward claiming

### Phase 6: Governance

- Token delegation (SEAM, esSEAM, stkSEAM)
- Proposal voting links
- Vesting claims

### Phase 7: Advanced Features

- Leverage token creation UI
- Factory contract integration
- Parameter configuration

## Project Structure for Phase 1

```
├── .github/
│   └── workflows/
│       ├── test.yml           # Run all tests
│       ├── deploy-ipfs.yml    # Deploy to IPFS
│       └── check.yml          # Lint & typecheck
├── .storybook/                # Storybook config
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── main.tsx               # App entry
│   ├── router.tsx             # Route definitions
│   ├── providers.tsx          # wagmi, RainbowKit, Query
│   ├── lib/
│   │   ├── contracts/         # ABIs, addresses
│   │   ├── config/            # Chain configs
│   │   └── utils/             # Helpers
│   ├── hooks/
│   │   ├── useVault.ts        # Vault interactions
│   │   └── useLeverageToken.ts
│   ├── components/
│   │   ├── ui/                # ShadCN components
│   │   └── features/          # Business components
│   ├── routes/
│   │   ├── index.tsx          # Landing page
│   │   └── tokens.tsx         # Phase 2 placeholder
│   └── stories/               # Storybook stories
├── tests/
│   ├── unit/                  # Vitest tests
│   ├── integration/           # Anvil tests
│   ├── e2e/                   # Playwright tests
│   └── setup.ts               # Test utilities
├── public/                    # Static assets
├── index.html
├── vite.config.ts             # base: './' for IPFS!
├── tailwind.config.ts
├── biome.json
├── playwright.config.ts
└── package.json

```

## Data Architecture

### Priority Order

1. **RPC** - Current blockchain state
2. **The Graph** - Historical data (subgraph)
3. **Morpho API** - Vault analytics
4. **Price APIs** - Token prices (CoinGecko)

### Key Principles

- On-chain data for current state
- APIs only for historical
- Client-side only (no server)
- RPC as source of truth

### Key Decisions from Call

**Technical Clarifications**

Morpho SDK - Too complex, abstract it away

Fuul - Merkle competitor for rewards (has SDK, API, subgraph)

Analytics - Scaffold to answer product questions later

OnchainKit - Consider for multi-chain UX improvements

Sentry - Need detailed error context

Automation - CI/CD should auto-deploy on merge

**Product Clarifications**

Staking - SEAM governance token, Base only

Phase 7 - Completely new feature

Data consistency - Major concern, needs monitoring

Iteration speed - Ship fast, improve continuously

## Phase 1 Implementation Checklist

- [ ]  Project scaffold with Vite + React
- [ ]  Wagmi + RainbowKit setup
- [ ]  Multi-chain configuration
- [ ]  ShadCN component library
- [ ]  Storybook setup with key components
- [ ]  Unit test infrastructure (Vitest)
- [ ]  Integration test setup (Anvil)
- [ ]  E2E test setup (Playwright + mock wallet)
- [ ]  CI/CD pipeline (GitHub Actions)
- [ ]  IPFS deployment script
- [ ]  Error monitoring (Sentry)
- [ ]  Feature flags system
- [ ]  Environment configuration (.env.example)