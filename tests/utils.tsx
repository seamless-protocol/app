import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderHookOptions, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useAccount, useChainId, usePublicClient } from 'wagmi'

// Utility to create deterministic hashes from strings
export function makeHash(name: string): string {
  const hash = Array.from(name)
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    .toString(16)
    .padStart(8, '0')
  return hash
}

// Utility to create test transaction hashes
export function makeTxnHash(name: string): `0x${string}` {
  const hash = makeHash(name)
  return `0x${hash.padEnd(64, '0')}`
}

// Utility to create test addresses
export function makeAddr(name: string): `0x${string}` {
  const hash = makeHash(name)
  return `0x${hash.padEnd(40, '0')}`
}

// Common mock setup utilities
export const mockSetup = {
  // Setup default wagmi mocks with common return values
  setupWagmiMocks: (ownerAddress: `0x${string}`, chainId = 8453) => {
    // The mocks are already set up in tests/setup.ts
    // Just need to configure their return values
    const mockUseAccount = useAccount as any
    const mockUseChainId = useChainId as any
    const mockUsePublicClient = usePublicClient as any
    mockUseAccount.mockReturnValue({ address: ownerAddress })
    mockUseChainId.mockReturnValue(chainId)
    mockUsePublicClient.mockReturnValue({
      getChainId: () => Promise.resolve(chainId),
      chain: { id: chainId },
      transport: { url: 'http://localhost:8545' },
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        status: 'success',
        transactionHash: '0xtxhash',
      }),
    })
  },

  // Clear all mocks (useful in beforeEach)
  clearAllMocks: () => {
    vi.clearAllMocks()
  },

  // Create a fresh QueryClient for each test
  createQueryClient: () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
}

// Hook testing utilities
export const hookTestUtils = {
  // Render a hook with QueryClient provider
  renderHookWithQuery: <TProps, TResult>(
    hook: (props: TProps) => TResult,
    options?: {
      initialProps?: TProps
      queryClient?: QueryClient
    } & Omit<RenderHookOptions<TProps>, 'wrapper'>,
  ) => {
    const queryClient = options?.queryClient ?? mockSetup.createQueryClient()

    return {
      ...renderHook(hook, {
        ...options,
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      }),
      queryClient,
    }
  },
}

// Mock data generators
export const mockData = {
  transactionHash: makeTxnHash('test-transaction'),
  transactionReceipt: (hash: string) => ({
    hash,
    status: 'success' as const,
    blockNumber: 12345n,
    gasUsed: 21000n,
  }),
}
