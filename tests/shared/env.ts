import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { type Address, getAddress, type Hex } from 'viem'
import { anvil, base } from 'wagmi/chains'
import { z } from 'zod'
import { contractAddresses } from '../../src/lib/contracts/addresses.js'

// Load local .env if present (used in integration/e2e runs)
const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
config({ path: resolve(__dirname, '../integration/.env') })

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

// Use deployed contract addresses from config
const baseContracts = contractAddresses[base.id]
if (!baseContracts) {
  throw new Error('No contract addresses found for Base chain')
}

export const ADDR = {
  factory: baseContracts.leverageTokenFactory as Address,
  manager: (Env.TEST_MANAGER
    ? getAddress(Env.TEST_MANAGER)
    : baseContracts.leverageManager) as Address,
  router: (Env.TEST_ROUTER ? getAddress(Env.TEST_ROUTER) : baseContracts.leverageRouter) as Address,
  leverageToken: (Env.TEST_LEVERAGE_TOKEN
    ? getAddress(Env.TEST_LEVERAGE_TOKEN)
    : ('0xa2fceeae99d2caeee978da27be2d95b0381dbb8c' as Address)) as Address,
  usdc: Env.TEST_USDC
    ? getAddress(Env.TEST_USDC)
    : ('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address),
  weth: getAddress(Env.TEST_WETH ?? '0x4200000000000000000000000000000000000006'),
  weeth: getAddress(Env.TEST_WEETH),
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
