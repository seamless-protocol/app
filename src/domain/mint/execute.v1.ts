import type { Address } from 'viem'
import { leverageRouterAbi } from '@/lib/contracts'
import { ensureAllowance } from './allowance'
import { getCollateralAsset, getDebtAsset } from './manager'
import { previewMint } from './previewMint'
import { BASE_TOKEN_ADDRESSES, createSwapContext, createWeETHSwapContext } from './swapContext'
import type { Addresses, Clients, IoOverrides } from './types'

export async function executeMintV1(
  clients: Clients,
  addresses: Addresses,
  account: Address,
  params: {
    inputAsset: Address // must equal collateralAsset
    equityInCollateralAsset: bigint
    slippageBps?: number
    maxSwapCostInCollateralAsset?: bigint
    io?: IoOverrides
  },
) {
  const { router, manager, token } = addresses
  const {
    inputAsset,
    equityInCollateralAsset,
    slippageBps = 50,
    maxSwapCostInCollateralAsset,
    io,
  } = params

  const collateralAsset = await getCollateralAsset(clients.publicClient, manager, token)

  if (inputAsset.toLowerCase() !== collateralAsset.toLowerCase()) {
    throw new Error('Router v1 only supports depositing the collateral asset directly.')
  }

  const preview = await previewMint(
    { publicClient: clients.publicClient },
    manager,
    token,
    equityInCollateralAsset,
  )
  const minShares = (preview.shares * BigInt(10_000 - slippageBps)) / 10_000n
  const maxSwapCost = maxSwapCostInCollateralAsset ?? (equityInCollateralAsset * 500n) / 10_000n

  const chainId = await clients.publicClient.getChainId()
  const debtAsset = await getDebtAsset(clients.publicClient, manager, token)

  const swapContext =
    chainId === 8453 && collateralAsset.toLowerCase() === BASE_TOKEN_ADDRESSES.weETH.toLowerCase()
      ? createWeETHSwapContext()
      : createSwapContext(collateralAsset, debtAsset, chainId)

  await ensureAllowance(clients, collateralAsset, account, router, equityInCollateralAsset, io)

  const simulate = io?.simulateContract ?? clients.publicClient.simulateContract
  const write = io?.writeContract ?? clients.walletClient.writeContract
  const wait = io?.waitForTransactionReceipt ?? clients.publicClient.waitForTransactionReceipt

  const { request } = await simulate({
    address: router,
    abi: leverageRouterAbi,
    functionName: 'mint',
    args: [token, equityInCollateralAsset, minShares, maxSwapCost, swapContext],
    account,
  })

  const hash = await write(request)
  const receipt = await wait({ hash })
  return { hash, receipt, preview }
}
