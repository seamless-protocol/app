# Test Architecture

This document explains the testing setup for the Seamless Protocol frontend application.

## Test Types

### 1. Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions and components in isolation
- **Framework**: Vitest with jsdom environment
- **Command**: `bun run test`
- **No blockchain interaction**: Mocks and fixtures only

### 2. Integration Tests (`tests/integration/`)
- **Purpose**: Test blockchain interactions against Base fork
- **Framework**: Vitest with custom setup
- **Command**: `bun run test:integration`
- **Backend**: Tenderly VNet (default) or Anvil (local development)

### 3. End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows through the UI
- **Framework**: Playwright
- **Command**: `bun run test:e2e`
- **Backend**: Tenderly VNet (default) or Anvil (local development)

## Backend Configuration

### Default: Tenderly VNet (Cloud)
Tests automatically create ephemeral Base forks using Tenderly VNet when these environment variables are present:
```bash
TENDERLY_ACCESS_KEY=your_access_key
TENDERLY_ACCOUNT=your_account
TENDERLY_PROJECT=your_project
```

### Fallback: Anvil (Local Development)
When Tenderly config is missing, tests fall back to local Anvil:
```bash
# Terminal 1: Start Anvil Base fork
bun run anvil:base

# Terminal 2: Run tests  
bun run test:integration
bun run test:e2e
```

### Override: Explicit RPC URL
Force tests to use a specific RPC URL:
```bash
TEST_RPC_URL=https://your-rpc.com bun run test:integration
```

## Integration Test Pattern

Integration tests use a **per-test funding** approach for clarity and explicitness:

```typescript
import { withFork } from './utils'

it('should mint leverage tokens', async () =>
  withFork(async ({ account, publicClient, fund, ADDR }) => {
    // Explicit funding - clear what this test needs
    await fund.native([account.address], '10') // 10 ETH for gas
    await fund.erc20(ADDR.weeth, [account.address], '5') // 5 weETH tokens
    
    // Test business logic...
  })
)
```

### Why Per-Test Funding?
- **Explicit**: Each test shows exactly what funding it needs
- **Isolated**: No hidden dependencies on global setup
- **Clear**: Easy to understand test requirements when reading code
- **Reliable**: Each test starts with known, clean state

## File Structure

Structure mirrors `src/features/` for easy navigation:

```
tests/
├── README.md                 # This documentation
├── setup.ts                  # Vitest setup (unit tests)
├── unit/                     # Isolated component/function tests
├── integration/              # Blockchain interaction tests
│   ├── leverage-tokens/      # Mirror src/features/leverage-tokens/
│   │   ├── mint/
│   │   │   ├── domain.test.ts    # Domain logic tests
│   │   │   └── router.test.ts    # Router integration tests
│   │   └── tvl/
│   │       └── protocol.test.ts  # TVL calculation tests
│   ├── vaults/               # Future: src/features/vaults/ tests
│   ├── staking/              # Future: src/features/staking/ tests
│   ├── governance/           # Future: src/features/governance/ tests
│   ├── setup.ts              # Integration test configuration  
│   ├── utils.ts              # withFork wrapper & funding utilities
│   └── vitest.config.ts      # Integration-specific Vitest config
├── e2e/                      # End-to-end user workflow tests
│   ├── leverage-tokens/      # Feature-specific E2E flows
│   │   └── mint-flow.spec.ts     # Minting user workflows
│   ├── navigation/           # General app navigation tests
│   │   └── app-navigation.spec.ts
│   ├── global-setup.ts       # Playwright global setup (Anvil startup)
│   └── debug-*.spec.ts       # Debug/utility E2E tests
├── shared/                   # Shared utilities across test types
│   ├── backend.ts            # Backend detection (Tenderly vs Anvil)
│   ├── clients.ts            # Viem client setup
│   ├── env.ts                # Environment variables & addresses
│   ├── funding.ts            # Token funding utilities
│   └── withFork.ts           # Snapshot/revert isolation
└── fixtures/                 # Test data and mocks
```

## Key Design Decisions

### No Global Funding
- E2E tests are UI smoke tests (no blockchain transactions)
- Integration tests handle funding per-test
- Clear, explicit test requirements

### Tenderly VNet Default
- No API rate limits unlike traditional RPC endpoints
- Fast ephemeral forks created/destroyed per test run
- Anvil fallback for local development

### Isolation via Snapshots
- Each integration test starts with a clean fork snapshot
- Tests revert to snapshot after completion
- Prevents test pollution and ensures deterministic results

## Running Tests

```bash
# Unit tests (fast, no blockchain)
bun run test

# Integration tests (blockchain interactions)
bun run test:integration

# E2E tests (full UI workflows)  
bun run test:e2e

# All tests with coverage
bun run test:coverage
```

## Troubleshooting

### "Anvil not found"
Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### "Service stopped" errors  
Kill conflicting processes:
```bash
pkill -f "bun dev"
```

### Test timeouts
Integration and E2E tests have longer timeouts due to blockchain interactions:
- Integration: 2 minutes per test
- E2E: 30 seconds per test, 15s navigation timeout
