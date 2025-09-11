import { defineConfig } from '@wagmi/cli'
import { react, actions } from '@wagmi/cli/plugins'
import { base } from 'viem/chains'
import { leverageManagerAbi } from './src/lib/contracts/abis/leverageManager'
import { leverageRouterAbi } from './src/lib/contracts/abis/leverageRouter'
import { leverageTokenAbi } from './src/lib/contracts/abis/leverageToken'
import { leverageRouterV2Abi } from './src/lib/contracts/abis/leverageRouterV2'
import { leverageTokenFactoryAbi } from './src/lib/contracts/abis/leverageTokenFactory'
import { seamTokenAbi } from './src/lib/contracts/abis/seamToken'
import { contractAddresses } from './src/lib/contracts/addresses'

export default defineConfig({
  out: 'src/lib/contracts/generated.ts',
  contracts: [
    {
      name: 'LeverageToken',
      abi: leverageTokenAbi,
    },
    {
      name: 'LeverageTokenFactory',
      abi: leverageTokenFactoryAbi,
      address: contractAddresses[base.id]?.leverageTokenFactory
        ? { [base.id]: contractAddresses[base.id]?.leverageTokenFactory! }
        : undefined,
    },
    {
      name: 'LeverageRouter',
      abi: leverageRouterAbi,
      address: contractAddresses[base.id]?.leverageRouter
        ? { [base.id]: contractAddresses[base.id]?.leverageRouter! }
        : undefined,
    },
    {
      name: 'LeverageRouterV2',
      abi: leverageRouterV2Abi,
      // V2 is an extension on the same router address (mintWithCalls)
      address: contractAddresses[base.id]?.leverageRouter
        ? { [base.id]: contractAddresses[base.id]?.leverageRouter! }
        : undefined,
    },
    {
      name: 'LeverageManager',
      abi: leverageManagerAbi,
      address: contractAddresses[base.id]?.leverageManager
        ? { [base.id]: contractAddresses[base.id]?.leverageManager! }
        : undefined,
    },
    {
      name: 'SeamToken',
      abi: seamTokenAbi,
      address: contractAddresses[base.id]?.seamlessToken
        ? { [base.id]: contractAddresses[base.id]?.seamlessToken! }
        : undefined,
    },
  ],
  plugins: [
    react({
      // Generate React hooks for read/write operations
    }),
    actions(), // Generate non-React viem actions for domain usage
  ],
})
