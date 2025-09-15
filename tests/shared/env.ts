import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { anvil, base } from 'wagmi/chains'
import { z } from 'zod'
import { contractAddresses } from '../../src/lib/contracts/addresses.js'

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
  // Optional address overrides for VNets / custom deployments
  TEST_MANAGER: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_ROUTER: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_LEVERAGE_TOKEN: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  // Legacy/alternate names used in older .env examples
  TEST_LEVERAGE_MANAGER: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_LEVERAGE_ROUTER: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_LEVERAGE_TOKEN_PROXY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_MULTICALL_EXECUTOR: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_COLLATERAL: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  TEST_DEBT: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
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

// Use deployed contract addresses from config
const baseContracts = contractAddresses[base.id]
if (!baseContracts) {
  throw new Error('No contract addresses found for Base chain')
}

export const ADDR = {
  factory: baseContracts.leverageTokenFactory as Address,
  manager: (Env.TEST_MANAGER || Env.TEST_LEVERAGE_MANAGER
    ? getAddress((Env.TEST_MANAGER || Env.TEST_LEVERAGE_MANAGER) as string)
    : baseContracts.leverageManager) as Address,
  router: (Env.TEST_ROUTER || Env.TEST_LEVERAGE_ROUTER
    ? getAddress((Env.TEST_ROUTER || Env.TEST_LEVERAGE_ROUTER) as string)
    : baseContracts.leverageRouter) as Address,
  leverageToken: (Env.TEST_LEVERAGE_TOKEN || Env.TEST_LEVERAGE_TOKEN_PROXY
    ? getAddress((Env.TEST_LEVERAGE_TOKEN || Env.TEST_LEVERAGE_TOKEN_PROXY) as string)
    : ('0xa2fceeae99d2caeee978da27be2d95b0381dbb8c' as Address)) as Address,
  usdc: Env.TEST_USDC
    ? getAddress(Env.TEST_USDC)
    : ('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address),
  weth: getAddress(Env.TEST_WETH ?? '0x4200000000000000000000000000000000000006'),
  weeth: getAddress(Env.TEST_WEETH),
  executor: Env.TEST_MULTICALL_EXECUTOR
    ? getAddress(Env.TEST_MULTICALL_EXECUTOR)
    : (undefined as unknown as Address),
  // Optional overrides for collateral/debt in custom deployments
  collateral: Env.TEST_COLLATERAL ? getAddress(Env.TEST_COLLATERAL) : undefined,
  debt: Env.TEST_DEBT ? getAddress(Env.TEST_DEBT) : undefined,
} as const

export const Extra = {
  keys: (Env.TEST_PRIVATE_KEYS_CSV ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as Array<Hex>,
}
