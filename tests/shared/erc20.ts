import { readContract } from '@wagmi/core'
import type { Address } from 'viem'
import { erc20Abi } from 'viem'
import type { Config } from 'wagmi'

export async function readErc20Decimals(config: Config, token: Address): Promise<number> {
  return (await readContract(config, {
    address: token,
    abi: erc20Abi,
    functionName: 'decimals',
  })) as number
}
