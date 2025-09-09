import { resolve } from 'node:path'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { z } from 'zod'

// Load local .env if present (used in integration/e2e runs)
config({ path: resolve(__dirname, '../integration/.env') })

export type Mode = 'tenderly' | 'anvil'

const Defaults = {
  ANVIL_RPC_URL: 'http://127.0.0.1:8545',
}

// Unified env schema for tests (integration + E2E)
const EnvSchema = z.object({
  // RPC selection
  TENDERLY_RPC_URL: z.string().url().optional(),
  TENDERLY_ADMIN_RPC_URL: z.string().url().optional(),
  ANVIL_RPC_URL: z.string().url().default(Defaults.ANVIL_RPC_URL),

  // Keys
  TEST_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .default('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
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

export const mode: Mode = Env.TENDERLY_RPC_URL ? 'tenderly' : 'anvil'

let primaryRpc: string
let adminRpc: string
if (mode === 'tenderly') {
  const primary = Env.TENDERLY_RPC_URL
  if (!primary) throw new Error('TENDERLY_RPC_URL required in tenderly mode')
  primaryRpc = primary
  adminRpc = Env.TENDERLY_ADMIN_RPC_URL ?? primary
} else {
  primaryRpc = Env.ANVIL_RPC_URL
  adminRpc = Env.ANVIL_RPC_URL
}
export const RPC = { primary: primaryRpc, admin: adminRpc }

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
