import { resolve } from 'node:path'
import { config } from 'dotenv'
import {
  http,
  type Address,
  type Hash,
  type Hex,
  createPublicClient,
  createTestClient,
  createWalletClient,
  getAddress,
  parseEther,
  publicActions,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { z } from 'zod'

// Load .env file from integration directory
config({ path: resolve(__dirname, '.env') })

/** ──────────────────────────────────────────────────────────────────────
 *  ENV
 *  ──────────────────────────────────────────────────────────────────── */
const defaults = {
  ANVIL_PORT: process.env.ANVIL_PORT ?? '8545',
}
const ANVIL_RPC_URL =
  process.env.ANVIL_RPC_URL ?? `http://127.0.0.1:${process.env.ANVIL_PORT ?? defaults.ANVIL_PORT}`

// --------- Env (schema-first) ----------
const Env = z
  .object({
    // ✅ Replaces TEST_TENDERLY_ADMIN_RPC_BASE
    ANVIL_BASE_FORK_URL: z.string().url().optional(), // used by the anvil process, not by tests
    ANVIL_RPC_URL: z.string().url().default(ANVIL_RPC_URL),
    TEST_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    TEST_PRIVATE_KEYS_CSV: z.string().optional(),
    TEST_LEVERAGE_FACTORY: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_LEVERAGE_MANAGER: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_LEVERAGE_ROUTER: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_LEVERAGE_TOKEN_PROXY: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_USDC: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_WETH: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  })
  .parse(process.env)

/** ──────────────────────────────────────────────────────────────────────
 *  Clients
 *  ──────────────────────────────────────────────────────────────────── */
export const chain = base

export const publicClient = createPublicClient({
  chain,
  transport: http(Env.ANVIL_RPC_URL, { batch: true }),
  batch: { multicall: true },
})

export const account = privateKeyToAccount(Env.TEST_PRIVATE_KEY as Hex)
export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(Env.ANVIL_RPC_URL),
}).extend(publicActions)

export const testClient = createTestClient({
  chain,
  mode: 'anvil',
  transport: http(Env.ANVIL_RPC_URL),
})

// Optional extra accounts for multi-user scenarios
const extraKeys = (Env.TEST_PRIVATE_KEYS_CSV ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean) as Array<Hex>

export const extraAccounts = extraKeys.map((k) => privateKeyToAccount(k))
export const extraWallets = extraAccounts.map((acct) =>
  createWalletClient({
    account: acct,
    chain,
    transport: http(Env.ANVIL_RPC_URL),
  }),
)

export const ADDR = {
  factory: getAddress(Env.TEST_LEVERAGE_FACTORY),
  manager: getAddress(Env.TEST_LEVERAGE_MANAGER),
  router: getAddress(Env.TEST_LEVERAGE_ROUTER),
  leverageToken: getAddress(Env.TEST_LEVERAGE_TOKEN_PROXY),
  usdc: getAddress(Env.TEST_USDC),
  weth: getAddress(Env.TEST_WETH),
}

/** ──────────────────────────────────────────────────────────────────────
 *  Fork controls (snapshot / revert) via Test Actions
 *  ──────────────────────────────────────────────────────────────────── */
export async function takeSnapshot(): Promise<Hash> {
  return await testClient.snapshot()
}

export async function revertSnapshot(id: Hash) {
  await testClient.revert({ id })
}

/** ──────────────────────────────────────────────────────────────────────
 *  Funding helpers (Anvil Test Actions)
 *  ──────────────────────────────────────────────────────────────────── */
export async function topUpNative(to: Address, ether: string) {
  await testClient.setBalance({ address: to, value: parseEther(ether) })
}
