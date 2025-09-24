import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { anvil, base, type Chain } from 'viem/chains'
import { z } from 'zod'
import {
  getUniswapV3ChainConfig,
  getUniswapV3PoolConfig,
  type UniswapV3PoolKey,
} from '../../src/lib/config/uniswapV3.js'
import {
  BASE_WETH,
  contractAddresses,
  getContractAddresses,
} from '../../src/lib/contracts/addresses.js'
import {
  BASE_TENDERLY_VNET_ADMIN_RPC,
  BASE_TENDERLY_VNET_PRIMARY_RPC,
  DEFAULT_PROD_LEVERAGE_TOKEN_KEY,
  DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY,
  getDefaultLeverageTokenDefinition,
  getLeverageTokenDefinition,
  isLeverageTokenKey,
  type LeverageTokenDefinition,
  type LeverageTokenKey,
  type LeverageTokenSource,
  listLeverageTokens,
  TENDERLY_VNET_CONTRACT_OVERRIDES,
} from '../fixtures/addresses'

// Load environment variables for tests (integration/e2e)
// Priority (first one that provides a key wins):
// 1) Existing process.env (e.g., from shell)
// 2) project .env.local
// 3) project .env
// 4) tests/integration/.env
const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const projectRoot = resolve(__dirname, '../..')
// Do not override already-set env vars
config({ path: resolve(projectRoot, '.env.local'), override: false })
config({ path: resolve(projectRoot, '.env'), override: false })
config({ path: resolve(__dirname, '../integration/.env'), override: false })

export type Mode = 'tenderly' | 'anvil'

// Well-known Anvil/Hardhat test account #0 (publicly known, not a secret)
export const ANVIL_DEFAULT_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
export const ANVIL_DEFAULT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

const Defaults = {
  ANVIL_RPC_URL: anvil.rpcUrls.default.http[0],
}

// Unified env schema for tests (integration + E2E)
const EnvSchema = z.object({
  // RPC selection
  TEST_RPC_URL: z.url().optional(),
  // Allow a generic RPC URL to be provided (e.g., Alchemy)
  RPC_URL: z.url().optional(),
  VITE_BASE_RPC_URL: z.url().optional(),
  ANVIL_RPC_URL: z.url().default(Defaults.ANVIL_RPC_URL),

  // Keys
  TEST_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .default(ANVIL_DEFAULT_PRIVATE_KEY),
  TEST_PRIVATE_KEYS_CSV: z.string().optional(),

  // Token addresses (only tokens, contracts come from config)
  TEST_USDC: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_WETH: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_WEETH: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .default('0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A'),
})

export const Env = EnvSchema.parse(process.env)

function isLocalRpc(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost'
  } catch {
    return /^(https?:\/\/)?(127\.0\.0\.1|localhost)/i.test(url)
  }
}

const fallbackTenderlyRpc =
  (process.env['TENDERLY_RPC_URL'] as string | undefined) ||
  (process.env['TENDERLY_VNET_PRIMARY_RPC'] as string | undefined) ||
  BASE_TENDERLY_VNET_PRIMARY_RPC

const rpcCandidate = Env.TEST_RPC_URL || Env.RPC_URL || Env.VITE_BASE_RPC_URL || fallbackTenderlyRpc

export const mode: Mode = rpcCandidate && !isLocalRpc(rpcCandidate) ? 'tenderly' : 'anvil'

const primaryRpc: string = (() => {
  if (mode === 'tenderly') {
    if (rpcCandidate && !isLocalRpc(rpcCandidate)) return rpcCandidate
    return fallbackTenderlyRpc
  }

  if (rpcCandidate && isLocalRpc(rpcCandidate)) {
    return rpcCandidate
  }

  return Env.ANVIL_RPC_URL
})()

const adminRpcCandidate =
  (process.env['TENDERLY_ADMIN_RPC_URL'] as string | undefined) ||
  (process.env['TENDERLY_VNET_ADMIN_RPC'] as string | undefined) ||
  (mode === 'tenderly' ? BASE_TENDERLY_VNET_ADMIN_RPC : undefined)

const adminRpc = adminRpcCandidate ?? primaryRpc

if (!process.env['VITE_TEST_RPC_URL']) {
  process.env['VITE_TEST_RPC_URL'] = primaryRpc
}

if (!process.env['TEST_RPC_URL']) {
  process.env['TEST_RPC_URL'] = primaryRpc
}

if (mode === 'tenderly') {
  process.env['TENDERLY_VNET_PRIMARY_RPC'] ||= primaryRpc
  process.env['TENDERLY_VNET_ADMIN_RPC'] ||= adminRpc
  process.env['TENDERLY_ADMIN_RPC_URL'] ||= adminRpc
  process.env['VITE_BASE_RPC_URL'] ||= primaryRpc
  process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] ||= JSON.stringify(
    TENDERLY_VNET_CONTRACT_OVERRIDES,
  )
}

export const RPC = { primary: primaryRpc, admin: adminRpc }

function buildTenderlyHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = process.env['TENDERLY_TOKEN']
  const accessKey = process.env['TENDERLY_ACCESS_KEY']
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else if (accessKey) {
    headers['X-Access-Key'] = accessKey
  }
  return headers
}

async function detectChainId(rpcUrl: string): Promise<number> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: buildTenderlyHeaders(),
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const json = (await res.json()) as { result?: string }
    if (!json?.result || typeof json.result !== 'string') {
      throw new Error('Missing chain id in RPC response')
    }
    return Number(BigInt(json.result))
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to detect chain id from RPC ${rpcUrl}: ${details}`)
  }
}

const detectedChainId = await detectChainId(primaryRpc)
const chainIdsWithConfig = new Set<number>(Object.keys(contractAddresses).map(Number))

const canonicalChainId = (() => {
  if (chainIdsWithConfig.has(detectedChainId)) return detectedChainId
  if (detectedChainId === anvil.id && chainIdsWithConfig.has(base.id)) return base.id
  throw new Error(`No contract mapping configured for chain ${detectedChainId}`)
})()

const withRpc = (chain: Chain, id: number) => ({
  ...chain,
  id,
  rpcUrls: {
    ...chain.rpcUrls,
    default: { http: [primaryRpc] },
    public: { http: [primaryRpc] },
  },
})

const resolvedChain: Chain = (() => {
  if (detectedChainId === base.id) return withRpc(base, detectedChainId)
  if (detectedChainId === anvil.id) return withRpc({ ...base }, anvil.id)
  if (chainIdsWithConfig.has(detectedChainId)) return withRpc({ ...base }, detectedChainId)
  // canonicalChainId guard above will already throw for unsupported networks
  return withRpc(base, canonicalChainId)
})()

export const CHAIN_ID = detectedChainId
export const CANONICAL_CHAIN_ID = canonicalChainId
export const CHAIN = resolvedChain

function ensureAddress(label: string, chainId: number, value: Address | undefined): Address {
  if (!value) throw new Error(`Missing ${label} for chain ${chainId}`)
  return getAddress(value)
}

function optionalAddress(value: Address | undefined): Address | undefined {
  return value ? getAddress(value) : undefined
}

const leverageTokenSource: LeverageTokenSource = (() => {
  const raw = (process.env['E2E_TOKEN_SOURCE'] || 'tenderly').toLowerCase()
  return raw === 'prod' ? 'prod' : 'tenderly'
})()

const leverageTokenKey: LeverageTokenKey = (() => {
  const raw = process.env['E2E_LEVERAGE_TOKEN_KEY']
  if (!raw) {
    return leverageTokenSource === 'tenderly'
      ? DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY
      : DEFAULT_PROD_LEVERAGE_TOKEN_KEY
  }
  const normalized = raw.toLowerCase()
  if (!isLeverageTokenKey(normalized)) {
    throw new Error(`Unsupported leverage token key '${raw}'`)
  }
  const available = listLeverageTokens(leverageTokenSource)
  if (!available.some((token) => token.key === normalized)) {
    throw new Error(
      `Leverage token '${normalized}' not available for source '${leverageTokenSource}'`,
    )
  }
  return normalized
})()

const leverageTokenDefinition = getLeverageTokenDefinition(leverageTokenSource, leverageTokenKey)
const leverageTokenAddress = getAddress(leverageTokenDefinition.address)
const leverageTokenLabel = leverageTokenDefinition.label

process.env['E2E_TOKEN_SOURCE'] = leverageTokenSource
process.env['E2E_LEVERAGE_TOKEN_KEY'] = leverageTokenKey
process.env['E2E_LEVERAGE_TOKEN_ADDRESS'] = leverageTokenAddress
process.env['E2E_LEVERAGE_TOKEN_LABEL'] = leverageTokenLabel
process.env['E2E_CHAIN_ID'] ||= String(canonicalChainId)

type LeverageTokenAddresses = {
  factory: Address
  manager: Address
  managerV1?: Address
  managerV2?: Address
  router: Address
  routerV1?: Address
  routerV2?: Address
  leverageToken: Address
  usdc: Address
  weth: Address
  weeth: Address
  executor?: Address
  veloraAdapter?: Address
  rebalanceAdapter?: Address
  lendingAdapter?: Address
  uniswapV3?: {
    pool: Address
    fee: number
    quoter?: Address
    router?: Address
    tickSpacing?: number
  }
}

function buildAddressContext(
  definition: LeverageTokenDefinition,
  source: LeverageTokenSource = leverageTokenSource,
): LeverageTokenAddresses {
  const contracts = getContractAddresses(definition.chainId)
  if (!contracts || Object.keys(contracts).length === 0) {
    throw new Error(`No contract addresses found for chain ${definition.chainId}`)
  }

  const managerV1 = contracts.leverageManager as Address | undefined
  const managerV2 = contracts.leverageManagerV2 as Address | undefined
  const routerV1 = contracts.leverageRouter as Address | undefined
  const routerV2 = contracts.leverageRouterV2 as Address | undefined
  const tokenMap = contracts.tokens ?? {}

  const managerOverride = definition.leverageManager
  const routerOverride = definition.leverageRouter
  const executorOverride = definition.multicallExecutor
  const veloraOverride = definition.veloraAdapter
  const rebalanceOverride = definition.rebalanceAdapter
  const lendingOverride = definition.lendingAdapter

  const resolvedManagerV2 = managerOverride ?? managerV2 ?? managerV1
  const resolvedManagerV1 = managerV1 ?? managerOverride
  const resolvedRouterV2 = routerOverride ?? routerV2 ?? routerV1
  const resolvedRouterV1 = routerV1 ?? routerOverride

  const primaryManager = managerOverride ?? managerV2 ?? managerV1
  const primaryRouter = routerOverride ?? routerV2 ?? routerV1

  const result: LeverageTokenAddresses = {
    factory: ensureAddress(
      'leverageTokenFactory',
      definition.chainId,
      contracts.leverageTokenFactory as Address | undefined,
    ),
    manager: ensureAddress(
      'leverageManager',
      definition.chainId,
      primaryManager as Address | undefined,
    ),
    router: ensureAddress(
      'leverageRouter',
      definition.chainId,
      primaryRouter as Address | undefined,
    ),
    leverageToken: getAddress(definition.address),
    usdc: ensureAddress(
      'usdc token',
      definition.chainId,
      (Env.TEST_USDC as Address | undefined) ?? (tokenMap.usdc as Address | undefined),
    ),
    weth: ensureAddress(
      'weth token',
      definition.chainId,
      (Env.TEST_WETH as Address | undefined) ?? (tokenMap.weth as Address | undefined) ?? BASE_WETH,
    ),
    weeth: ensureAddress(
      'weeth token',
      definition.chainId,
      (Env.TEST_WEETH as Address | undefined) ?? (tokenMap.weeth as Address | undefined),
    ),
  }

  const managerV1Address = optionalAddress(resolvedManagerV1)
  const managerV2Address = optionalAddress(resolvedManagerV2)
  const routerV1Address = optionalAddress(resolvedRouterV1)
  const routerV2Address = optionalAddress(resolvedRouterV2)
  const executorAddress = optionalAddress(
    executorOverride ?? (contracts.multicall as Address | undefined),
  )
  const veloraAddress = optionalAddress(veloraOverride)
  const rebalanceAddress = optionalAddress(rebalanceOverride)
  const lendingAddress = optionalAddress(lendingOverride)

  if (managerV1Address) result.managerV1 = managerV1Address
  if (managerV2Address) result.managerV2 = managerV2Address
  if (routerV1Address) result.routerV1 = routerV1Address
  if (routerV2Address) result.routerV2 = routerV2Address
  if (executorAddress) result.executor = executorAddress
  if (veloraAddress) result.veloraAdapter = veloraAddress
  if (rebalanceAddress) result.rebalanceAdapter = rebalanceAddress
  if (lendingAddress) result.lendingAdapter = lendingAddress

  const swapV3Config = definition.swap?.uniswapV3
  const isTenderlySource = source === 'tenderly'
  const poolKey: UniswapV3PoolKey | undefined = swapV3Config?.poolKey
  const chainV3Config = getUniswapV3ChainConfig(definition.chainId)
  const poolConfig = poolKey ? getUniswapV3PoolConfig(definition.chainId, poolKey) : undefined
  const resolvedPool = swapV3Config?.pool ?? (isTenderlySource ? undefined : poolConfig?.address)
  const resolvedFee = swapV3Config?.fee ?? (isTenderlySource ? undefined : poolConfig?.fee)
  const resolvedQuoter = optionalAddress(
    (swapV3Config?.quoter as Address | undefined) ??
      (isTenderlySource ? undefined : chainV3Config?.quoter),
  )
  const resolvedRouter = optionalAddress(
    (swapV3Config?.router as Address | undefined) ??
      (isTenderlySource ? undefined : chainV3Config?.swapRouter),
  )
  const resolvedTickSpacing = poolConfig?.tickSpacing

  if (resolvedPool && typeof resolvedFee === 'number') {
    result.uniswapV3 = {
      pool: getAddress(resolvedPool),
      fee: resolvedFee,
      ...(resolvedQuoter ? { quoter: resolvedQuoter } : {}),
      ...(resolvedRouter ? { router: resolvedRouter } : {}),
      ...(typeof resolvedTickSpacing === 'number' ? { tickSpacing: resolvedTickSpacing } : {}),
    }
  }

  return result
}

const AVAILABLE_LEVERAGE_TOKENS = listLeverageTokens(leverageTokenSource)

export function getAddressesForToken(
  key: LeverageTokenKey,
  source: LeverageTokenSource = leverageTokenSource,
): LeverageTokenAddresses {
  const definition = getLeverageTokenDefinition(source, key)
  return buildAddressContext(definition, source)
}

export const ADDR = buildAddressContext(leverageTokenDefinition, leverageTokenSource)

export const Extra = {
  keys: (Env.TEST_PRIVATE_KEYS_CSV ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as Array<Hex>,
}

export const TOKEN_SOURCE = leverageTokenSource
export const LEVERAGE_TOKEN_KEY = leverageTokenKey
export const LEVERAGE_TOKEN_ADDRESS = leverageTokenAddress
export const LEVERAGE_TOKEN_LABEL = leverageTokenLabel
export const LEVERAGE_TOKEN_DEFINITION = leverageTokenDefinition
export { AVAILABLE_LEVERAGE_TOKENS }
export const DEFAULT_CHAIN_ID = canonicalChainId
export const DEFAULT_TENDERLY_ADDRESS = getAddress(
  getDefaultLeverageTokenDefinition('tenderly').address,
)

export type { LeverageTokenAddresses }
