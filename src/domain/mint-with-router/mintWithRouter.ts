import type { Address } from 'viem'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { leverageRouterAbi } from '@/lib/contracts/abis/leverageRouter'
import { ensureAllowance } from './allowance'
import { previewMint } from './previewMint'
import { BASE_TOKEN_ADDRESSES, createSwapContext, createWeETHSwapContext } from './swapContext'
import type { Addresses, Clients, IoOverrides, MintParams, MintResult } from './types'

export async function mintWithRouter(
  clients: Clients,
  addresses: Addresses,
  account: Address,
  params: MintParams,
  io?: IoOverrides,
): Promise<MintResult> {
  const { router, manager, token } = addresses
  const {
    equityInCollateralAsset,
    slippageBps = 50,
    maxSwapCostInCollateralAsset,
    swapContext,
  } = params

  // 1) Confirm collateral asset and preview mint
  const collateralAsset = (await clients.publicClient.readContract({
    address: manager,
    abi: leverageManagerAbi,
    functionName: 'getLeverageTokenCollateralAsset',
    args: [token],
  })) as Address

  const preview = await previewMint(
    { publicClient: clients.publicClient },
    manager,
    token,
    equityInCollateralAsset,
  )
  const minShares = (preview.shares * BigInt(10000 - slippageBps)) / 10000n

  // 2) Swap context
  const finalSwapContext =
    swapContext ??
    (await (async () => {
      const debtAsset = (await clients.publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenDebtAsset',
        args: [token],
      })) as Address
      const chainId = await clients.publicClient.getChainId()
      // Special-case weETH path per V1 pattern
      if (
        chainId === 8453 &&
        collateralAsset.toLowerCase() === BASE_TOKEN_ADDRESSES.weETH.toLowerCase()
      ) {
        return createWeETHSwapContext()
      }
      return createSwapContext(collateralAsset, debtAsset, chainId)
    })())

  // 3) Max swap cost default to 5%
  const finalMaxSwapCost = maxSwapCostInCollateralAsset ?? (equityInCollateralAsset * 500n) / 10000n

  // 4) Ensure allowance
  await ensureAllowance(clients, collateralAsset, account, router, equityInCollateralAsset, io)

  // 5) Simulate & Write
  const simulate = io?.simulateContract ?? clients.publicClient.simulateContract
  const write = io?.writeContract ?? clients.walletClient.writeContract
  const wait = io?.waitForTransactionReceipt ?? clients.publicClient.waitForTransactionReceipt

  const { request } = await simulate({
    address: router,
    abi: leverageRouterAbi,
    functionName: 'mint',
    args: [token, equityInCollateralAsset, minShares, finalMaxSwapCost, finalSwapContext],
    account,
  })

  const hash = await write(request)
  const receipt = await wait({ hash })

  return { hash, receipt, preview, minShares, slippageBps }
}
