import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { base } from 'viem/chains'
import { leverageTokenAbi } from './src/lib/contracts/abis/leverageToken'
import { leverageTokenFactoryAbi } from './src/lib/contracts/abis/leverageTokenFactory'
import { seamTokenAbi } from './src/lib/contracts/abis/seamToken'

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
      address: {
        [base.id]: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57',
      },
    },
    {
      name: 'SeamToken',
      abi: seamTokenAbi,
      address: {
        [base.id]: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85',
      },
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