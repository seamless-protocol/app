import type { Address, Hash, PublicClient, WalletClient } from 'viem'
import { erc20Abi, maxUint256 } from 'viem'

export interface EnsureAllowanceParams {
  publicClient: PublicClient
  walletClient: WalletClient
  token: Address
  owner: Address
  spender: Address
  minAmount: bigint
  simulateContract?: PublicClient['simulateContract']
  writeContract?: WalletClient['writeContract']
}

/**
 * Ensures an ERC-20 allowance is sufficient for a spender, approving max allowance if needed.
 * - Returns early when allowance >= minAmount
 * - Otherwise simulates + sends approve(maxUint256) and returns the tx hash (does not wait)
 */
export async function ensureAllowance({
  publicClient,
  walletClient,
  token,
  owner,
  spender,
  minAmount,
  simulateContract,
  writeContract,
}: EnsureAllowanceParams): Promise<{ changed: boolean; hash?: Hash }> {
  const allowance = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  })

  if (allowance >= minAmount) return { changed: false }

  const simulate = simulateContract ?? publicClient.simulateContract
  const write = writeContract ?? walletClient.writeContract

  const { request } = await simulate({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, maxUint256],
    account: owner,
  })
  const hash = await write(request)
  return { changed: true, hash }
}
