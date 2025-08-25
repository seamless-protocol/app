import { getContractAddresses } from './src/lib/contracts/addresses.ts'

console.log('Testing contract addresses...')
console.log('Chain ID: 8453 (Base)')
console.log('Contract addresses:', getContractAddresses(8453))
console.log('leverageRouter:', getContractAddresses(8453).leverageRouter)
console.log('leverageManager:', getContractAddresses(8453).leverageManager)
