# Phase II Leverage Tokens - Handoff Document

## 🎯 Current Status: Router-Based Architecture Foundation Complete

This branch contains the foundational infrastructure for Router-based leverage token minting. **The mint flow is NOT completely implemented** - this is scaffolding and architecture work.

---

## ✅ What's Been Implemented

### 1. **Correct Architecture Discovery & Implementation**
- **Fixed fundamental issue**: Frontend was trying to mint tokens directly (`token.mint()`)
- **Implemented correct flow**: User → Router → Manager → LeverageToken
- Router-based approach matches the actual deployed contract architecture

### 2. **Contract Integration**
- `leverageRouter.ts` - Complete Router ABI with mint/redeem functions
- `leverageManager.ts` - Manager ABI with previewMint for share calculations  
- Updated contract addresses to include Router
- All ABIs match deployed Base mainnet contracts

### 3. **Core Hook Infrastructure**
- `useMintViaRouter` hook - Router-based minting with proper flow
- Handles: preview → approve → simulate → write → wait
- Includes slippage protection and auto-approval
- **BUT**: SwapContext is currently placeholder/noop implementation

### 4. **Testing Infrastructure**
- Tenderly Virtual TestNet integration working
- Real contract testing against deployed Base contracts
- Integration tests validate the Router approach
- Tests confirm noop SwapContext correctly fails (as expected)

### 5. **Type System & Utilities**
- `SwapContext` types matching Router ABI exactly
- Helper functions for noop/single-hop contexts
- Proper error handling and classification

---

## ❌ What's NOT Complete (Critical Gaps)

### 1. **DEX Integration - MISSING**
The biggest gap is SwapContext configuration:
- Router expects valid DEX routing for leverage operations
- Current implementation uses noop SwapContext (intentionally fails)
- Need actual Aerodrome/Uniswap router addresses and path encoding
- **Without this, minting will always fail**

### 2. **Frontend UI - MISSING**
- No actual mint/redeem components built
- No user-facing forms or interfaces
- Hook exists but nothing calls it

### 3. **Real User Flow Testing**
- Tests use simulated funding via Tenderly admin
- No end-to-end user wallet testing
- Need testing with real wallet connections and approvals

### 4. **Production Configuration**
- SwapContext configuration for Base DEXes missing
- Fee tier and routing optimization not implemented
- Max slippage and swap cost calculations need refinement

---

## 🔧 Files Changed

### New Files
```
src/features/leverage-tokens/hooks/useMintViaRouter.ts
src/features/leverage-tokens/utils/swapContext.ts  
src/lib/contracts/abis/leverageManager.ts
src/lib/contracts/abis/leverageRouter.ts
tests/integration/router.mint.test.ts
tests/integration/FINDINGS.md
```

### Modified Files
```
src/features/leverage-tokens/index.ts - Export new hook
src/lib/contracts/addresses.ts - Add Router address
tests/integration/setup.ts - Tenderly VNet config  
tests/integration/utils.ts - Test helpers
tests/unit/useMintToken.test.tsx - Updated for new hook
```

### Removed Files (Deprecated)
```
src/features/leverage-tokens/hooks/useMintToken.ts
tests/integration/mint.test.ts
```

---

## 🚨 Immediate Next Steps for Handoff Engineer

### Priority 1: DEX Integration (CRITICAL)
```typescript
// Need to implement proper SwapContext for Base DEXes
const realSwapContext = {
  path: [USDC_ADDRESS, WETH_ADDRESS], // Actual routing path
  encodedPath: encodeV3Path([USDC, WETH], [3000]), // Proper encoding
  exchange: Exchange.AERODROME_V2, // Or UNISWAP_V3
  exchangeAddresses: {
    aerodromeRouter: '0x...', // Real Base Aerodrome addresses
    uniswapSwapRouter02: '0x...', // Real Base Uniswap addresses
    // ... other DEX addresses
  }
}
```

### Priority 2: Frontend Components
```typescript
// Build actual UI components
- MintForm component
- RedeemForm component  
- Token selection interface
- Slippage settings
- Transaction status/confirmation
```

### Priority 3: Complete Integration Testing
- Test with real DEX routing (once implemented)
- End-to-end user flow testing
- Error scenario coverage
- Gas optimization testing

---

## 📋 Architecture Decisions Made

### Router-Based Flow (Correct)
```
User funds → Approve Router → Router.mint() → Manager.mint() → LeverageToken
```

### Slippage Protection
- Uses Manager.previewMint() to calculate expected shares
- Applies user-specified slippage tolerance (default 50 bps)
- Protects against MEV and price impact

### Test Strategy
- Unit tests: Business logic and error handling
- Integration tests: Real contract interaction on Tenderly VNet  
- E2E tests: Full user flows (planned, not implemented)

---

## 🔍 Key Discoveries from Testing

### 1. **Architecture Issue Found & Fixed**
- Original frontend approach was fundamentally wrong
- Leverage tokens are owned by Manager, not directly mintable
- Router pattern is the correct approach per contract design

### 2. **Contract Verification**  
- All contract addresses and ABIs validated against Base mainnet
- previewMint function works correctly for share calculations
- Router properly validates SwapContext (rejects noop as expected)

### 3. **Integration Infrastructure Works**
- Tenderly VNet connection successful  
- Real contract interaction verified
- Test isolation with snapshots working

---

## 🎯 Success Criteria for Completion

### Minimum Viable Implementation
- [ ] DEX routing configuration complete
- [ ] Basic mint/redeem UI components
- [ ] Integration tests passing with real DEX calls
- [ ] End-to-end user flow working

### Production Ready
- [ ] Multi-DEX routing optimization
- [ ] Comprehensive error handling  
- [ ] Gas optimization
- [ ] Security audit of DEX integration
- [ ] User education/documentation

---

## 🔗 Related Issues & PRs

- Issue #29: Tenderly integration testing harness ✅ Complete
- Integration with PR #35 (unit tests) and PR #36 (E2E tests) ✅ Coordinated
- Next: DEX integration and frontend components

---

## 🧠 Context for Next Engineer

This work establishes the **correct architectural foundation** for leverage token minting. The previous approach was wrong at a fundamental level. What we have now:

1. **Correct contract integration** - Router-based approach matches deployment
2. **Solid testing infrastructure** - Can validate changes against real contracts  
3. **Type-safe implementation** - All ABIs and types properly defined
4. **Clear remaining work** - DEX integration is the main blocker

The foundation is solid, but significant work remains to make it user-facing functional.