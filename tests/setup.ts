import '@testing-library/jest-dom'
import { base, mainnet } from 'viem/chains'
import { vi } from 'vitest'
import type { ContractAddresses } from '@/lib/contracts/addresses'

// Mock environment variables
vi.stubEnv('VITE_ENABLE_LEVERAGE_TOKENS', 'true')
vi.stubEnv('VITE_ENABLE_LEVERAGE_TOKEN_CREATION', 'false')
vi.stubEnv('VITE_TEST_MODE', 'mock')
vi.stubEnv('VITE_MULTICALL_EXECUTOR_ADDRESS', '0x0000000000000000000000000000000000000001')

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useConfig: vi.fn(() => ({})),
  useReadContracts: vi.fn(),
  usePublicClient: vi.fn(),
  createConfig: vi.fn(),
  http: vi.fn(),
}))

// Note: useCollateralToDebtQuote is not mocked to allow unit tests to run the actual hook

vi.mock('@/features/leverage-tokens/hooks/useRedeemWithRouter', () => ({
  useRedeemWithRouter: vi.fn(),
}))

// Mock wagmi chains
vi.mock('wagmi/chains', () => ({
  base: { id: base.id, name: 'Base' },
  mainnet: { id: mainnet.id, name: 'Ethereum' },
  anvil: {
    id: 31337,
    name: 'Anvil',
    rpcUrls: {
      default: {
        http: ['http://127.0.0.1:8545'],
      },
    },
  },
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
  connect: vi.fn(async () => ({ accounts: ['0x0'], chainId: base.id })),
  getPublicClient: vi.fn(() => ({
    getChainId: vi.fn(() => Promise.resolve(base.id)),
    chain: { id: base.id },
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
  readLeverageManagerPreviewRedeem: vi.fn(),
  readLeverageManagerV2PreviewRedeem: vi.fn(),
}))

// Mock contract addresses (keep base constants aligned with source module)
vi.mock('@/lib/contracts/addresses', () => {
  const contractAddresses: Record<number, ContractAddresses> = {
    [base.id]: {
      leverageTokenFactory: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57',
      leverageTokenImpl: '0x057A2a1CC13A9Af430976af912A27A05DE537673',
      leverageManagerV2: '0x959c574EC9A40b64245A3cF89b150Dc278e9E55C',
      leverageRouterV2: '0xfd46483b299197c616671b7df295ca5186c805c2',
      stakedSeam: '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4',
      seamlessToken: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85',
      timelockShort: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee',
      governorShort: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294',
      timelockLong: '0xA96448469520666EDC351eff7676af2247b16718',
      governorLong: '0x04faA2826DbB38a7A4E9a5E3dB26b9E389E761B6',
      multicallExecutor: '0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd',
      escrowSeam: '0x998e44232BEF4F8B033e5A5175BDC97F2B10d5e5',
      rewardsController: '0x2C6dC2CE7747E726A590082ADB3d7d08F52ADB93',
      vaults: {
        usdc: '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738',
        cbbtc: '0x5a47C803488FE2BB0A0EAaf346b420e4dF22F3C7',
        weth: '0x27d8c7273fd3fcc6956a0b370ce5fd4a7fc65c18',
      },
      tokens: {
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        weth: '0x4200000000000000000000000000000000000006',
        weeth: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
      },
    },
  }

  const getContractAddresses = vi.fn(
    (chainId: number): ContractAddresses => contractAddresses[chainId] ?? {},
  )
  const getLeverageManagerAddress = vi.fn(
    (chainId: number) => getContractAddresses(chainId)?.leverageManagerV2,
  )

  const getGovernanceAddresses = vi.fn((chainId: number) => {
    const addresses = getContractAddresses(chainId)
    return {
      timelockShort: addresses?.timelockShort,
      governorShort: addresses?.governorShort,
      timelockLong: addresses?.timelockLong,
      governorLong: addresses?.governorLong,
    }
  })

  const getRequiredGovernanceAddresses = vi.fn((chainId: number) => {
    const governance = getGovernanceAddresses(chainId)
    if (!governance.timelockShort) throw new Error('Missing governance address "timelockShort"')
    if (!governance.governorShort) throw new Error('Missing governance address "governorShort"')
    if (!governance.timelockLong) throw new Error('Missing governance address "timelockLong"')
    if (!governance.governorLong) throw new Error('Missing governance address "governorLong"')
    return governance as Required<typeof governance>
  })

  const hasDeployedContracts = vi.fn(
    (chainId: number) => Object.keys(getContractAddresses(chainId)).length > 0,
  )

  return {
    ETH_SENTINEL: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    BASE_WETH: '0x4200000000000000000000000000000000000006',
    contractAddresses,
    STAKED_SEAM: { address: contractAddresses[base.id]?.stakedSeam, chainId: base.id },
    getContractAddresses,
    getLeverageManagerAddress,
    getGovernanceAddresses,
    getRequiredGovernanceAddresses,
    hasDeployedContracts,
  }
})

// Mock query keys
vi.mock('@/features/leverage-tokens/utils/queryKeys', () => ({
  ltKeys: {
    token: (addr: string) => ['leverage-tokens', 'tokens', addr],
    tokenOnChain: (chainId: number, addr: string) => [
      'leverage-tokens',
      'chain',
      chainId,
      'token',
      addr,
    ],
    metadata: (addr: string) => ['leverage-tokens', 'tokens', addr, 'metadata'],
    user: (addr: string, owner: string) => ['leverage-tokens', 'tokens', addr, 'user', owner],
    supply: (addr: string) => ['leverage-tokens', 'tokens', addr, 'supply'],
    detailedMetrics: (addr: string) => ['leverage-tokens', 'tokens', addr, 'detailed-metrics'],
    apy: (addr: string) => ['leverage-tokens', 'tokens', addr, 'apy'],
    simulation: {
      mint: (addr: string, amount: bigint) => [
        'leverage-tokens',
        'tokens',
        addr,
        'simulate',
        'mint',
        amount.toString(),
      ],
      mintOnChain: (chainId: number, addr: string, amount: bigint) => [
        'leverage-tokens',
        'chain',
        chainId,
        'token',
        addr,
        'simulate',
        'mint',
        amount.toString(),
      ],
      mintKey: (params: { chainId: number | undefined; addr: string; amount: bigint }) =>
        typeof params.chainId === 'number'
          ? [
              'leverage-tokens',
              'chain',
              params.chainId,
              'token',
              params.addr,
              'simulate',
              'mint',
              params.amount.toString(),
            ]
          : [
              'leverage-tokens',
              'tokens',
              params.addr,
              'simulate',
              'mint',
              params.amount.toString(),
            ],
      redeem: (addr: string, amount: bigint) => [
        'leverage-tokens',
        'tokens',
        addr,
        'simulate',
        'redeem',
        amount.toString(),
      ],
      redeemOnChain: (chainId: number, addr: string, amount: bigint) => [
        'leverage-tokens',
        'chain',
        chainId,
        'token',
        addr,
        'simulate',
        'redeem',
        amount.toString(),
      ],
      redeemKey: (params: { chainId: number | undefined; addr: string; amount: bigint }) =>
        typeof params.chainId === 'number'
          ? [
              'leverage-tokens',
              'chain',
              params.chainId,
              'token',
              params.addr,
              'simulate',
              'redeem',
              params.amount.toString(),
            ]
          : [
              'leverage-tokens',
              'tokens',
              params.addr,
              'simulate',
              'redeem',
              params.amount.toString(),
            ],
      redeemPlan: (
        addr: string,
        amount: bigint,
        slippageBps: number,
        managerAddress?: string,
        swapKey?: string,
        outputAsset?: string,
      ) => [
        'leverage-tokens',
        'tokens',
        addr,
        'simulate',
        'redeem-plan',
        amount.toString(),
        `slippage:${slippageBps}`,
        managerAddress ? `manager:${managerAddress}` : 'manager:default',
        swapKey ? `swap:${swapKey}` : 'swap:default',
        outputAsset ? `output:${outputAsset}` : 'output:default',
      ],
      redeemPlanOnChain: (
        chainId: number,
        addr: string,
        amount: bigint,
        slippageBps: number,
        managerAddress?: string,
        swapKey?: string,
        outputAsset?: string,
      ) => [
        'leverage-tokens',
        'chain',
        chainId,
        'token',
        addr,
        'simulate',
        'redeem-plan',
        amount.toString(),
        `slippage:${slippageBps}`,
        managerAddress ? `manager:${managerAddress}` : 'manager:default',
        swapKey ? `swap:${swapKey}` : 'swap:default',
        outputAsset ? `output:${outputAsset}` : 'output:default',
      ],
      redeemPlanKey: (params: {
        chainId: number | undefined
        addr: string
        amount: bigint
        slippageBps: number
        managerAddress?: string
        swapKey?: string
        outputAsset?: string
      }) =>
        typeof params.chainId === 'number'
          ? [
              'leverage-tokens',
              'chain',
              params.chainId,
              'token',
              params.addr,
              'simulate',
              'redeem-plan',
              params.amount.toString(),
              `slippage:${params.slippageBps}`,
              params.managerAddress ? `manager:${params.managerAddress}` : 'manager:default',
              params.swapKey ? `swap:${params.swapKey}` : 'swap:default',
              params.outputAsset ? `output:${params.outputAsset}` : 'output:default',
            ]
          : [
              'leverage-tokens',
              'tokens',
              params.addr,
              'simulate',
              'redeem-plan',
              params.amount.toString(),
              `slippage:${params.slippageBps}`,
              params.managerAddress ? `manager:${params.managerAddress}` : 'manager:default',
              params.swapKey ? `swap:${params.swapKey}` : 'swap:default',
              params.outputAsset ? `output:${params.outputAsset}` : 'output:default',
            ],
    },
    mutations: {
      mintWrite: (params: { chainId: number; addr: string; account: string; planSig: string }) => [
        'leverage-tokens',
        'chain',
        params.chainId,
        'token',
        params.addr,
        'mutate',
        'mint',
        params.account,
        params.planSig,
      ],
    },
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
  fetchRewardsAprForToken: vi.fn().mockResolvedValue({ rewardsAPR: 0 }),
}))

// Mock GraphQL fetchers
vi.mock('@/lib/graphql/fetchers/leverage-tokens', () => ({
  fetchLeverageTokenPriceComparison: vi.fn(),
  fetchUserLeverageTokenPosition: vi.fn(),
}))

// Mock domain functions
vi.mock('@/domain/mint', () => ({
  orchestrateMint: vi.fn(),
}))

vi.mock('@/domain/mint/utils/createDebtToCollateralQuote', () => ({
  createDebtToCollateralQuote: vi.fn(),
}))

vi.mock('@/domain/redeem/utils/createCollateralToDebtQuote', () => ({
  createCollateralToDebtQuote: vi.fn(),
}))

vi.mock('@/domain/redeem/planner/plan', () => ({
  planRedeem: vi.fn(),
}))

// Mock leverage token config
vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: vi.fn(),
  leverageTokenConfigs: {
    'weeth-weth-17x-tenderly': {
      address: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
      symbol: 'weETH-WETH-17x',
      name: 'weETH-WETH 17x Leverage Token',
      decimals: 18,
      collateral: '0x4200000000000000000000000000000000000006', // WETH
      debt: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A', // weETH
      leverage: 17,
      isTestOnly: false,
    },
    'wsteth-eth-2x-mainnet': {
      address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3',
      symbol: 'WSTETH-ETH-2x',
      name: 'wstETH / ETH 2x Leverage Token',
      decimals: 18,
      collateral: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // wstETH
      debt: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      leverage: 2,
      isTestOnly: false,
    },
  },
  LeverageTokenKey: {
    WEETH_WETH_17X_TENDERLY: 'weeth-weth-17x-tenderly',
    WSTETH_ETH_2X_MAINNET: 'wsteth-eth-2x-mainnet',
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
