
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({
  chain: base,
  transport: http('http://127.0.0.1:8545')
})

const erc20Abi = [
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const collateralAsset = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A'

const [symbol, name, decimals] = await Promise.all([
  client.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'symbol',
  }),
  client.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'name',
  }),
  client.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'decimals',
  }),
])

console.log('📋 Collateral asset details:')
console.log('  Address:', collateralAsset)
console.log('  Symbol:', symbol)
console.log('  Name:', name)
console.log('  Decimals:', decimals)

