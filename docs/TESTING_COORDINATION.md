# Testing Strategy Coordination

**Status:** Coordinating two parallel testing implementations  
**PR #35:** Comprehensive unit testing infrastructure  
**Branch:** `feature/phase-2-test-scaffolding` - Three-layer testing approach

## Executive Summary

Both testing approaches are complementary and should be merged into a unified three-layer testing strategy:

1. **Unit Tests** (PR #35 foundation) - Fast, isolated hook logic testing
2. **Integration Tests** (New addition) - Contract interaction validation via Tenderly
3. **E2E Tests** (New addition) - Full user journey validation via Playwright

## Key Findings

### What Works Well in PR #35
- ✅ **Excellent developer experience** with utilities (`makeAddr`, `mockSetup`, `hookTestUtils`)
- ✅ **Comprehensive documentation** in `UNIT_TESTING_GUIDE.md`
- ✅ **Complete hook testing patterns** for mutations and queries
- ✅ **Proper error classification testing** (actionable vs non-actionable)
- ✅ **Query invalidation verification** patterns

### What PR #35 is Missing
- ❌ **Integration testing** - No validation of actual contract interactions
- ❌ **E2E testing** - No browser-based user flow validation
- ❌ **Over-specified mocks** - Tests are brittle and tied to wagmi implementation details

### What My Approach Adds
- ✅ **Tenderly integration** - Real contract testing on forked blockchain
- ✅ **Three-layer architecture** - Clear separation of testing concerns  
- ✅ **E2E scaffolding** - Playwright setup for user journey testing
- ✅ **Template approach** - Focus on patterns for parallel development

## Coordination Strategy

### Phase 1: Immediate Coordination (This Week)
1. **Merge utilities** - Keep PR #35's excellent `tests/utils.tsx` and `mockSetup`
2. **Update documentation** - Extend `UNIT_TESTING_GUIDE.md` to cover all three layers
3. **Refactor brittle tests** - Remove over-specific `toHaveBeenCalledWith` assertions
4. **Add integration layer** - Implement Tenderly testing alongside existing unit tests

### Phase 2: Implementation (Next Sprint)
1. **Create integration test examples** - Proof-of-concept for critical hooks
2. **Establish E2E patterns** - Minimal Playwright coverage for key user flows
3. **Update CI pipeline** - Run all three test layers in appropriate environments

## Recommended File Structure

```
tests/
├── unit/                    # PR #35 approach (refined)
│   ├── useMintToken.test.tsx      # Hook logic, state, error classification
│   ├── useTokenMetadata.test.tsx  # Query patterns
│   └── queryKeys.test.ts          # Pure function testing
├── integration/             # New addition
│   ├── setup.ts                   # Tenderly fork management
│   ├── mint.test.ts              # Contract interaction validation
│   └── portfolio.test.ts         # Multi-contract flows
├── e2e/                     # New addition
│   ├── mint.spec.ts              # Full user journey
│   └── portfolio.spec.ts         # Multi-page flows
├── utils.tsx                # Merge both approaches
├── setup.ts                 # Enhanced global setup
└── fixtures/                # Shared test data
```

## Testing Layer Responsibilities

### Unit Tests (Keep PR #35's Excellent Foundation)
**Purpose:** Fast, isolated testing of hook logic and state management
**Scope:** 
- Hook state transitions (`isPending`, `isSuccess`, `error`)
- Query key generation and hierarchy
- Error classification (actionable vs non-actionable)
- Query invalidation patterns
- Callback execution (`onSuccess`, `onError`)

**Remove:** Brittle `toHaveBeenCalledWith` assertions on wagmi functions

### Integration Tests (New Addition)
**Purpose:** Validate actual contract interactions against real blockchain state
**Scope:**
- End-to-end contract call flows (simulate → write → wait)
- Contract state changes verification
- Gas estimation accuracy
- ABI compatibility
- Multi-contract interaction flows

### E2E Tests (New Addition)  
**Purpose:** Critical user journey validation in real browser environment
**Scope:**
- Wallet connection flows
- Multi-step transactions
- Error state handling in UI
- Cross-page navigation

## Implementation Plan

### Step 1: Documentation Update
Update `UNIT_TESTING_GUIDE.md` to become comprehensive `TESTING_GUIDE.md`:
```markdown
# Testing Guide - Three Layer Strategy

## Quick Start by Layer
- Unit Tests: Hook logic and state
- Integration Tests: Contract interactions  
- E2E Tests: User journeys

## Templates and Examples
[Include examples for all three layers]
```

### Step 2: Refactor Existing Unit Tests
Remove brittle assertions in `useMintToken.test.tsx`:
```typescript
// ❌ Remove this brittle assertion
expect(simulateContract).toHaveBeenCalledWith(
  expect.any(Object),
  expect.objectContaining({ /* specific args */ })
)

// ✅ Keep this focused assertion  
expect(result.current.isSuccess).toBe(true)
expect(result.current.data).toEqual({ hash: mockHash, receipt: mockReceipt })
```

### Step 3: Add Integration Test Proof-of-Concept
Create `tests/integration/useMintToken.test.ts` that:
- Creates Tenderly fork
- Funds test account  
- Calls actual hook against real contracts
- Verifies on-chain state changes

### Step 4: Minimal E2E Coverage
Create `tests/e2e/critical-path.spec.ts` covering:
- Connect wallet → Mint token → Verify portfolio update

## Success Metrics

- **Unit Test Coverage:** 90%+ on hook logic (fast execution <100ms per test)
- **Integration Coverage:** 100% on critical contract interactions
- **E2E Coverage:** 100% on money-moving user flows
- **Developer Experience:** <5min to add new test following templates
- **CI Performance:** Total test suite <5min execution time

## Next Actions

1. **Immediate:** Update and merge testing documentation
2. **This Week:** Refactor brittle unit tests in `useMintToken`
3. **Next Week:** Implement integration test proof-of-concept
4. **Following Week:** Basic E2E coverage for mint flow

---

This coordination ensures we keep the best of both approaches while eliminating weaknesses and providing comprehensive test coverage across all layers.