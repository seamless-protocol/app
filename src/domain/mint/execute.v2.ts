import type { Address } from 'viem'
import { leverageRouterV2Abi } from '@/lib/contracts'
import { ensureAllowance } from './allowance'
import type { Clients, IoOverrides } from './types'

export async function executeMintV2(
  clients: Clients,
  router: Address,
  token: Address,
  account: Address,
  plan: {
    inputAsset: Address
    equityInInputAsset: bigint
    minShares: bigint
    calls: Array<{ target: Address; data: `0x${string}`; value: bigint }>
  },
  maxSwapCostInCollateralAsset?: bigint,
  io?: IoOverrides,
) {
  const simulate = io?.simulateContract ?? clients.publicClient.simulateContract
  const write = io?.writeContract ?? clients.walletClient.writeContract
  const wait = io?.waitForTransactionReceipt ?? clients.publicClient.waitForTransactionReceipt

  await ensureAllowance(clients, plan.inputAsset, account, router, plan.equityInInputAsset, io)

  const maxSwapCost = maxSwapCostInCollateralAsset ?? (plan.equityInInputAsset * 500n) / 10_000n

  const { request } = await simulate({
    address: router,
    abi: leverageRouterV2Abi,
    functionName: 'mintWithCalls',
    args: [token, plan.equityInInputAsset, plan.minShares, maxSwapCost, plan.calls],
    account,
  })

  const hash = await write(request)
  const receipt = await wait({ hash })
  return { hash, receipt }
}
