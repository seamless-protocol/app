import type { Hash, Hex } from 'viem'
import { createPublicClient, createTestClient, createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { ADDR, Env, Extra, mode, RPC } from './env'

export { ADDR, mode }

export const chain = base
export const account = privateKeyToAccount(Env.TEST_PRIVATE_KEY as Hex)

export const publicClient = createPublicClient({
  chain,
  transport: http(RPC.primary, { batch: true }),
  batch: { multicall: true },
})

export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(RPC.primary),
}).extend(publicActions)

export const adminClient = createPublicClient({ chain, transport: http(RPC.admin) })

export async function adminRequest<T = unknown>(method: string, params: Array<any> = []) {
  const req = (
    adminClient as unknown as {
      request: (args: { method: string; params?: Array<any> }) => Promise<any>
    }
  ).request
  return (await req({ method, params })) as T
}

export const testClient =
  mode === 'anvil'
    ? createTestClient({ chain, mode: 'anvil', transport: http(RPC.primary) })
    : (undefined as unknown as ReturnType<typeof createTestClient>)

export const extraAccounts = Extra.keys.map((k) => privateKeyToAccount(k))
export const extraWallets = extraAccounts.map((acct) =>
  createWalletClient({ account: acct, chain, transport: http(RPC.primary) }),
)

export async function takeSnapshot(): Promise<Hash> {
  if (mode === 'anvil') return await testClient.snapshot()
  const id = await adminRequest<string>('evm_snapshot', [])
  return id as unknown as Hash
}

export async function revertSnapshot(id: Hash) {
  if (mode === 'anvil') return await testClient.revert({ id })
  await adminRequest('evm_revert', [id])
}
