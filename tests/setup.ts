import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('VITE_ENABLE_LEVERAGE_TOKENS', 'true')
vi.stubEnv('VITE_ENABLE_LEVERAGE_TOKEN_CREATION', 'false')
vi.stubEnv('VITE_TEST_MODE', 'mock')

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
}))

// Mock wagmi core functions
vi.mock('@wagmi/core', () => ({
  simulateContract: vi.fn(),
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
}))

// Mock config
vi.mock('@/lib/config/wagmi.config', () => ({
  config: {},
}))

// Mock contract ABI
vi.mock('@/lib/contracts/generated', () => ({
  leverageTokenAbi: [],
}))

// Mock constants
vi.mock('@/features/leverage-tokens/utils/constants', () => ({
  TX_SETTINGS: {
    confirmations: 1,
  },
}))

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  writable: true,
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
} 