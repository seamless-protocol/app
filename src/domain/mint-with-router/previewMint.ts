import type { Address } from 'viem'
import { leverageManagerAbi } from '@/lib/contracts'
import type { Clients, PreviewMintResult } from './types'

export async function previewMint(
  clients: Pick<Clients, 'publicClient'>,
  manager: Address,
  token: Address,
  equityInCollateralAsset: bigint,
): Promise<PreviewMintResult> {
  const res = await clients.publicClient.readContract({
    address: manager,
    abi: leverageManagerAbi,
    functionName: 'previewMint',
    args: [token, equityInCollateralAsset],
  })
  return {
    shares: res.shares as bigint,
    tokenFee: res.tokenFee as bigint,
    treasuryFee: res.treasuryFee as bigint,
  }
}
