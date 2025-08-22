
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({
  chain: base,
  transport: http('http://127.0.0.1:8545')
})

const leverageManagerAbi = [
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getLeverageTokenCollateralAsset',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const token = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c'
const leverageManager = '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8'

const collateralAsset = await client.readContract({
  address: leverageManager,
  abi: leverageManagerAbi,
  functionName: 'getLeverageTokenCollateralAsset',
  args: [token],
})

console.log('🪙 Collateral asset for token', token, ':', collateralAsset)

