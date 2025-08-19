# Seamless Protocol v2 — Phase II Execution Plan: Leverage Tokens

*Test-first, Bun-native, multi-chain, IPFS-ready*

## Overview

Phase II delivers a production-ready leverage tokens experience where users can discover tokens, view details, simulate transactions, mint, redeem, and track their portfolio with P&L—all with zero server dependencies for IPFS deployment.

## Architecture Principles

- **Client-only SPA** with hash routing (`base: './'` for IPFS)
- **Router-based minting** (User → Router → Manager → LeverageToken)
- **No optimistic updates** for on-chain state (wait for confirmation)
- **Three-layer testing**: Unit → Integration (Tenderly) → E2E (MockConnector)
- **Error classification** with actionable Sentry filtering
- **Multi-chain ready** with per-chain query keys

> **Architecture Update**: During testing, discovered that leverage tokens cannot be minted directly (`token.mint()` fails with `OwnableUnauthorizedAccount`). The correct flow is Router-based: `Router.mint()` → `Manager.mint()` → LeverageToken creation.

## Team Structure

- **Tech Lead**: Cross-cutting decisions, first write path (mint), code reviews
- **Engineer 2**: Vertical feature slices, token discovery, redeem, portfolio

## Today's 2-Hour Sprint (Foundation)

### Timeline
- **0:00-0:15** — Install dependencies & verify scripts
- **0:15-0:35** — Create scaffolding (queryKeys, errors, hooks)
- **0:35-1:05** — Tenderly integration test setup
- **1:05-1:30** — E2E test with MockConnector
- **1:30-1:55** — Unit test for useMintViaRouter
- **1:55-2:00** — Handoff documentation

### Deliverable
Complete mint flow working at all 3 test layers (even if stubbed), providing the template for all other features.

## File Structure

```
src/features/leverage-tokens/
├── utils/
│   ├── queryKeys.ts          # Hierarchical query key pattern
│   ├── errors.ts             # Error types & classifier
│   └── constants.ts          # Chain-specific constants
├── hooks/
│   ├── useLeverageTokenFactory.ts
│   ├── useLeverageTokenMetadata.ts
│   ├── useTokenTotalSupply.ts
│   ├── useTokenPrice.ts
│   ├── useRebalancingStatus.ts
│   ├── useUserTokenBalance.ts
│   ├── useMintSimulation.ts
│   ├── useRedeemSimulation.ts
│   ├── useMintViaRouter.ts   # Router-based minting, no optimistic updates
│   └── useRedeemToken.ts
├── components/
│   ├── TokenList.tsx
│   ├── TokenCard.tsx
│   ├── TokenDetail.tsx
│   ├── TokenStats.tsx
│   ├── TokenActions.tsx
│   └── Portfolio.tsx
└── types/
    └── index.ts

tests/
├── setup.ts                  # Global test setup & mocks
├── utils.tsx                 # Shared test utilities & helpers
├── unit/                     # Application logic
│   ├── leverage-calculations.test.ts
│   └── useMintViaRouter.test.tsx
├── integration/              # Contract behavior
│   ├── tenderlyAdmin.ts
│   └── mint.spec.ts
└── e2e/                      # User journey
    └── mint.spec.ts
```

## Core Patterns

### Query Keys (Hierarchical)
```typescript
export const ltKeys = {
  all: ['leverage-tokens'] as const,
  factory: () => [...ltKeys.all, 'factory'] as const,
  tokens: () => [...ltKeys.all, 'tokens'] as const,
  token: (addr: `0x${string}`) => [...ltKeys.tokens(), addr] as const,
  user: (addr: `0x${string}`, owner: `0x${string}`) => 
    [...ltKeys.token(addr), 'user', owner] as const,
  supply: (addr: `0x${string}`) => [...ltKeys.token(addr), 'supply'] as const,
  price: (addr: `0x${string}`) => [...ltKeys.token(addr), 'price'] as const,
  rebalancing: (addr: `0x${string}`) => [...ltKeys.token(addr), 'rebalancing'] as const,
}
```

### Error Classification
```typescript
export type LeverageTokenError =
  | { type: 'STALE_ORACLE'; lastUpdate: number }
  | { type: 'REBALANCING_IN_PROGRESS'; estimatedCompletion?: number }
  | { type: 'INSUFFICIENT_LIQUIDITY'; available: bigint; required: bigint }
  | { type: 'USER_REJECTED'; code: 4001 }
  | { type: 'CHAIN_MISMATCH'; expected: number; actual: number }
  | { type: 'UNKNOWN'; message: string }

export function classifyError(e: unknown): LeverageTokenError {
  const any = e as any
  if (any?.code === 4001) return { type: 'USER_REJECTED', code: 4001 }
  if (any?.code === 4902) return { type: 'CHAIN_MISMATCH', expected: any?.expectedChainId, actual: any?.actualChainId }
  return { type: 'UNKNOWN', message: any?.message ?? 'Unknown error' }
}
```

### Write Hook Pattern (No Optimistic Updates)
```typescript
export function useMintViaRouter(token: `0x${string}`, owner: `0x${string}`) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...ltKeys.token(token), 'mint', owner],
    mutationFn: async (amount: bigint) => {
      const { request } = await simulateContract(config, {
        address: token, abi: tokenAbi, functionName: 'mint', args: [amount], account: owner,
      })
      const hash = await writeContract(config, request)
      const receipt = await waitForTransactionReceipt(config, { hash })
      return receipt
    },
    onSuccess: () => {
      // Invalidate after confirmation
      qc.invalidateQueries({ queryKey: ltKeys.user(token, owner) })
      qc.invalidateQueries({ queryKey: ltKeys.supply(token) })
      qc.invalidateQueries({ queryKey: ['portfolio', owner] })
    },
    onError: (e) => {
      const err = classifyError(e)
      // User errors don't go to Sentry
      if (err.type !== 'USER_REJECTED' && err.type !== 'CHAIN_MISMATCH') {
        capture(e, { chainId, token, method: 'mint' })
      }
      throw err
    },
  })
}
```

### Sentry Configuration (Actionable Only)
```typescript
Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'],
  beforeSend(event, hint) {
    const code = (hint?.originalException as any)?.code
    // Drop expected UX errors
    if (code === 4001 || code === 4902) return null
    // Add context
    const ctx = (hint?.originalException as any)?.context
    if (ctx) {
      event.tags = { ...event.tags, chainId: ctx.chainId, token: ctx.token, method: ctx.method }
    }
    return event
  },
})
```

## Testing Strategy

### 1. Unit Tests (Application Logic)
- Test hook state transitions
- Verify query invalidations
- Error classification
- No blockchain interaction

### 2. Integration Tests (Contract Behavior)
- Use Tenderly Virtual TestNet
- Snapshot/revert per test
- Test actual contract mutations
- Verify on-chain state changes

### 3. E2E Tests (User Journey)
- Playwright with MockConnector
- Test complete user flows
- Verify UI updates after transactions
- Test error scenarios (reject, wrong chain)

## Environment Configuration

```env
# Testing
TENDERLY_PUBLIC_RPC=xxx
TENDERLY_ADMIN_RPC=xxx
E2E_TEST_TOKEN_ADDRESS=xxx
E2E_TEST_ACCOUNT=xxx
VITE_TEST_MODE=mock

# Production
VITE_WALLETCONNECT_PROJECT_ID=xxx
VITE_BASE_RPC_URL=xxx
VITE_SEAMLESS_SUBGRAPH_URL=xxx
VITE_SENTRY_DSN=xxx

# Contract Addresses (Base)
VITE_FACTORY_ADDRESS=0xE0b2e40EDeb53B96C923381509a25a615c1Abe57
VITE_MANAGER_ADDRESS=0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8
VITE_MULTICALL3_ADDRESS=0xcA11bde05977b3631167028862bE2a173976CA11
```

## Performance SLOs

- Token list load: **< 2s p95**
- Price updates: **< 500ms**
- Simulation: **< 3s**
- Transaction confirmation: **< 30s**
- Write success rate: **≥ 98%** (excluding cancellations)
- CI flake rate: **< 1%**

## GitHub Issues (Phase II)

### Epic
**EPIC — Phase II: Leverage Tokens**
- Deliver discovery, detail, simulation, mint, redeem, portfolio
- Robust testing at 3 layers
- Meets all SLOs

### P0 Issues (Must Have)
1. **Scaffolding** - QueryKeys, errors, features
2. **Discovery Hooks** - Factory, metadata, supply, price
3. **Token UI** - List, detail, simulations
4. **Tenderly Tests** - Integration harness
5. **Mint Hook** - Write flow implementation
6. **Redeem Hook** - Mirror mint patterns
7. **UI Integration** - Switch-on-write UX
8. **Telemetry** - Sentry configuration
9. **CI Pipeline** - PR gates

### P1 Issues (Should Have)
10. **Portfolio** - Balances, P&L
11. **Subgraph** - Historical data
12. **Performance** - IPFS hardening
13. **Documentation** - JSDoc, tooltips
14. **Risk Controls** - Kill switches

## Milestones

### Milestone 1: Discovery & Read (Days 1-2)
- Token list from factory
- Metadata, price, rebalancing status
- Simulations (no writes)

### Milestone 2: Write Flows (Days 3-4)
- Mint with approval flow
- Redeem with confirmation
- Switch-on-write UX

### Milestone 3: Portfolio (Day 5)
- User balances
- P&L calculations
- Multi-chain aggregation

### Milestone 4: Hardening (Week 2)
- Subgraph integration
- Performance optimization
- Documentation
- Risk controls

## CI/CD Pipeline

### PR-Blocking (Fast)
```yaml
- bun install
- bun check:fix      # Biome + TypeScript
- bun build          # IPFS-safe (base: './')
- bun test           # Unit + MSW
- bun test:e2e       # Playwright + MockConnector
```

### Nightly (Comprehensive)
- Tenderly integration suite
- Multi-chain matrix (Base → Ethereum)
- Negative test cases
- Bundle size analysis

## Next Steps for Engineer 2

After today's foundation:
1. Wire remaining read hooks
2. Implement redeem (copy mint patterns)
3. Build token discovery UI
4. Add portfolio aggregation
5. Integrate subgraph for historical data

## Success Criteria

✅ Three-layer test coverage
✅ No server dependencies (IPFS-ready)
✅ Meets all performance SLOs
✅ Works with deployed contracts on Base
✅ Proper error handling and classification
✅ Feature flags for experimental features
✅ Clear patterns for future development