import { resolve } from 'node:path'
import { config } from 'dotenv'
import {
  type Address,
  createPublicClient,
  createTestClient,
  createWalletClient,
  getAddress,
  type Hash,
  type Hex,
  http,
  parseEther,
  publicActions,
  toHex,
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
  ANVIL_PORT: process.env['ANVIL_PORT'] ?? '8545',
}
const ANVIL_RPC_URL =
  process.env['ANVIL_RPC_URL'] ??
  `http://127.0.0.1:${process.env['ANVIL_PORT'] ?? defaults.ANVIL_PORT}`

// --------- Env (schema-first) ----------
const Env = z
  .object({
    // Tenderly (optional; when provided, becomes default mode)
    TENDERLY_RPC_URL: z.string().url().optional(),
    TENDERLY_ADMIN_RPC_URL: z.string().url().optional(),

    // Anvil (optional; used when Tenderly vars are not set)
    ANVIL_BASE_FORK_URL: z.string().url().optional(), // used by the anvil process, not by tests
    ANVIL_RPC_URL: z.string().url().default(ANVIL_RPC_URL),

    // Keys & addresses (shared)
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

// Mode selection: Tenderly when RPC present, otherwise Anvil
export type IntegrationMode = 'tenderly' | 'anvil'
export const mode: IntegrationMode = Env.TENDERLY_RPC_URL ? 'tenderly' : 'anvil'

// Shared account
export const account = privateKeyToAccount(Env.TEST_PRIVATE_KEY as Hex)

// Primary RPC transport
const primaryRpcUrl = mode === 'tenderly' ? (Env.TENDERLY_RPC_URL as string) : Env.ANVIL_RPC_URL

export const publicClient = createPublicClient({
  chain,
  transport: http(primaryRpcUrl, { batch: true }),
  batch: { multicall: true },
})

export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(primaryRpcUrl),
}).extend(publicActions)

// Optional admin client for Tenderly (for setBalance / setErc20Balance)
let adminRpcUrl: string
if (mode === 'tenderly') {
  const primary = Env.TENDERLY_RPC_URL
  if (!primary) throw new Error('TENDERLY_RPC_URL is required in tenderly mode')
  adminRpcUrl = Env.TENDERLY_ADMIN_RPC_URL ?? primary
} else {
  adminRpcUrl = Env.ANVIL_RPC_URL
}
export const adminClient = createPublicClient({
  chain,
  transport: http(adminRpcUrl),
})

// Test Actions (only available on Anvil)
export const testClient =
  mode === 'anvil'
    ? createTestClient({
        chain,
        mode: 'anvil',
        transport: http(Env.ANVIL_RPC_URL),
      })
    : (undefined as unknown as ReturnType<typeof createTestClient>)

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
    transport: http(primaryRpcUrl),
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
  if (mode === 'anvil') {
    return await testClient.snapshot()
  }
  // Tenderly: use evm_snapshot (returns string id)
  const id = (await adminClient.request({ method: 'evm_snapshot', params: [] })) as string
  return id as Hash
}

export async function revertSnapshot(id: Hash) {
  if (mode === 'anvil') {
    await testClient.revert({ id })
    return
  }
  await adminClient.request({ method: 'evm_revert', params: [id] })
}

/** ──────────────────────────────────────────────────────────────────────
 *  Funding helpers (Anvil Test Actions)
 *  ──────────────────────────────────────────────────────────────────── */
/** Top up native balance using admin RPC (Tenderly) or Test Actions (Anvil) */
export async function topUpNative(to: Address, ether: string) {
  if (mode === 'anvil') {
    await testClient.setBalance({ address: to, value: parseEther(ether) })
    return
  }
  // Tenderly admin method expects hex balance
  const value = toHex(parseEther(ether))
  await adminClient.request({
    method: 'tenderly_setBalance',
    params: [to, value],
  })
}

/** Set ERC20 balance directly via Tenderly admin, if available */
export async function setErc20Balance(token: Address, to: Address, humanUnits: string) {
  // Convert human to hex via decimals read
  const decimals = (await publicClient.readContract({
    address: token,
    abi: [
      {
        type: 'function',
        name: 'decimals',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
      },
    ] as const,
    functionName: 'decimals',
  })) as number

  // Use viem's parseUnits for accurate conversion
  const { parseUnits } = await import('viem')
  const raw = parseUnits(humanUnits, decimals)
  const valueHex = toHex(raw)

  await adminClient.request({
    method: 'tenderly_setErc20Balance',
    params: [token, to, valueHex],
  })
}
