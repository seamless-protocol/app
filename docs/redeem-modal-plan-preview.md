# Redeem Modal Plan Preview Architecture

## Issue Reference
[#350: fix: update redeem modal to pass in redeem plan preview like in mint](https://github.com/seamless-protocol/app/issues/350)

## Problem Statement

The redeem modal and mint modal have architectural inconsistencies in how they handle plan data flow:

### Current State

**Mint Modal Pattern** (desired):
```
User Input → useMintPlanPreview → Plan Generated → Pass Plan to Execution
                                        ↓
                                   Display Preview
```

**Redeem Modal Pattern** (problematic):
```
User Input → useRedeemPreview → Basic Preview
                ↓
        exec.redeem(shares)
                ↓
    Plans AGAIN internally → Execute
```

### Key Issues

1. **Duplicate Planning**: Redeem calculates plan twice - once for preview, once for execution
2. **No USD Values**: `useRedeemPlanPreview` doesn't calculate `expectedUsdOut` / `guaranteedUsdOut` like mint does
3. **Inconsistent API**: Mint passes full plan to execution, redeem only passes shares
4. **No Single Source of Truth**: Preview plan and execution plan may diverge

### Critical Problem: Coingecko Price Fetching in Planner

The most severe issue discovered is that `planRedeem()` (in `src/domain/redeem/planner/plan.ts` lines 187-212) **fetches Coingecko prices during planning** for slippage validation:

```typescript
// Fetches decimals from chain
const collateralAssetDecimals = await publicClient.readContract(...)
const debtAssetDecimals = await publicClient.readContract(...)

// PROBLEM: Fetches current USD prices from Coingecko API
const usdPriceMap = await fetchCoingeckoTokenUsdPrices(chainId, [collateralAsset, debtAsset])

// Uses prices to validate slippage
if (minCollateralForSenderInUsd > expectedCollateralInUsd + expectedDebtPayoutInUsd) {
  throw new Error('Try increasing slippage: the transaction will likely revert due to slippage')
}
```

**Why This Causes Problems:**

1. **Test Timeouts**: Coingecko API calls are slow/unreliable, causing integration tests to timeout at 30 seconds
2. **Preview ≠ Execution**: When `orchestrateRedeem` calls `planRedeem()` again during execution:
   - Prices fetched at preview time T1 (user sees preview)
   - Prices fetched AGAIN at execution time T2 (actual transaction)
   - `minCollateralForSender` could be different between T1 and T2
   - **What user sees in preview ≠ what gets executed**

**The Solution Must:**
- Make `orchestrateRedeem` **REQUIRE** a `RedeemPlan` parameter (not optional)
- Skip the internal `planRedeem()` call entirely during execution
- Use the plan from preview time as the single source of truth

## Solution: Full Alignment with Mint Pattern

### Goals

1. **Single Planning**: Calculate plan once in `useRedeemPlanPreview`
2. **USD Calculations**: Add `expectedUsdOut` / `guaranteedUsdOut` to preview
3. **Pass Plan to Execution**: Change `exec.redeem()` to accept full `RedeemPlan`
4. **Consistent Architecture**: Redeem mirrors mint's data flow exactly

### New Architecture

```
User Input → useRedeemPlanPreview (with USD params) → RedeemPlan + USD values
                                                            ↓
                                                    Display Preview
                                                            ↓
                                              Pass Plan to exec.redeem(plan)
                                                            ↓
                                                        Execute
```

## Implementation Details

### 1. Update `useRedeemPlanPreview` Hook

**File**: `src/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview.ts`

**New Interface**:
```typescript
interface UseRedeemPlanPreviewParams {
  // ... existing params

  // NEW: For USD calculations
  collateralUsdPrice?: number
  debtUsdPrice?: number
  collateralDecimals?: number
  debtDecimals?: number
  outputAssetDecimals?: number
}
```

**New Return Values**:
```typescript
return {
  plan: query.data,
  expectedUsdOut,      // NEW
  guaranteedUsdOut,    // NEW
  isLoading: enabled && query.isFetching,
  error: query.error,
}
```

**USD Calculation Logic** (mirror mint):
```typescript
const expectedUsdOut = useMemo(() => {
  const plan = query.data
  if (!plan) return undefined
  if (typeof collateralUsdPrice !== 'number') return undefined
  if (typeof outputAssetDecimals !== 'number') return undefined

  try {
    const payoutAmount = Number(formatUnits(plan.payoutAmount, outputAssetDecimals))
    if (!Number.isFinite(payoutAmount)) return undefined
    const usd = payoutAmount * collateralUsdPrice
    return Number.isFinite(usd) ? Math.max(usd, 0) : undefined
  } catch {
    return undefined
  }
}, [query.data, collateralUsdPrice, outputAssetDecimals])

const guaranteedUsdOut = useMemo(() => {
  const plan = query.data
  if (!plan) return undefined
  if (typeof collateralUsdPrice !== 'number' || typeof outputAssetDecimals !== 'number')
    return undefined
  try {
    // Use minCollateralForSender for worst-case scenario (slippage-adjusted floor)
    const minAmount = Number(formatUnits(plan.minCollateralForSender, outputAssetDecimals))
    if (!Number.isFinite(minAmount)) return undefined
    const usd = minAmount * collateralUsdPrice
    return Number.isFinite(usd) ? Math.max(usd, 0) : undefined
  } catch {
    return undefined
  }
}, [query.data, collateralUsdPrice, outputAssetDecimals])
```

### 2. Refactor `orchestrateRedeem` Domain Function (CRITICAL)

**File**: `src/domain/redeem/orchestrate.ts`

**BEFORE (problematic - optional plan):**
```typescript
export async function orchestrateRedeem(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps?: number
  quoteCollateralToDebt: QuoteFn
  // ... other params
}): Promise<OrchestrateRedeemResult> {
  // PROBLEM: Always calls planRedeem, causing:
  // 1. Duplicate Coingecko API fetch (slow, causes test timeouts)
  // 2. Different prices at T1 (preview) vs T2 (execution)
  // 3. Different minCollateralForSender between preview and execution
  const plan = await planRedeem({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    chainId,
    // ... other params
  })

  // Execute with plan...
}
```

**AFTER (required plan):**
```typescript
export async function orchestrateRedeem(params: {
  config: Config
  account: AccountArg
  plan: RedeemPlan  // REQUIRED: Use plan from preview
  quoteCollateralToDebt: QuoteFn
  // ... other params (but NOT sharesToRedeem, slippageBps - those come from plan)
}): Promise<OrchestrateRedeemResult> {
  const { plan } = params

  // NO planRedeem() call - use the provided plan directly
  // This ensures:
  // 1. Single Coingecko fetch (at preview time only)
  // 2. Preview === Execution (same plan, same minCollateralForSender)
  // 3. Fast execution (no API calls during transaction)

  // Execute with plan.sharesToRedeem, plan.minCollateralForSender, plan.calls...
}
```

**Key Changes:**
- Add `plan: RedeemPlan` to params (REQUIRED)
- Remove internal `planRedeem()` call entirely
- Use `plan.sharesToRedeem` instead of `sharesToRedeem` param
- Use `plan.slippageBps` instead of `slippageBps` param
- Use `plan.minCollateralForSender` and `plan.calls` directly

### 3. Update `useRedeemWithRouter` Hook

**File**: `src/features/leverage-tokens/hooks/useRedeemWithRouter.ts`

**Change Interface:**
```typescript
// BEFORE:
export interface UseRedeemWithRouterParams {
  token: TokenArg
  account: AccountArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps?: number
  chainId: number
  quoteCollateralToDebt: QuoteFn
  routerAddress?: Address
  managerAddress?: Address
  outputAsset?: Address
  adapterType?: 'lifi' | 'uniswapV2' | 'uniswapV3' | 'velora'
}

// AFTER:
export interface UseRedeemWithRouterParams {
  token: TokenArg
  account: AccountArg
  plan: RedeemPlan  // REQUIRED: Full plan from preview
  chainId: number
  quoteCollateralToDebt: QuoteFn
  routerAddress?: Address
  managerAddress?: Address
  outputAsset?: Address
  adapterType?: 'lifi' | 'uniswapV2' | 'uniswapV3' | 'velora'
}
```

**Update Implementation:**
- Pass `plan` to `orchestrateRedeem` instead of individual fields
- Extract `sharesToRedeem` and other values from plan only for validation/logging

### 4. Refactor `useRedeemExecution` Hook

**File**: `src/features/leverage-tokens/hooks/redeem/useRedeemExecution.ts`

**Change Function Signature**:
```typescript
// OLD:
exec.redeem(sharesToRedeem: bigint)

// NEW:
exec.redeem(plan: RedeemPlan)
```

**Update Implementation**:
```typescript
const redeem = useCallback(
  async (plan: RedeemPlan): Promise<OrchestrateRedeemResult> => {
    if (!account) throw new Error('No account')
    if (requiresQuote && quoteStatus !== 'ready') {
      const baseError =
        quoteError?.message || 'Unable to initialize swap quote for router v2 redeem.'
      throw new Error(baseError)
    }

    setStatus('submitting')
    setError(undefined)
    try {
      if (activeChainId !== chainId) {
        await switchChainAsync({ chainId })
      }

      if (!quote) {
        throw new Error('Quote is required for V2 redeem')
      }

      // Pass full plan to redeemWithRouter
      const result = await redeemWithRouter.mutateAsync({
        token,
        account,
        plan,  // Pass full plan instead of extracted fields
        chainId,
        quoteCollateralToDebt: quote,
        ...(typeof routerAddress !== 'undefined' ? { routerAddress } : {}),
        ...(typeof managerAddress !== 'undefined' ? { managerAddress } : {}),
        ...(typeof outputAsset !== 'undefined' ? { outputAsset } : {}),
        ...(swap ? { adapterType: swap.type } : {}),
      })

      setHash(result.hash)
      setStatus('pending')
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: result.hash })
      if (receipt && receipt.status !== 'success') {
        const revertError = new Error('Transaction reverted')
        setError(revertError)
        setStatus('error')
        throw revertError
      }
      setStatus('success')
      return result
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err))
      setError(nextError)
      setStatus('error')
      throw nextError
    }
  },
  [
    account,
    activeChainId,
    managerAddress,
    quote,
    quoteError?.message,
    quoteStatus,
    redeemWithRouter,
    routerAddress,
    outputAsset,
    token,
    publicClient,
    chainId,
    switchChainAsync,
    swap,
  ],
)
```

### 5. Update Redeem Modal

**File**: `src/features/leverage-tokens/components/leverage-token-redeem-modal/index.tsx`

**Pass USD Context to Preview** (~line 286):
```typescript
const planPreview = useRedeemPlanPreview({
  config: wagmiConfig,
  token: leverageTokenAddress,
  sharesToRedeem: form.amountRaw,
  slippageBps,
  chainId: leverageTokenConfig.chainId,
  enabled: isOpen,
  quote: exec.quote,
  managerAddress: leverageManagerAddress,
  swapKey: swapConfigKey,
  outputAsset: selectedOutputAsset.address,

  // NEW: USD calculation params
  collateralUsdPrice,
  debtUsdPrice,
  collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
  debtDecimals: leverageTokenConfig.debtAsset.decimals,
})
```

**Note**: Requires both collateral and debt prices/decimals because total value = `expectedCollateral + expectedDebtPayout` (mirrors planner logic)

**Update handleConfirm** (~line 551):
```typescript
const handleConfirm = async () => {
  const plan = planPreview.plan
  if (!plan) {
    setError('Plan not ready. Please try again.')
    toError()
    return
  }

  if (!exec.canSubmit) {
    setError(redeemBlockingError || 'Redeem configuration is not ready.')
    toError()
    return
  }

  try {
    analytics.funnelStep('redeem_leverage_token', 'transaction_initiated', 2)
    toPending()
    void exec.redeem(plan)  // Pass full plan instead of shares
  } catch (error) {
    // ... error handling
  }
}
```

## Benefits

### Critical Fixes

- **Eliminates Test Timeouts**: No Coingecko API fetch during execution (was causing 30s timeouts)
- **Preview === Execution**: Single plan source ensures `minCollateralForSender` identical at preview and execution time
- **No Price Divergence**: Prices fetched once at preview time T1, not refetched at execution time T2

### Architectural

- **Single Source of Truth**: Plan calculated once, used everywhere
- **Required Plan Parameter**: `orchestrateRedeem` enforces plan from preview (not optional)
- **Consistency**: Mint and redeem follow identical patterns
- **Maintainability**: Easier to understand and modify
- **Type Safety**: Full plan object with complete type information

### Performance

- **Fast Execution**: No API calls during transaction submission
- **Eliminates Duplicate Planning**: Saves on-chain reads and computation
- **Reduces State Management**: Fewer moving parts
- **Better Caching**: Single query for plan data

### User Experience

- **USD Value Display**: Users see value estimates in familiar terms
- **Guaranteed vs Expected**: Shows worst-case scenario alongside expected outcome
- **Accurate Previews**: What you see is what you get - guaranteed by single plan source
- **Predictable Outcomes**: No surprise slippage check failures from price changes between preview and execution

## Related Issues

This change lays groundwork for several related improvements:

- **#419**: Refactor redeem modal to mirror mint modal - this is a major step
- **#423**: Mint/Redeem domain purity - single planning call improves purity
- **#437**: Multicall & fixed block numbers - easier to add with single plan source
- **#442**: Cleanup after preview/slippage hotfix - may resolve underlying issues

## Testing Strategy

Tests automatically cover both production tokens via parameterized infrastructure from PR #454:

```bash
# Type check and format
bun check:fix

# Build verification
bun run build

# Integration tests (both wstETH-2x and RLP)
bun run test:integration

# E2E tests (both tokens, complete flows)
bun run test:e2e
```

## Future Improvements

### Potential Optimizations

1. **Extract Shared USD Logic**: Create `useUsdCalculations` hook shared by mint/redeem
2. **Debouncing**: Add debouncing to redeem preview (like mint has)
3. **Multicall Integration**: Fetch prices/plan data in single multicall (#437)
4. **Fixed Block Numbers**: Use consistent block for all preview data (#437)

### Full Modal Refactoring (#419)

This change enables deeper refactoring:
- Shared preview components between mint/redeem
- Unified step components (ConfirmStep, SuccessStep, etc.)
- Common hooks for approval, execution patterns

## Migration Path

### Phase 1: This PR
- Add USD calculations to preview
- Pass plan to execution
- No breaking changes to domain layer

### Phase 2: Domain Cleanup (#423)
- Extract pure planning functions
- Remove side effects
- Improve testability

### Phase 3: Full Alignment (#419)
- Share components between modals
- Unify step patterns
- Complete architectural consistency

## Files Modified

1. **`src/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview.ts`** (~60 lines)
   - Add USD calculation parameters and logic
   - Return `expectedUsdOut` and `guaranteedUsdOut`

2. **`src/domain/redeem/orchestrate.ts`** (~40 lines) **[CRITICAL]**
   - Change params to require `plan: RedeemPlan`
   - Remove internal `planRedeem()` call
   - Use plan fields directly (eliminates Coingecko API call during execution)

3. **`src/features/leverage-tokens/hooks/useRedeemWithRouter.ts`** (~30 lines)
   - Change interface to accept `plan: RedeemPlan`
   - Pass plan to `orchestrateRedeem`

4. **`src/features/leverage-tokens/hooks/redeem/useRedeemExecution.ts`** (~20 lines)
   - Update `redeem()` to accept `RedeemPlan`
   - Pass full plan to `redeemWithRouter.mutateAsync()`

5. **`src/features/leverage-tokens/components/leverage-token-redeem-modal/index.tsx`** (~15 lines)
   - Pass USD context to `useRedeemPlanPreview`
   - Update `handleConfirm` to pass plan to `exec.redeem(plan)`

## Validation Checklist

Before merging:
- [ ] `orchestrateRedeem` requires plan parameter (not optional)
- [ ] No `planRedeem()` call in `orchestrateRedeem` implementation
- [ ] No Coingecko API calls during execution
- [ ] Plan flows from preview to execution (verified in code)
- [ ] USD values display correctly in UI
- [ ] `bun check:fix` passes (types + formatting)
- [ ] `bun run build` succeeds
- [ ] `bun run test:integration` passes (both tokens, no 30s timeouts)
- [ ] `bun run test:e2e` passes (both tokens)
- [ ] Preview and execution use same plan object
- [ ] `minCollateralForSender` same at preview and execution time

## References

- **Issue #350**: https://github.com/seamless-protocol/app/issues/350
- **PR #454**: Parameterized test infrastructure (dependency)
- **Mint Modal**: Reference implementation pattern
- **Issue #419**: Full modal refactoring (follow-up)
