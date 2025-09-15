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
  /**
   * When true and a non-zero allowance exists, performs approve(0) before approve(maxUint256).
   * Some ERC-20s require resetting to zero before setting a new non-zero allowance.
   */
  resetThenMax?: boolean
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
  resetThenMax = false,
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

  let lastHash: Hash | undefined

  // Optionally reset allowance to zero first
  if (resetThenMax && allowance > 0n) {
    const zeroSim = await simulate({
      address: token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, 0n],
      account: owner,
    })
    lastHash = await write(zeroSim.request)
  }

  const maxSim = await simulate({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, maxUint256],
    account: owner,
  })
  lastHash = await write(maxSim.request)
  return { changed: true, hash: lastHash }
}

