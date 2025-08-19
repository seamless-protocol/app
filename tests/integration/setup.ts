import { z } from 'zod'
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type Hex,
} from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// --------- Env (schema-first) ----------
const Env = z
  .object({
    TEST_TENDERLY_ADMIN_RPC_BASE: z.string().url(),
    TEST_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    TEST_PRIVATE_KEYS_CSV: z.string().optional(),
    TEST_LEVERAGE_MANAGER: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_LEVERAGE_TOKEN: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    TEST_UNDERLYING_ERC20: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  })
  .parse(process.env)

export const chain = base
const transport = http(Env.TEST_TENDERLY_ADMIN_RPC_BASE, { batch: true })

export const publicClient = createPublicClient({
  chain,
  transport,
  batch: { multicall: true },
})

export const account = privateKeyToAccount(Env.TEST_PRIVATE_KEY as Hex)
export const walletClient = createWalletClient({ account, chain, transport })

// Optional extra accounts for multi-user scenarios
const extraKeys = (Env.TEST_PRIVATE_KEYS_CSV ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean) as Hex[]

export const extraAccounts = extraKeys.map((k) => privateKeyToAccount(k))
export const extraWallets = extraAccounts.map((acct) =>
  createWalletClient({ account: acct, chain, transport }),
)

export const ADDR = {
  manager: Env.TEST_LEVERAGE_MANAGER as `0x${string}`,
  lt: Env.TEST_LEVERAGE_TOKEN as `0x${string}`,
  underlying: Env.TEST_UNDERLYING_ERC20 as `0x${string}`,
}

// --------- Tenderly Admin RPC helpers ----------
export async function takeSnapshot(): Promise<string> {
  const id = await publicClient.request({ method: 'evm_snapshot', params: [] })
  return typeof id === 'string' ? id : String(id)
}

export async function revertSnapshot(id: string) {
  await publicClient.request({ method: 'evm_revert', params: [id] })
}

export async function topUpNative(to: `0x${string}`, ether: string) {
  const value = parseEther(ether)
  await publicClient.request({
    method: 'tenderly_setBalance',
    params: [to, `0x${value.toString(16)}`],
  })
}