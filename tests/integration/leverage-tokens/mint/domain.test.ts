import type { Address } from 'viem'
import { describe, expect, it } from 'vitest'
import { mintWithRouter, previewMint } from '@/domain/mint-with-router'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { withFork } from '../../utils'

describe('Domain: mintWithRouter Integration Test', () => {
  it('should use domain logic for mint simulation (dry run)', async () =>
    withFork(async ({ account, walletClient, publicClient, ADDR, fund }) => {
      const leverageToken: Address = ADDR.leverageToken
      const router: Address = ADDR.router
      const manager: Address = ADDR.manager

      // Fund: 10 native for gas
      await fund.native([account.address], '10')

      // Get the actual collateral asset dynamically
      const collateralAsset = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      })) as Address

      console.log('Using collateral asset:', collateralAsset)

      // Fund account with plenty of collateral tokens
      const equityAmount = 1000000000000000000n // 1 token
      await fund.erc20(collateralAsset, [account.address], '10')

      console.log('Testing domain library mint logic...')
      console.log('Account:', account.address)
      console.log('Equity amount:', equityAmount.toString())

      // Test 1: Preview mint using domain logic
      const preview = await previewMint({ publicClient }, manager, leverageToken, equityAmount)

      console.log('Preview result from domain logic:')
      console.log('  Expected shares:', preview.shares.toString())
      console.log('  Token fee:', preview.tokenFee.toString())
      console.log('  Treasury fee:', preview.treasuryFee.toString())

      expect(preview.shares).toBeGreaterThan(0n)

      // Test 2: Try the full mintWithRouter function (simulation only)
      // This should handle allowances, swap context, and all the proper logic
      console.log('Testing full mintWithRouter domain logic (simulation)...')

      const clients = { publicClient, walletClient }
      const addresses = { router, manager, token: leverageToken }
      const params = {
        equityInCollateralAsset: equityAmount,
        slippageBps: 250, // 2.5% slippage tolerance
      }

      // Use IO overrides to prevent actual transaction execution (simulation only)
      const ioOverrides = {
        writeContract: async () => {
          throw new Error('This is a simulation test - should not execute transaction')
        },
      }

      try {
        await mintWithRouter(clients, addresses, account.address, params, ioOverrides)
        // Should not reach here since writeContract will throw
        expect(false).toBe(true)
      } catch (error: any) {
        if (error.message.includes('This is a simulation test')) {
          console.log('✅ Domain logic executed successfully through simulation phase')
          console.log('✅ Allowance, swap context, and contract simulation all worked')
        } else {
          console.log('❌ Domain logic failed with error:', error.message)
          throw error
        }
      }
    }))
})
