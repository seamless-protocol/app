# Phase II Handoff - Leverage Tokens

## Status: Foundation Complete, Tests Needed for Full Handoff 🟡

PR #34 establishes the foundation scaffolding. **Tests still need to be implemented** to provide the complete template for parallel development.

## What's Been Done

### Foundation (Complete)
- ✅ Query key patterns established (`ltKeys`)
- ✅ Error classification system (user vs actionable)
- ✅ Wagmi CLI integration for type-safe hooks
- ✅ Example write hook (`useMintToken`) with proper patterns
- ✅ Example read hook (`useTokenMetadata`) with multicall optimization
- ✅ Logger with Sentry integration
- ✅ Feature flags configured
- ✅ Test dependencies installed

### What's Still Needed (Per Execution Plan)
- ❌ Tenderly integration test for mint flow
- ❌ E2E test with MockConnector for mint flow  
- ✅ Unit test for useMintToken hook (with shared utilities)
- ❌ Complete mint flow working at all 3 test layers

**These tests are critical** - they provide the template patterns that Engineer 2 will follow for all other features.

### Patterns Established

#### 1. Query Keys (src/features/leverage-tokens/utils/queryKeys.ts)
```typescript
ltKeys.all                           // ['leverage-tokens']
ltKeys.tokens()                      // ['leverage-tokens', 'tokens']
ltKeys.token(address)                // ['leverage-tokens', 'tokens', address]
ltKeys.user(token, owner)            // ['leverage-tokens', 'tokens', token, 'user', owner]
```

#### 2. Write Operations Pattern (useMintToken)
- Simulate → Write → Wait for receipt
- No optimistic updates
- Proper error classification
- Query invalidation after confirmation

#### 3. Read Operations Pattern
- Use multicall for multiple values (useTokenMetadata)
- Use Wagmi CLI generated hooks for single values
- Proper stale time configuration

#### 4. Testing Pattern (Unit Tests)
- Use shared utilities from `tests/utils/*.tsx`
- Follow established mock patterns
- Test hook state transitions and query invalidations
- No blockchain interaction in unit tests

## Parallel Work Tracks

### Track A: Token Discovery & List (Engineer 2)
**Issue**: #27 - Token Discovery & List View
**Files to create**:
- `hooks/useLeverageTokenFactory.ts` - Fetch all tokens from factory
- `components/TokenList.tsx` - Display grid/list of tokens
- `components/TokenCard.tsx` - Individual token display

**Dependencies**: None - can start immediately

### Track B: Token Details & Metadata (Engineer 2)
**Issue**: #28 - Token Detail View
**Files to create**:
- `hooks/useTokenPrice.ts` - Fetch token price from oracle
- `hooks/useRebalancingStatus.ts` - Check rebalancing state
- `components/TokenDetail.tsx` - Detailed token view
- `components/PriceChart.tsx` - Price visualization

**Dependencies**: Track A (for navigation)

### Track C: Mint Flow (Tech Lead - In Progress)
**Issue**: #31 - Mint Flow
**Files to enhance**:
- `hooks/useMintSimulation.ts` - Simulate mint before execution
- `components/MintDialog.tsx` - Mint UI with amount input
- `components/TransactionStatus.tsx` - Tx progress indicator

**Dependencies**: Track B (for token selection)

### Track D: Redeem Flow (Engineer 2)
**Issue**: #32 - Redeem Flow
**Files to create**:
- `hooks/useRedeemToken.ts` - Redeem write operation
- `hooks/useRedeemSimulation.ts` - Simulate redemption
- `components/RedeemDialog.tsx` - Redeem UI

**Dependencies**: Track C (follow same patterns)

### Track E: Portfolio & User Balances (Either)
**Issue**: #33 - Portfolio View
**Files to create**:
- `hooks/useUserTokenBalance.ts` - User's token balance
- `hooks/usePortfolio.ts` - All user positions
- `components/Portfolio.tsx` - Portfolio view
- `components/PositionCard.tsx` - Individual position

**Dependencies**: Tracks C & D

### Track F: Testing Infrastructure (Tech Lead)
**Issue**: #29, #30 - Testing
**Files to create**:
- `tests/integration/tenderly.test.ts` - Integration tests
- `tests/e2e/leverageTokens.spec.ts` - E2E tests
- `tests/unit/hooks.test.ts` - Unit tests

**Dependencies**: None - can start immediately

## Code Review Checklist

For each PR, ensure:

### Patterns
- [ ] Follows established query key patterns
- [ ] Uses multicall for multiple reads
- [ ] No optimistic updates for on-chain state
- [ ] Proper error classification (user vs actionable)
- [ ] Includes data-testid attributes for E2E

### Testing
- [ ] Unit tests for business logic
- [ ] Integration test with Tenderly (if applicable)
- [ ] E2E test for user flows (if UI component)

### Performance
- [ ] Appropriate stale times configured
- [ ] No unnecessary re-renders
- [ ] Queries properly cached

### Security
- [ ] Input validation
- [ ] Slippage protection (for swaps)
- [ ] Error boundaries for UI components

## Communication

- **Daily Sync**: Quick status on blockers
- **PR Reviews**: Tag @me for Tech Lead review
- **Questions**: Use GitHub issue comments for context

## Next Steps

1. **Engineer 2**: Start with Track A (Token Discovery)
2. **Tech Lead**: Complete Track C (Mint Flow) and Track F (Testing)
3. **Both**: Review this document and confirm understanding

## Resources

- [Execution Plan](./EXECUTION_PLAN.md) - Overall Phase II plan
- [GitHub Issues](https://github.com/seamless-protocol/app/issues?q=is%3Aopen+label%3Aphase%3AII) - All Phase II tasks
- [Wagmi Docs](https://wagmi.sh) - For hook patterns
- [TanStack Query](https://tanstack.com/query) - For caching patterns

---

*Ready to build! 🚀*