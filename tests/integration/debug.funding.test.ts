import { type Address, erc20Abi } from 'viem'
import { describe, expect, it } from 'vitest'
import { leverageManagerAbi } from '../../src/lib/contracts/abis/leverageManager'
import { withFork } from './utils'

describe('Debug: Funding and Balance Check', () => {
  it('should fund account with weETH and verify balance', async () =>
    withFork(async ({ account, publicClient, ADDR, fund }) => {
      const leverageToken: Address = ADDR.leverageToken
      const manager: Address = ADDR.manager

      // Fund: 1 native for gas
      await fund.native([account.address], '1')

      // Get collateral asset for this leverage token
      const collateralAsset = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      })) as Address

      console.log('Account:', account.address)
      console.log('Collateral asset:', collateralAsset)

      // Check initial balance
      const initialBalance = await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })

      console.log('Initial balance:', initialBalance.toString())

      // Fund account with 5 tokens
      await fund.erc20(collateralAsset, [account.address], '5')

      // Check balance after funding
      const afterFundingBalance = await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })

      console.log('Balance after funding 5 tokens:', afterFundingBalance.toString())
      console.log('Expected ~5 tokens (5e18):', '5000000000000000000')

      // Should have > 0 balance
      expect(afterFundingBalance).toBeGreaterThan(0n)
      expect(afterFundingBalance).toBeGreaterThanOrEqual(1000000000000000000n) // At least 1 token
    }))
})
