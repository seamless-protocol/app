import type { Address } from 'viem'
import { leverageManagerAbi } from '@/lib/contracts'
import type { Clients } from './types'

export type PreviewMintResult = {
  collateral: bigint
  debt: bigint
  equity: bigint
  shares: bigint
  tokenFee: bigint
  treasuryFee: bigint
}

export async function previewMint(
  clients: Pick<Clients, 'publicClient'>,
  manager: Address,
  token: Address,
  equityInCollateralAsset: bigint,
): Promise<PreviewMintResult> {
  const res = (await clients.publicClient.readContract({
    address: manager,
    abi: leverageManagerAbi,
    functionName: 'previewMint',
    args: [token, equityInCollateralAsset],
  })) as {
    collateral: bigint
    debt: bigint
    equity: bigint
    shares: bigint
    tokenFee: bigint
    treasuryFee: bigint
  }
  return res
}
