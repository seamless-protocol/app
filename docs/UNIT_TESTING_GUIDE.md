# Unit Testing Guide

*Quick reference for writing unit tests in Seamless Protocol v2*

## Quick Start

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { simulateContract, waitForTransactionReceipt, writeContract, readContracts } from '@wagmi/core'
import { useMyHook, MY_HOOK_CONTRACTS } from '@/features/my-feature/hooks/useMyHook'
import { makeAddr, mockSetup, hookTestUtils, mockData } from '../utils'

describe('useMyHook', () => {
  const tokenAddress = makeAddr('token')
  const ownerAddress = makeAddr('owner')
  const TOKEN_AMOUNT = 1000n

  beforeEach(() => {
    mockSetup.setupWagmiMocks(ownerAddress)
    vi.mocked(simulateContract).mockResolvedValue({ request: {} } as any)
    vi.mocked(writeContract).mockResolvedValue(mockData.transactionHash as any)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(mockData.transactionReceipt(mockData.transactionHash) as any)
    mockSetup.clearAllMocks()
  })

  it('should execute mutation flow', async () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMyHook({ token: tokenAddress }))
    await result.current.mutateAsync(TOKEN_AMOUNT)
    
    expect(simulateContract).toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalled()
    expect(waitForTransactionReceipt).toHaveBeenCalled()
  })

  it('should handle wallet not connected', async () => {
    mockSetup.setupWagmiMocks(undefined as any)
    const { result } = hookTestUtils.renderHookWithQuery(() => useMyHook({ token: tokenAddress }))
    
    await expect(result.current.mutateAsync(TOKEN_AMOUNT)).rejects.toThrow('WALLET_NOT_CONNECTED')
  })
})
```

## Test Categories

### For Mutation Hooks (`useMutation`)

#### 1. Hook Initialization
```typescript
it('should create mutation with correct initial state', () => {
  const { result } = hookTestUtils.renderHookWithQuery(() => useMyHook({ token: tokenAddress }))
  expect(result.current.isPending).toBe(false)
  expect(result.current.mutate).toBeDefined()
})
```

#### 2. Successful Flow
```typescript
it('should execute full flow', async () => {
  const { result } = hookTestUtils.renderHookWithQuery(() => useMyHook({ token: tokenAddress }))
  await result.current.mutateAsync(TOKEN_AMOUNT)
  
  expect(simulateContract).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
    address: tokenAddress,
    functionName: 'myFunction',
    args: [ownerAddress, TOKEN_AMOUNT]
  }))
})
```

### For Query Hooks (`useQuery`)

#### 1. Hook Initialization
```typescript
it('should create query with correct initial state', () => {
  const { result } = hookTestUtils.renderHookWithQuery(() => useMyQuery(tokenAddress))
  expect(result.current.isLoading).toBe(true)
  expect(result.current.data).toBeUndefined()
})
```

#### 2. Successful Data Fetching
```typescript
it('should fetch data successfully', async () => {
  // If you export the contract configuration
  const { result } = hookTestUtils.renderHookWithQuery(() => useMyQuery(tokenAddress))
  
  await waitFor(() => {
    expect(readContracts).toHaveBeenCalledWith(expect.any(Object), {
      contracts: MY_QUERY_CONTRACTS(tokenAddress),
    })
  })
})
```

### 3. Query Invalidation
```typescript
it('should invalidate queries after success', async () => {
  const { result, queryClient } = hookTestUtils.renderHookWithQuery(() => useMyHook({ token: tokenAddress }))
  const spy = vi.spyOn(queryClient, 'invalidateQueries')
  
  await result.current.mutateAsync(TOKEN_AMOUNT)
  
  expect(spy).toHaveBeenCalledWith({ queryKey: ['my-feature', 'tokens', tokenAddress, 'user', ownerAddress] })
})
```

### 4. Error Handling
```typescript
it('should handle errors', async () => {
  vi.mocked(simulateContract).mockRejectedValue(new Error('Test error'))
  const onError = vi.fn()
  const { result } = hookTestUtils.renderHookWithQuery(() => useMyHook({ token: tokenAddress, onError }))
  
  try { await result.current.mutateAsync(TOKEN_AMOUNT) } catch (e) {}
  
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ type: 'UNKNOWN' }))
})
```

## Available Utilities

```typescript
// Address/Data generation
makeAddr('name')                    // Deterministic address
makeTxnHash('name')                 // Deterministic transaction hash
mockData.transactionHash            // Consistent test hash
mockData.transactionReceipt(hash)   // Generate test receipt

// Mock setup
mockSetup.setupWagmiMocks(address, chainId)  // Setup wagmi hooks
mockSetup.createQueryClient()                // Fresh QueryClient
mockSetup.clearAllMocks()                    // Clear all mocks

// Hook testing
hookTestUtils.renderHookWithQuery(hook, options)  // Render with providers
```

## Best Practices

### ✅ Do
- Use constants for test values (`const TOKEN_AMOUNT = 1000n`)
- Export contract configurations from hooks for testing
- Use `waitFor` for async query assertions
- Test real scenarios (wallet not connected, user rejection)
- Use shared utilities for consistency
- Clear mocks in beforeEach
- Test error classification appropriately

### ❌ Don't
- Test implementation details
- Use hardcoded values throughout tests
- Mock React Query directly (use hookTestUtils)
- Test optimistic updates (we don't use them)
- Duplicate mock setup across tests
- Hardcode contract configurations in tests

## Error Classification

### User Errors (Non-Actionable)
- `USER_REJECTED` (code: 4001) - Don't log to Sentry
- `CHAIN_MISMATCH` (code: 4902) - Don't log to Sentry

### System Errors (Actionable)
- `UNKNOWN` - Log to Sentry for investigation

## Running Tests

```bash
npm test                                    # Run all tests
npm test -- tests/unit/useMintToken.test.tsx  # Run specific file
npm test -- --watch                        # Watch mode
```

## Reference

- **Mutation Example**: `tests/unit/useMintToken.test.tsx`
- **Query Example**: `tests/unit/useTokenMetadata.test.tsx`
- **Utilities**: `tests/utils.tsx`
- **Setup**: `tests/setup.ts`

---

*Copy the pattern from the relevant example and adjust for your hook.* 🚀 