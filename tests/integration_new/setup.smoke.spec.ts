import { mainnet } from 'viem/chains'
import { expect } from 'vitest'
import { forkBlockNumber, wagmiTest } from './setup'

wagmiTest('anvil fork is up with expected chainId and block', async ({ client }) => {
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
})
