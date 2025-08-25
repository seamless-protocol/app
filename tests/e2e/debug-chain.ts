import { createPublicClient, http } from 'viem'

// Check what chain ID Anvil is returning
const anvilClient = createPublicClient({
  transport: http('http://127.0.0.1:8545'),
})

async function checkChain() {
  try {
    const chainId = await anvilClient.getChainId()
    console.log('Anvil Chain ID:', chainId)

    const blockNumber = await anvilClient.getBlockNumber()
    console.log('Block number:', blockNumber)
  } catch (error) {
    console.log('❌ Error connecting to Anvil:', error.message)
  }
}

checkChain().catch(console.error)
