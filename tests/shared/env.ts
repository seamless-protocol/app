import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { anvil } from 'viem/chains'
import { z } from 'zod'
import {
  getUniswapV3ChainConfig,
  getUniswapV3PoolConfig,
  type UniswapV3PoolKey,
} from '../../src/lib/config/uniswapV3.js'
import { BASE_WETH, getContractAddresses } from '../../src/lib/contracts/addresses.js'
import {
  DEFAULT_PROD_LEVERAGE_TOKEN_KEY,
  DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY,
  getDefaultLeverageTokenDefinition,
  getLeverageTokenDefinition,
  isLeverageTokenKey,
  type LeverageTokenDefinition,
  type LeverageTokenKey,
  type LeverageTokenSource,
  listLeverageTokens,
} from '../fixtures/addresses'
import { resolveBackend } from './backend'

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

const backend = await resolveBackend()
const scenario = backend.scenario

export const BACKEND = backend
export const SCENARIO = scenario

export const mode: Mode = backend.executionKind
export const RPC = { primary: backend.rpcUrl, admin: backend.adminRpcUrl }

process.env['TEST_CHAIN'] = backend.chainKey
process.env['TEST_MODE'] = backend.mode
process.env['TEST_SCENARIO'] = scenario.key
process.env['E2E_TOKEN_SOURCE'] = scenario.leverageTokenSource
process.env['TEST_RPC_URL'] ||= backend.rpcUrl
process.env['VITE_TEST_RPC_URL'] ||= backend.rpcUrl
process.env['VITE_BASE_RPC_URL'] ||= backend.rpcUrl

if (backend.executionKind === 'tenderly') {
  process.env['TENDERLY_VNET_PRIMARY_RPC'] ||= backend.rpcUrl
  process.env['TENDERLY_VNET_ADMIN_RPC'] ||= backend.adminRpcUrl
  process.env['TENDERLY_ADMIN_RPC_URL'] ||= backend.adminRpcUrl
  if (backend.contractOverrides) {
    process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] ||= JSON.stringify(backend.contractOverrides)
  }
}

const detectedChainId = backend.chainId
const canonicalChainId = backend.canonicalChainId
const resolvedChain = backend.chain

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

const scenarioTokenKeys = [...new Set(scenario.leverageTokenKeys)]

function normalizeTokenSource(
  raw: string | undefined,
  fallback: LeverageTokenSource,
): LeverageTokenSource {
  if (!raw) return fallback
  const normalized = raw.toLowerCase()
  return normalized === 'prod' ? 'prod' : 'tenderly'
}

const leverageTokenSource: LeverageTokenSource = normalizeTokenSource(
  process.env['E2E_TOKEN_SOURCE'],
  scenario.leverageTokenSource,
)

const scenarioKeySet = new Set<LeverageTokenKey>(
  (scenarioTokenKeys.length > 0
    ? scenarioTokenKeys
    : listLeverageTokens(scenario.leverageTokenSource).map(
        (token) => token.key,
      )) as Array<LeverageTokenKey>,
)

const availableForSource = new Set<LeverageTokenKey>(
  listLeverageTokens(leverageTokenSource).map((token) => token.key) as Array<LeverageTokenKey>,
)

for (const key of Array.from(scenarioKeySet)) {
  if (!availableForSource.has(key)) {
    scenarioKeySet.delete(key)
  }
}

function assertTokenAvailable(
  source: LeverageTokenSource,
  key: LeverageTokenKey,
): LeverageTokenDefinition {
  if (!availableForSource.has(key)) {
    throw new Error(
      `Leverage token '${key}' not available for source '${source}'. Update scenario '${scenario.key}'.`,
    )
  }
  return getLeverageTokenDefinition(source, key)
}

const selectedTokenKey = (() => {
  const raw = process.env['E2E_LEVERAGE_TOKEN_KEY']
  if (!raw) {
    const fallbackKey =
      scenario.defaultLeverageTokenKey ??
      (leverageTokenSource === 'tenderly'
        ? DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY
        : DEFAULT_PROD_LEVERAGE_TOKEN_KEY)
    return fallbackKey
  }
  const normalized = raw.toLowerCase()
  if (!isLeverageTokenKey(normalized)) {
    throw new Error(`Unsupported leverage token key '${raw}'`)
  }
  return normalized
})()

if (!availableForSource.has(selectedTokenKey)) {
  throw new Error(
    `Leverage token '${selectedTokenKey}' not configured for source '${leverageTokenSource}'.`,
  )
}

const leverageTokenKey: LeverageTokenKey = selectedTokenKey

if (!scenarioKeySet.has(leverageTokenKey)) {
  scenarioKeySet.add(leverageTokenKey)
}

const leverageTokenDefinition = assertTokenAvailable(leverageTokenSource, leverageTokenKey)
const leverageTokenAddress = getAddress(leverageTokenDefinition.address)
const leverageTokenLabel = leverageTokenDefinition.label

process.env['E2E_TOKEN_SOURCE'] = leverageTokenSource
process.env['E2E_LEVERAGE_TOKEN_KEY'] = leverageTokenKey
process.env['E2E_LEVERAGE_TOKEN_ADDRESS'] = leverageTokenAddress
process.env['E2E_LEVERAGE_TOKEN_LABEL'] = leverageTokenLabel
process.env['E2E_CHAIN_ID'] ||= String(canonicalChainId)

type LeverageTokenAddresses = {
  factory?: Address
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

  const factoryAddress = optionalAddress(contracts.leverageTokenFactory as Address | undefined)
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

  if (factoryAddress) result.factory = factoryAddress
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

const AVAILABLE_LEVERAGE_TOKENS = Array.from(scenarioKeySet).map((key) =>
  assertTokenAvailable(leverageTokenSource, key),
)

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
