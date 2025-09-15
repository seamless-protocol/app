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

/**
 * Administrative RPC request function for Tenderly VNet operations
 *
 * This function provides access to Tenderly's administrative RPC methods that allow
 * modifying blockchain state during testing. These methods are only available on
 * Tenderly Virtual Networks (VNets) and provide capabilities not available on
 * standard RPC endpoints.
 *
 * Key operations:
 * - `tenderly_setBalance(address, amount)` - Set native token balance for any address
 * - `tenderly_setErc20Balance(token, address, amount)` - Set ERC20 token balance
 * - `evm_snapshot()` - Create blockchain state snapshot for test isolation
 * - `evm_revert(id)` - Revert to previous snapshot state
 *
 * @param method - The RPC method name (e.g., 'tenderly_setBalance', 'evm_snapshot')
 * @param params - Array of parameters for the RPC method
 * @returns Promise with the RPC response
 *
 * @example
 * // Fund an address with 10 ETH on Tenderly VNet
 * await adminRequest('tenderly_setBalance', [address, '0x8ac7230489e80000'])
 *
 * // Set ERC20 balance (5 tokens with 18 decimals)
 * await adminRequest('tenderly_setErc20Balance', [tokenAddress, userAddress, '0x4563918244f40000'])
 *
 * // Create snapshot for test isolation
 * const snapshotId = await adminRequest<string>('evm_snapshot', [])
 */
export async function adminRequest<T = unknown>(method: string, params: Array<any> = []) {
  try {
    console.info('[ADMIN RPC] request', {
      method,
      // Avoid dumping large payloads; show brief param summary
      paramsPreview: Array.isArray(params)
        ? params.map((p) =>
            typeof p === 'string'
              ? `${p.slice(0, 10)}...`
              : Array.isArray(p)
                ? `[${p.length}]`
                : typeof p,
          )
        : typeof params,
    })
    const req = (
      adminClient as unknown as {
        request: (args: { method: string; params?: Array<any> }) => Promise<any>
      }
    ).request
    const res = (await req({ method, params })) as T
    console.info('[ADMIN RPC] response', { method, ok: true })
    return res
  } catch (err) {
    console.error('[ADMIN RPC] error', { method, err })
    throw err
  }
}

export const testClient =
  mode === 'anvil'
    ? createTestClient({ chain, mode: 'anvil', transport: http(RPC.primary) })
    : (undefined as unknown as ReturnType<typeof createTestClient>)

export const extraAccounts = Extra.keys.map((k) => privateKeyToAccount(k))
export const extraWallets = extraAccounts.map((acct) =>
  createWalletClient({ account: acct, chain, transport: http(RPC.primary) }),
)

/**
 * Create a blockchain state snapshot for test isolation
 *
 * This function captures the current state of the blockchain (balances, contract storage,
 * transaction history, etc.) and returns a snapshot ID that can be used to revert back to
 * this exact state later. This is essential for test isolation - each test can start with
 * a clean, known state.
 *
 * Implementation varies by backend:
 * - **Anvil**: Uses native `anvil_snapshot` RPC method
 * - **Tenderly VNet**: Uses `evm_snapshot` via adminRequest
 *
 * @returns Promise<Hash> - Snapshot ID that can be used with revertSnapshot()
 *
 * @example
 * ```typescript
 * // At start of test - capture clean state
 * const snapId = await takeSnapshot()
 *
 * // ... run test logic that modifies blockchain state ...
 *
 * // At end of test - restore clean state
 * await revertSnapshot(snapId)
 * ```
 */
export async function takeSnapshot(): Promise<Hash> {
  if (mode === 'anvil') return await testClient.snapshot()
  const id = await adminRequest<string>('evm_snapshot', [])
  return id as unknown as Hash
}

/**
 * Revert blockchain state to a previous snapshot
 *
 * This function restores the blockchain to the exact state it was in when the snapshot
 * was taken. All transactions, balance changes, contract deployments, and storage
 * modifications that occurred after the snapshot are undone.
 *
 * This is used for test isolation - each test reverts to a clean snapshot state
 * afterwards, ensuring tests don't interfere with each other.
 *
 * Implementation varies by backend:
 * - **Anvil**: Uses native `anvil_revert` RPC method
 * - **Tenderly VNet**: Uses `evm_revert` via adminRequest
 *
 * @param id - Snapshot ID returned from takeSnapshot()
 *
 * @example
 * ```typescript
 * const snapId = await takeSnapshot()
 *
 * // Test makes changes: fund accounts, execute transactions, etc.
 * await fundAccount(address, '10')
 * await executeTransaction(...)
 *
 * // Revert back to clean state
 * await revertSnapshot(snapId) // All changes are undone
 * ```
 */
export async function revertSnapshot(id: Hash) {
  if (mode === 'anvil') return await testClient.revert({ id })
  await adminRequest('evm_revert', [id])
}
