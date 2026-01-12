import { createWagmiTest } from '@morpho-org/test-wagmi'
import { mainnet } from 'viem/chains'
import { expect } from 'vitest'

const forkBlockNumber = 24219436n

const wagmiTest = createWagmiTest(mainnet, {
  forkUrl: process.env['VITE_ETHEREUM_RPC_URL'],
  forkBlockNumber,
})

wagmiTest(
  'anvil fork is up with expected chainId and block, reset and mine work',
  async ({ client }) => {
    expect(await client.getChainId()).toBe(mainnet.id)

    const blockNumber = await client.getBlockNumber({
      cacheTime: 0,
    })
    expect(blockNumber).toBe(forkBlockNumber + 1n)

    await client.mine({ blocks: 1 })

    const blockNumber2 = await client.getBlockNumber({
      cacheTime: 0,
    })
    expect(blockNumber2).toBe(forkBlockNumber + 2n)

    await client.reset({ blockNumber: forkBlockNumber })

    const blockNumber3 = await client.getBlockNumber({
      cacheTime: 0,
    })
    expect(blockNumber3).toBe(forkBlockNumber)
  },
)
