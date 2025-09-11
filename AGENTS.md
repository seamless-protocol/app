# AGENTS.md

This file provides guidance to AI agents and automation systems (including Codex) when working with code in this repository.

Note: This document must be kept in strict sync with `CLAUDE.md`. Any change here should be mirrored there verbatim.

## Project Overview

Seamless Protocol - Frontend application for a DeFi protocol that wraps complex leverage strategies into simple ERC-20 tokens. Built for IPFS deployment as a fully static, client-side application.

## Testing Backend Default

**CRITICAL: Tenderly VNet is the default and preferred backend for all integration and E2E tests.** 
- Always use Tenderly VNet approach unless explicitly debugging local issues
- Anvil is only a fallback for local development when Tenderly is unavailable
- Tests automatically create/delete VNet instances just-in-time (JIT)

## Essential Commands

```bash
# Development
bun dev                 # Start dev server on http://localhost:3000
bun build              # Build for production (IPFS-ready)
bun preview            # Preview production build

# Code Quality (run after making changes)
bun check:fix          # Auto-fix linting issues and type-check
bun check              # Check only (for CI)
bun format             # Format code with Biome
bun typecheck          # Type-check only

# Testing
bun test               # Run unit tests with Vitest
bun test:ui            # Run tests with UI
bun test:coverage      # Run tests with coverage
bun test:integration   # Run integration tests (uses Tenderly VNet by default)
bun test:e2e           # Run E2E tests with Playwright (uses Tenderly VNet by default)

# Testing Backend Configuration
# DEFAULT: Tenderly VNet (just-in-time creation/deletion)
# - Set TENDERLY_ACCESS_KEY, TENDERLY_ACCOUNT, TENDERLY_PROJECT environment variables
# - Tests automatically create/delete VNet instances as needed
# 
# FALLBACK: Local Anvil Base Fork
# bun run anvil:base     # Start local Base fork (Terminal 1) 
# - Only use when Tenderly is unavailable or for local development

# Component Development (needs setup)
bun storybook          # Start Storybook on port 6006 (needs setup)
bun build-storybook    # Build Storybook static site (needs setup)

# ShadCN UI Components
bunx --bun shadcn@latest add [component]  # Add new UI components
```

**Important**: Always run `bun check:fix` after making code changes to ensure formatting and type safety.

## Architecture & Key Decisions

### IPFS Deployment Requirements
- **Hash routing required** - TanStack Router must use hash history
- **Relative paths only** - `base: './'` in vite.config.ts is CRITICAL
- **Static bundle** - Pure client-side application

### Web3 Stack
- **Wagmi v2 + Viem** - For all blockchain interactions
- **RainbowKit** - Wallet connection UI
- **Multi-chain ready** - Base (primary) + Ethereum (future)
- **Data hierarchy**: 
  1. On-chain RPC (current state)
  2. Subgraph (historical data)
  3. External APIs (only when necessary)

### Shared On-Chain Config
- **Single source**: `src/lib/contracts` centralizes ABIs and addresses.
- **Addresses**: `src/lib/contracts/addresses.ts` exports typed maps by `chainId` plus helpers like `STAKED_SEAM` and `getLeverageManagerAddress`.
- **Governance helpers**: Use `getGovernanceAddresses(chainId)` or `getRequiredGovernanceAddresses(chainId)` for governor/timelock bundles.
- **ABIs**: Minimal, pruned ABIs in `src/lib/contracts/abis/*` to keep bundle size small.
- **Re-exports**: Import via `@/lib/contracts` to access addresses, ABIs, and wagmi codegen.
- **Features**: Keep UI-only constants in `src/features/<feature>`, import on-chain config from `src/lib/contracts`.
- **Tests**: Prefer mocking `@/lib/contracts/addresses` in unit tests; avoid duplicating addresses.

### Development Phases
The app is designed for 7 incremental production releases:
1. Foundation & Infrastructure (current)
2. Leverage Tokens
3. User Dashboard
4. Morpho Vaults
5. Staking
6. Governance
7. Advanced Features (token creation)

### TypeScript Configuration
- **Strict mode** with all safety checks enabled
- **Path aliases** configured in both TypeScript and Vite
- **noUncheckedIndexedAccess** enabled for array safety

### Code Quality
- **Biome** for linting and formatting
- Run `bun check:fix` after changes

### Function Style
- **Function declarations**: Prefer for exported utilities and domain-layer helpers when hoisting improves readability (main flow first, helpers below). Useful if overloads are expected or to keep stack names clear.
- **Arrow functions**: Prefer inside React components/hooks and for callbacks/handlers. Use for small, module-local helpers that capture lexical scope. Always use arrows for array methods, event handlers, and React props.
- **Consistency**: Within a file, choose the dominant style that best serves readability. If the file tells a top-down “story”, place the main function first and define helper declarations below; otherwise, use arrows consistently for local helpers.

### Provider Hierarchy (planned)
```
ErrorBoundary (Sentry)
└── TanStack Router (hash mode)
    └── TanStack Query
        └── Wagmi Provider
            └── RainbowKit
                └── Theme Provider
                    └── App
```

## Environment Variables

Required for development:
```bash
VITE_WALLETCONNECT_PROJECT_ID  # Get from WalletConnect Cloud
VITE_BASE_RPC_URL              # Base network RPC
VITE_SENTRY_DSN                # Error tracking
```

See `.env.example` for complete list.

## Project Structure

```
src/
├── components/ui/     # ShadCN UI components
├── features/          # Phase-based features (leverage-tokens, vaults, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Core utilities and configs
│   ├── config/        # Chain, wagmi, rainbowkit configs
│   ├── contracts/     # ABIs and addresses (single source of truth)
│   └── utils/         # Helper functions
├── routes/            # TanStack Router pages
└── types/             # TypeScript type definitions
```

## Testing Strategy

Tests are organized in the `tests/` directory:
```
tests/
├── unit/         # Business logic, calculations
├── integration/  # Blockchain interactions (Anvil Base fork)
├── e2e/         # User flows (Playwright)
├── fixtures/    # Test data and mocks
└── utils/       # Test helpers
```

### Integration Testing with Tenderly VNet (Default)

**IMPORTANT: Tenderly VNet is the default and preferred approach for all integration and E2E tests.**

Integration tests use Tenderly VirtualNet (VNet) for just-in-time blockchain test environments. This approach:
- **Creates VNet instances automatically** - No manual setup required
- **Eliminates API rate limits** - Each test gets a fresh, isolated environment  
- **Provides admin RPC capabilities** - Direct balance/state manipulation for test setup
- **Supports CI/CD environments** - No local infrastructure dependencies

**Anvil is only a fallback** for local development when Tenderly is unavailable.

**Prerequisites:**
```bash
# Tenderly account with API access
# Set environment variables:
export TENDERLY_ACCESS_KEY="your_access_key"
export TENDERLY_ACCOUNT="your_account_slug" 
export TENDERLY_PROJECT="your_project_slug"
```

**Setup:**
1. **Tenderly VNet (Default):**
   ```bash
   # Tests automatically create/delete VNet instances
   bun run test:integration  # Uses Tenderly VNet automatically
   bun run test:e2e          # Uses Tenderly VNet automatically
   ```

2. **Anvil Fallback (Local Development Only):**
   ```bash
   # Terminal 1: Start Anvil Base fork (only if Tenderly unavailable)
   ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base
   
   # Terminal 2: Run tests against local Anvil
   TEST_RPC_URL=http://127.0.0.1:8545 bun run test:integration
   ```

**Key Features:**
- **Just-in-time VNets** - Automatic creation/deletion of isolated test environments
- **Admin RPC capabilities** - Direct balance manipulation via `tenderly_setBalance`, `tenderly_setErc20Balance`  
- **No infrastructure dependencies** - Works in CI/CD without local blockchain nodes
- **Deterministic** - Consistent state with snapshot/revert isolation
- **Per-test funding** - Automatic token funding with `withFork()` helper

**Test Architecture:**
- **Public Client**: Read blockchain state from Base fork  
- **Wallet Client**: Sign and send transactions
- **Test Client**: Anvil-specific actions (`setBalance`, `impersonateAccount`, `snapshot`, `revert`)
- **Funding**: Automatic via WETH deposits or rich holder impersonation

See `tests/integration/README.md` for complete setup guide and CI configuration.

### End-to-End Testing with Playwright

E2E tests verify complete user workflows using real blockchain transactions against Anvil Base fork.

**Test Philosophy:**
- **Happy Path Tests MUST succeed** - Tests named "Happy Path" should complete real transactions successfully, not just validate error handling
- **Real transactions required** - E2E tests execute actual blockchain transactions via Local Account signing
- **Proper funding essential** - Test accounts must have sufficient token balances for the operations being tested

**Key Features:**
- **Mock Wallet + Local Account** - UI uses MockConnector, transactions signed by Local Account (Anvil account #0)
- **Dynamic token funding** - Test setup automatically funds accounts with required tokens (weETH, WETH, etc.)
- **Comprehensive error decoding** - ERC-6093 standard errors are properly decoded and logged
- **Chain alignment validation** - Runtime assertions ensure frontend connects to correct Anvil instance

**Test Structure:**
```
tests/e2e/
├── mint-flow.spec.ts     # Leverage token minting workflows
├── global-setup.ts      # Anvil startup and account funding
├── fund-test-account.ts # Token funding utilities
└── playwright.config.ts # Test mode configuration
```

**Critical Requirements:**
1. **Anvil must run with Base chain ID (8453)** - Configured in `package.json` anvil:base script
2. **Test accounts must have sufficient balances** - Verified before attempting transactions
3. **Happy Path tests must complete successfully** - No passing tests that only validate errors
4. **Environment variables required** - VITE_TEST_MODE=mock, VITE_BASE_RPC_URL=http://127.0.0.1:8545

## Feature Flags

Use `VITE_ENABLE_*` environment variables to control feature visibility for phased releases.

## Component Development Workflow

When building new UI components, always follow this workflow to ensure design consistency and proper implementation:

### 1. Find Component in Figma Make
- **Source**: All components should be extracted from the `_figma` folder
- **Location**: Look in `_figma/src/components/` for existing component implementations
- **Context**: Components are organized by feature (pages, ui, modals, etc.)

### 2. Extract and Create Reusable Component
- **Structure**: Create components in appropriate feature folders (`src/features/*/components/`)
- **Naming**: Use descriptive names that match the Figma component purpose
- **Props**: Design clean, typed interfaces that make components reusable
- **Styling**: Preserve exact Figma styling including colors, spacing, and animations

### 3. Create Storybook Stories
- **Location**: Place stories in `src/stories/features/` mirroring the component structure
- **Variants**: Create multiple story variants showing different states
- **Controls**: Add proper controls for interactive props
- **Documentation**: Use `tags: ['autodocs']` for automatic documentation

### 4. Integration
- **Import**: Import the new component into the relevant pages/features
- **Props**: Map real data to component props appropriately
- **Testing**: Ensure the component works in different states and screen sizes

### Example Workflow
```bash
# 1. Find component in _figma folder
grep -r "Current Holdings" _figma/

# 2. Extract to reusable component
# Create: src/features/leverage-tokens/Features/LeverageTokenHoldingsCard.tsx

# 3. Create Storybook story
# Create: src/stories/features/leverage-tokens/leveragetokenholdingscard.stories.tsx

# 4. Integrate into application
# Import and use in relevant route/page files
```

**Important**: Never create components from scratch when a Figma design exists. Always extract and adapt from the `_figma` folder to maintain design consistency.

## Working Principles

When making changes to this codebase:

### Before Committing
Always run these commands before committing any changes:
- **`bun check:fix`** - Auto-fix linting issues and check types
- **`bun run build`** - Ensure the build succeeds
- **`bun run test:integration`** - Run integration tests if modifying contract interactions (requires Anvil)

### Code Philosophy
- **Code is a liability** - Write less code that does more
- **Explicit over implicit** - Clear intent matters more than cleverness
- **Data over abstractions** - Don't abstract until you have 3+ use cases
- **Test the critical path** - 100% coverage on money-moving code

### Decision Making
- **Question assumptions** - Ask "why" before implementing
- **State confidence levels** - "I'm 90% sure X because Y, but check Z"
- **Clarify ambiguity** - Never guess when you can ask
- **Consider tradeoffs** - Every decision has a cost

### Technical Approach
- **Check latest docs** - Wagmi, Viem, and Web3 tools change frequently
- **IPFS constraints first** - Every feature must work client-side only
- **Bundle size matters** - Check impact of new dependencies
- **Type safety** - If TypeScript complains, fix it properly
- **Components from Figma Make** - All UI components should be derived from designs in the `_figma` folder, not created from scratch

### Common Pitfalls to Avoid
- Don't add server-side features
- Don't assume wallet is connected (check first)
- Don't trust external data (validate everything)

## Known Issues & Solutions

### esbuild Service Errors
If you encounter `The service was stopped` or `The service is no longer running`:
- **Cause**: Usually happens when multiple processes (dev server + build) compete for esbuild
- **Solution**: Kill the dev server before running build: `pkill -f "bun dev"` or close the terminal
- **Prevention**: Don't run `bun dev` and `bun build` simultaneously

### Environment Variable Access
TypeScript requires bracket notation for env vars due to `noPropertyAccessFromIndexSignature`:
- **Use**: `import.meta.env['VITE_VAR']` (not `import.meta.env.VITE_VAR`)
- **Why**: Type safety - ensures you handle potentially undefined values
- **Biome config**: Set `useLiteralKeys: "off"` to avoid linting conflicts
