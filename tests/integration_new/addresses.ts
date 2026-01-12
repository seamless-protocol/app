import { mainnet } from 'viem/chains'
import { contractAddresses } from '@/lib/contracts/addresses'

function must<T>(value: T | null | undefined, msg: string): T {
  if (value == null) throw new Error(msg)
  return value
}

export const mainnetAddresses = {
  leverageRouterV2: must(
    contractAddresses[mainnet.id]?.leverageRouterV2,
    'LeverageRouter not found for mainnet',
  ),
  multicallExecutor: must(
    contractAddresses[mainnet.id]?.multicallExecutor,
    'MulticallExecutor not found for mainnet',
  ),
}
