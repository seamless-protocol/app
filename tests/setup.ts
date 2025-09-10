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
  useConfig: vi.fn(() => ({})),
  useReadContracts: vi.fn(),
  createConfig: vi.fn(),
  http: vi.fn(),
}))

// Mock wagmi chains
vi.mock('wagmi/chains', () => ({
  base: { id: 8453, name: 'Base' },
  mainnet: { id: 1, name: 'Ethereum' },
}))

// Mock wagmi connectors
vi.mock('wagmi/connectors', () => ({
  mock: vi.fn(),
}))

// Mock wagmi core functions
vi.mock('@wagmi/core', () => ({
  simulateContract: vi.fn(),
  writeContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  readContract: vi.fn(),
  readContracts: vi.fn(),
  getPublicClient: vi.fn(() => ({
    getChainId: vi.fn(() => Promise.resolve(8453)),
    transport: { url: 'http://localhost:8545' },
  })),
}))

// Mock config
vi.mock('@/lib/config/wagmi.config', () => ({
  config: {},
}))

// Mock contract ABI exports used by hooks/tests
vi.mock('@/lib/contracts/generated', () => ({
  leverageTokenAbi: [],
  leverageRouterAbi: [],
}))

// Mock contract addresses
vi.mock('@/lib/contracts/addresses', () => ({
  contractAddresses: {
    8453: {
      leverageTokenFactory: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57',
      leverageManager: '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8',
      leverageRouter: '0xDbA92fC3dc10a17b96b6E807a908155C389A887C',
    },
  },
  getContractAddresses: vi.fn(),
  getLeverageManagerAddress: vi.fn(),
}))

// Mock query keys
vi.mock('@/features/leverage-tokens/utils/queryKeys', () => ({
  ltKeys: {
    token: (addr: string) => ['leverage-tokens', 'tokens', addr],
    metadata: (addr: string) => ['leverage-tokens', 'tokens', addr, 'metadata'],
    user: (addr: string, owner: string) => ['leverage-tokens', 'tokens', addr, 'user', owner],
    supply: (addr: string) => ['leverage-tokens', 'tokens', addr, 'supply'],
    detailedMetrics: (addr: string) => ['leverage-tokens', 'tokens', addr, 'detailed-metrics'],
    apy: (addr: string) => ['leverage-tokens', 'tokens', addr, 'apy'],
    external: {
      borrowApy: (addr: string) => ['leverage-tokens', 'external', 'borrow-apy', addr],
      rewardsApr: (addr: string) => ['leverage-tokens', 'external', 'rewards-apr', addr],
    },
  },
}))

// Mock constants
vi.mock('@/features/leverage-tokens/utils/constants', () => ({
  TX_SETTINGS: {
    confirmations: 1,
  },
  STALE_TIME: {
    metadata: 30000,
    detailedMetrics: 300000,
    supply: 30000,
    historical: 300000,
  },
}))

// Mock governance utilities
vi.mock('@/features/governance/utils/tally', () => ({
  getProposals: vi.fn(),
}))

// Mock governance constants
vi.mock('@/features/governance/utils/constants', () => ({
  TALLY_CONFIG: {
    ORGANIZATION_ID: 'test-org-id',
  },
  STALE_TIME: {
    proposals: 60000,
  },
  QUERY_SETTINGS: {
    gcTime: 300000,
  },
}))

// Mock APY calculation functions (only for the main hook test)
vi.mock('@/features/leverage-tokens/utils/apy-calculations/apr-providers', () => ({
  fetchAprForToken: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers', () => ({
  fetchBorrowApyForToken: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/utils/apy-calculations/leverage-ratios', () => ({
  fetchLeverageRatios: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/utils/apy-calculations/rewards-providers', () => ({
  fetchGenericRewardsApr: vi.fn(),
}))

// Mock GraphQL fetchers
vi.mock('@/lib/graphql/fetchers/leverage-tokens', () => ({
  fetchLeverageTokenPriceComparison: vi.fn(),
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
