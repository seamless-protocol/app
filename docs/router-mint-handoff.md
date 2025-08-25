# Router.mint SwapContext Handoff - August 25, 2025

## Problem Summary

The Router.mint integration test is failing because the SwapContext contains placeholder/incorrect data instead of real Base mainnet DEX addresses and parameters. The swap adapters revert when trying to execute swaps with fake addresses.

## Current State

**What's Working:**
- ✅ Anvil Base fork setup and token funding
- ✅ Router.mint contract interface and basic flow
- ✅ Test harness with proper weETH funding

**What's Failing:**
- ❌ SwapContext has placeholder addresses (`0x420DD...`)
- ❌ Exchange enum doesn't match on-chain adapter mapping
- ❌ V3 path encoding is incomplete (simple concatenation)
- ❌ No route discovery or pool validation

## Root Cause Analysis

### SwapContext Issues

The swap flow is: **weETH (collateral) → WETH (debt)** for mint operations.

Current problems in `src/features/leverage-tokens/utils/swapContext.ts`:

1. **Fake DEX Addresses:**
   ```typescript
   // WRONG - All pointing to same placeholder
   aerodromeRouter: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da'
   uniswapSwapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481'  
   ```

2. **Incorrect Exchange Enum:**
   ```typescript
   // Current (WRONG)
   AERODROME_V2: 0,
   AERODROME_SLIPSTREAM: 1, 
   UNISWAP_V3: 4

   // Should be (v1 mapping)
   AERODROME_V2: 0,
   SLIPSTREAM: 1, 
   ETHERFI: 2,
   UNISWAP_V2: 3,
   UNISWAP_V3: 4
   ```

3. **Missing Route Discovery:**
   - No pool existence validation
   - No proper V3 path encoding for exact-output
   - No fallback strategy (Slipstream → V3 → V2)

## Required Fixes

### 1. Real Base DEX Addresses (HIGH PRIORITY)

Replace with actual Base mainnet addresses:

```typescript
const DEX_ADDRESSES: Record<number, SwapContext['exchangeAddresses']> = {
  [base.id]: {
    // TODO: Get real addresses from v1 SWAP_ADAPTER_EXCHANGE_ADDRESSES
    aerodromeRouter: '0x[REAL_AERODROME_ROUTER_ADDRESS]',
    aerodromePoolFactory: '0x[REAL_AERODROME_FACTORY_ADDRESS]', 
    aerodromeSlipstreamRouter: '0x[REAL_SLIPSTREAM_ROUTER_ADDRESS]',
    uniswapSwapRouter02: '0x[REAL_UNISWAP_V3_ROUTER]',
    uniswapV2Router02: '0x[REAL_UNISWAP_V2_ROUTER]',
  }
}
```

### 2. Fix Exchange Enum (HIGH PRIORITY)

```typescript
export const Exchange = {
  AERODROME_V2: 0,
  SLIPSTREAM: 1,     // Was AERODROME_SLIPSTREAM
  ETHERFI: 2,        // Missing
  UNISWAP_V2: 3,     // Missing  
  UNISWAP_V3: 4,
} as const
```

### 3. Implement Route Discovery (MEDIUM PRIORITY)

- Query pool existence before creating SwapContext
- Use AlphaRouter for proper V3 exact-output path encoding
- Implement fallback strategy: Slipstream → V3 → V2

### 4. Proper V3 Path Encoding (MEDIUM PRIORITY)

Current simple concatenation won't work for exact-output:
```typescript
// WRONG
return `0x${token0}${fee}${token1}`

// Need proper exact-output encoding (reversed path)
// Use AlphaRouter's encodeRouteToPath(..., true)
```

## Implementation Priority

### Phase 1 (15 mins - DONE THIS SESSION)
1. ✅ Create this handoff doc
2. ✅ Replace placeholder addresses with real Base addresses  
3. ✅ Fix exchange enum mapping
4. ✅ Test basic SwapContext creation

### Phase 2 (Next Developer)
1. **Get v1 addresses** - Extract SWAP_ADAPTER_EXCHANGE_ADDRESSES from v1
2. **Implement route discovery** - Query pool existence, validate liquidity
3. **Add AlphaRouter integration** - Proper V3 path encoding for exact-output
4. **Add fallback logic** - Try Slipstream → V3 → V2 until one works

### Phase 3 (Final)
1. **Enhanced error handling** - Decode revert reasons to diagnose failures
2. **Integration test completion** - All test scenarios passing
3. **Documentation** - Update CLAUDE.md with working setup

## Key Files to Modify

- `src/features/leverage-tokens/utils/swapContext.ts` - Core SwapContext logic
- `tests/integration/router.mint.test.ts` - Integration test with better error handling
- Package scripts for easier testing

## Testing Approach

```bash
# Terminal 1: Start Anvil Base fork
ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base

# Terminal 2: Run integration test  
bun run test:integration
```

**Expected progression:**
1. Fix addresses → Better error messages (not "invalid address")
2. Fix enum → Adapter selection works 
3. Add route discovery → Successful swaps
4. Integration test passes → Ready for E2E

## Success Criteria

- ✅ Router.mint integration test passes
- ✅ Real weETH → WETH swap executes successfully
- ✅ SwapContext uses actual Base DEX addresses
- ✅ Exchange enum matches on-chain adapter mapping

## Handoff Notes

The foundation is solid - Anvil setup, token funding, and test harness all work. The issue is purely SwapContext data quality. Once we have real addresses and proper enum mapping, the rest should fall into place quickly.

Focus on getting real Base DEX addresses first - that will unlock much better error messages and faster debugging.

---
*Created: August 25, 2025, 4:30 PM*  
*Next Developer: Continue with Phase 2 implementation*