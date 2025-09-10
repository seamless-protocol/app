import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { z } from 'zod'

// Load local .env if present (used in integration/e2e runs)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../integration/.env') })

export type Mode = 'tenderly' | 'anvil'

// Well-known Anvil/Hardhat test account #0 (publicly known, not a secret)
export const ANVIL_DEFAULT_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
export const ANVIL_DEFAULT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

const Defaults = {
  ANVIL_RPC_URL: 'http://127.0.0.1:8545',
}

// Unified env schema for tests (integration + E2E)
const EnvSchema = z.object({
  // RPC selection
  TEST_RPC_URL: z.string().url().optional(),
  ANVIL_RPC_URL: z.string().url().default(Defaults.ANVIL_RPC_URL),

  // Keys
  TEST_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .default(ANVIL_DEFAULT_PRIVATE_KEY),
  TEST_PRIVATE_KEYS_CSV: z.string().optional(),

  // Contract addresses (Base)
  TEST_LEVERAGE_FACTORY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
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

const tenderlyPrimary = Env.TEST_RPC_URL
export const mode: Mode = tenderlyPrimary ? 'tenderly' : 'anvil'

let primaryRpc: string
if (mode === 'tenderly') {
  const primary = tenderlyPrimary
  if (!primary) throw new Error('TEST_RPC_URL required in tenderly mode')
  primaryRpc = primary
} else {
  primaryRpc = Env.ANVIL_RPC_URL
}
// For both Tenderly and Anvil, admin and primary are the same endpoint
export const RPC = { primary: primaryRpc, admin: primaryRpc }

export const ADDR = {
  factory: Env.TEST_LEVERAGE_FACTORY ? getAddress(Env.TEST_LEVERAGE_FACTORY) : (undefined as any),
  manager: Env.TEST_LEVERAGE_MANAGER ? getAddress(Env.TEST_LEVERAGE_MANAGER) : (undefined as any),
  router: Env.TEST_LEVERAGE_ROUTER ? getAddress(Env.TEST_LEVERAGE_ROUTER) : (undefined as any),
  leverageToken: Env.TEST_LEVERAGE_TOKEN_PROXY
    ? getAddress(Env.TEST_LEVERAGE_TOKEN_PROXY)
    : (undefined as any),
  usdc: Env.TEST_USDC ? getAddress(Env.TEST_USDC) : (undefined as any),
  weth: Env.TEST_WETH
    ? getAddress(Env.TEST_WETH)
    : ('0x4200000000000000000000000000000000000006' as Address as any),
  weeth: getAddress(Env.TEST_WEETH),
} as const

export const Extra = {
  keys: (Env.TEST_PRIVATE_KEYS_CSV ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as Array<Hex>,
}
