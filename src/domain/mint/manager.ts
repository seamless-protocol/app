import type { Address, PublicClient } from 'viem'
import { leverageManagerAbi } from '@/lib/contracts'

export async function getCollateralAsset(
  publicClient: PublicClient,
  manager: Address,
  token: Address,
): Promise<Address> {
  return publicClient.readContract({
    address: manager,
    abi: leverageManagerAbi,
    functionName: 'getLeverageTokenCollateralAsset',
    args: [token],
  })
}

export async function getDebtAsset(
  publicClient: PublicClient,
  manager: Address,
  token: Address,
): Promise<Address> {
  return publicClient.readContract({
    address: manager,
    abi: leverageManagerAbi,
    functionName: 'getLeverageTokenDebtAsset',
    args: [token],
  })
}
