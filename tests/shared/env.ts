import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { anvil, base, type Chain } from 'viem/chains'
import { z } from 'zod'
import { BASE_WETH, contractAddresses } from '../../src/lib/contracts/addresses.js'
import { WEETH_WETH_17X_TOKEN_ADDRESS } from '../fixtures/addresses'

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
  V4_POOL_MANAGER: z.string().optional(),
  V4_POSITION_MANAGER: z.string().optional(),
  V4_POSITION_DESCRIPTOR: z.string().optional(),
  V4_STATE_VIEW: z.string().optional(),
  V4_QUOTER: z.string().optional(),
  V4_UNIVERSAL_ROUTER: z.string().optional(),
  V4_PERMIT2: z.string().optional(),
  V4_HOOKS: z.string().optional(),
  V4_POOL_FEE: z.string().optional(),
  V4_POOL_TICK_SPACING: z.string().optional(),
})

export const Env = EnvSchema.parse(process.env)

// Prefer explicit TEST_RPC_URL or generic RPC_URL (e.g. Alchemy), else support VITE_BASE_RPC_URL/TENDERLY_RPC_URL, otherwise fall back to Anvil
const tenderlyPrimary =
  Env.TEST_RPC_URL ||
  Env.RPC_URL ||
  Env.VITE_BASE_RPC_URL ||
  (process.env['TENDERLY_RPC_URL'] as string | undefined)
export const mode: Mode = tenderlyPrimary ? 'tenderly' : 'anvil'

let primaryRpc: string
if (mode === 'tenderly') {
  const primary = tenderlyPrimary
  if (!primary) throw new Error('TEST_RPC_URL required in tenderly mode')
  primaryRpc = primary
} else {
  primaryRpc = Env.ANVIL_RPC_URL
}

// Allow a dedicated admin endpoint when using Tenderly VNets; otherwise fallback to primary
const adminRpc = (process.env['TENDERLY_ADMIN_RPC_URL'] as string | undefined) || primaryRpc
export const RPC = { primary: primaryRpc, admin: adminRpc }

async function detectChainId(rpcUrl: string): Promise<number> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

const chainContracts = contractAddresses[canonicalChainId]
if (!chainContracts) {
  throw new Error(`No contract addresses found for chain ${canonicalChainId}`)
}

const managerV1 = chainContracts.leverageManager
  ? (chainContracts.leverageManager as Address)
  : undefined
const managerV2 = chainContracts.leverageManagerV2
  ? (chainContracts.leverageManagerV2 as Address)
  : undefined
const routerV1 = chainContracts.leverageRouter
  ? (chainContracts.leverageRouter as Address)
  : undefined
const routerV2 = chainContracts.leverageRouterV2
  ? (chainContracts.leverageRouterV2 as Address)
  : undefined
const tokenMap = chainContracts.tokens ?? {}

function ensureAddress(label: string, value: Address | undefined): Address {
  if (!value) throw new Error(`Missing ${label} for chain ${canonicalChainId}`)
  return getAddress(value)
}

function optionalAddress(value: Address | undefined): Address | undefined {
  return value ? getAddress(value) : undefined
}

export const ADDR = {
  factory: ensureAddress('leverageTokenFactory', chainContracts.leverageTokenFactory),
  manager: ensureAddress('leverageManager', (managerV2 ?? managerV1) as Address | undefined),
  managerV1: optionalAddress(managerV1),
  managerV2: optionalAddress(managerV2),
  router: ensureAddress('leverageRouter', (routerV2 ?? routerV1) as Address | undefined),
  routerV1: optionalAddress(routerV1),
  routerV2: optionalAddress(routerV2),
  leverageToken: getAddress(WEETH_WETH_17X_TOKEN_ADDRESS),
  usdc: ensureAddress(
    'usdc token',
    (Env.TEST_USDC as Address | undefined) ?? (tokenMap.usdc as Address | undefined),
  ),
  weth: ensureAddress(
    'weth token',
    (Env.TEST_WETH as Address | undefined) ?? (tokenMap.weth as Address | undefined) ?? BASE_WETH,
  ),
  weeth: ensureAddress(
    'weeth token',
    (Env.TEST_WEETH as Address | undefined) ?? (tokenMap.weeth as Address | undefined),
  ),
  executor: optionalAddress(chainContracts.multicall),
  poolManagerV4: optionalAddress(Env.V4_POOL_MANAGER as Address | undefined),
  positionManagerV4: optionalAddress(Env.V4_POSITION_MANAGER as Address | undefined),
  positionDescriptorV4: optionalAddress(Env.V4_POSITION_DESCRIPTOR as Address | undefined),
  stateViewV4: optionalAddress(Env.V4_STATE_VIEW as Address | undefined),
  quoterV4: optionalAddress(Env.V4_QUOTER as Address | undefined),
  universalRouterV4: optionalAddress(Env.V4_UNIVERSAL_ROUTER as Address | undefined),
  permit2: optionalAddress(Env.V4_PERMIT2 as Address | undefined),
  v4Hooks: optionalAddress(Env.V4_HOOKS as Address | undefined),
} as const

export const Extra = {
  keys: (Env.TEST_PRIVATE_KEYS_CSV ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as Array<Hex>,
}

function toNumberOrUndefined(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  return undefined
}

export const V4 = {
  poolFee: toNumberOrUndefined(Env.V4_POOL_FEE),
  tickSpacing: toNumberOrUndefined(Env.V4_POOL_TICK_SPACING),
}
