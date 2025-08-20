import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { base } from 'viem/chains'
import { leverageTokenAbi } from './src/lib/contracts/abis/leverageToken'
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
      address: contractAddresses[base.id].leverageTokenFactory
        ? { [base.id]: contractAddresses[base.id].leverageTokenFactory }
        : undefined,
    },
    {
      name: 'SeamToken',
      abi: seamTokenAbi,
      address: contractAddresses[base.id].seamlessToken
        ? { [base.id]: contractAddresses[base.id].seamlessToken }
        : undefined,
    },
  ],
  plugins: [
    react({
      // Generate React hooks for read/write operations
      useContractRead: true,
      useContractWrite: true,
      useContractEvent: true,
      usePrepareContractWrite: true,
      useContractReads: true,
    }),
  ],
})
