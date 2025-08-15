# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Seamless Protocol - Frontend application for a DeFi protocol that wraps complex leverage strategies into simple ERC-20 tokens. Built for IPFS deployment as a fully static, client-side application.

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

# Testing (scripts ready, packages not installed)
bun test               # Run unit tests with Vitest (needs setup)
bun test:ui            # Run tests with UI (needs setup)
bun test:coverage      # Run tests with coverage (needs setup)
bun test:e2e           # Run E2E tests with Playwright (needs setup)

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
│   ├── contracts/     # ABIs and addresses
│   └── utils/         # Helper functions
├── routes/            # TanStack Router pages
└── types/             # TypeScript type definitions
```

## Testing Strategy

Tests are organized in the `tests/` directory:
```
tests/
├── unit/         # Business logic, calculations
├── integration/  # Blockchain interactions (Anvil)
├── e2e/         # User flows (Playwright)
├── fixtures/    # Test data and mocks
└── utils/       # Test helpers
```

## Feature Flags

Use `VITE_ENABLE_*` environment variables to control feature visibility for phased releases.

## Working Principles

When making changes to this codebase:

### Before Committing
Always run these commands before committing any changes:
- **`bun check:fix`** - Auto-fix linting issues and check types
- **`bun run build`** - Ensure the build succeeds

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

### Common Pitfalls to Avoid
- Don't add server-side features
- Don't assume wallet is connected (check first)
- Don't trust external data (validate everything)