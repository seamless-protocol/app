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

// Legacy helper retained for tests/compatibility. Domain now prefers Wagmi actions.
export async function previewMint(
  clients: Pick<Clients, 'publicClient'>,
  manager: Address,
  token: Address,
  equityInCollateralAsset: bigint,
): Promise<PreviewMintResult> {
  const { collateral, debt, equity, shares, tokenFee, treasuryFee } =
    await clients.publicClient.readContract({
      address: manager,
      abi: leverageManagerAbi,
      functionName: 'previewMint',
      args: [token, equityInCollateralAsset],
    })
  return { collateral, debt, equity, shares, tokenFee, treasuryFee }
}
