# Seamless Protocol Frontend

A decentralized frontend application for Seamless Protocol - a DeFi protocol that wraps complex leverage strategies into simple ERC-20 tokens.

## Overview

This is a fully client-side application built for IPFS deployment, requiring no server infrastructure. The app provides a user-friendly interface for interacting with Seamless Protocol's leverage tokens, vaults, and governance features.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Blockchain**: Wagmi v2 + Viem + RainbowKit
- **Styling**: Tailwind CSS v4 + ShadCN UI
- **Routing**: TanStack Router (hash routing for IPFS)
- **Data Fetching**: TanStack Query
- **Package Manager**: Bun
- **Code Quality**: Biome + TypeScript strict mode

## Getting Started

### Prerequisites

- Bun 1.2.20+ (required)
- Node.js 18+ (for some tooling)

### Installation

```bash
# Clone the repository
git clone git@github.com:seamless-protocol/app.git
cd app

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

### Development

```bash
# Start development server
bun dev

# Run code checks and auto-fix
bun check:fix

# Build for production
bun build

# Preview production build
bun preview
```

## Development Phases

The application is structured for incremental releases:

1. **Phase 1**: Foundation & Infrastructure ✅
2. **Phase 2**: Leverage Tokens (in progress)
3. **Phase 3**: User Dashboard
4. **Phase 4**: Morpho Vaults
5. **Phase 5**: Staking
6. **Phase 6**: Governance
7. **Phase 7**: Advanced Features

## Project Structure

```
src/
├── components/ui/      # ShadCN UI components
├── features/          # Phase-based feature modules
├── hooks/             # Custom React hooks
├── lib/               # Core utilities and configs
│   ├── config/        # Chain and protocol configs
│   ├── contracts/     # ABIs and addresses
│   └── utils/         # Helper functions
├── routes/            # Application pages
└── types/             # TypeScript definitions
```

## Environment Variables

### Setup

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your values
```

### Required Variables

These must be set for the application to start:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Get from [cloud.walletconnect.com](https://cloud.walletconnect.com/) |
| `VITE_BASE_RPC_URL` | Base network RPC endpoint | `https://mainnet.base.org` |
| `VITE_ETHEREUM_RPC_URL` | Ethereum mainnet RPC | `https://eth.llamarpc.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SENTRY_DSN` | Error tracking | None |
| `VITE_ENABLE_LEVERAGE_TOKENS` | Feature flag | `false` |
| `VITE_ENABLE_VAULTS` | Feature flag | `false` |
| `VITE_ENABLE_STAKING` | Feature flag | `false` |
| `VITE_ENABLE_GOVERNANCE` | Feature flag | `false` |

### Contract Addresses

The app includes pre-configured contract addresses for Seamless Protocol on Base network. See `.env.example` for the complete list of available contract configurations.

### Environment Validation

The app validates required environment variables on startup. If any are missing:
- **Development**: Shows an error banner with missing variables
- **Production**: Logs to console and prevents app from starting

See `.env.example` for the complete configuration reference.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun check` | Run linter and type checker |
| `bun check:fix` | Auto-fix issues and type check |
| `bun format` | Format code with Biome |

## Deployment

The application is built for IPFS deployment:

1. Build creates a static bundle with relative paths
2. Hash routing ensures all routes work without a server
3. All data fetching happens client-side

```bash
# Build for IPFS
bun build

# Deploy dist/ folder to IPFS
```

## Contributing

Please ensure all code passes checks before submitting PRs:

```bash
bun check:fix
```

## Testing Deployment

This deployment test was added on 2025-08-25 to verify Vercel deployment functionality.

## License

[License details to be added]