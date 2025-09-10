import type { Address } from 'viem'
import { erc20Abi, maxUint256 } from 'viem'
import type { Clients, IoOverrides } from './types'

export async function ensureAllowance(
  clients: Clients,
  token: Address,
  owner: Address,
  spender: Address,
  minAmount: bigint,
  io?: IoOverrides,
) {
  const allowance = await clients.publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  })

  if (allowance >= minAmount) return

  const simulate = io?.simulateContract ?? clients.publicClient.simulateContract
  const write = io?.writeContract ?? clients.walletClient.writeContract
  const wait = io?.waitForTransactionReceipt ?? clients.publicClient.waitForTransactionReceipt

  const { request } = await simulate({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, maxUint256],
    account: owner,
  })
  const hash = await write(request)
  await wait({ hash })
}
