import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'
import { leverageManagerAbi } from '../../src/lib/contracts/abis/leverageManager'
import { TEST_CONSTANTS, calculateMintParams } from './constants'
import {
  BASE_TOKEN_ADDRESSES,
  setupWhaleAccount,
  getLeverageTokenData,
  approveRouter,
  previewMint,
  executeRouterMint,
  getTokenBalance,
  getTokenAllowance,
} from './helpers'
import { withFork } from './utils'

describe('Router Mint Integration', () => {
  it('should preview mint correctly', async () =>
    withFork(async ({ account, publicClient, ADDR }) => {
      // No need to fund - test account should already have ETH for gas calls

      const preview = await publicClient.readContract({
        address: ADDR.manager,
        abi: leverageManagerAbi,
        functionName: 'previewMint',
        args: [ADDR.leverageToken, TEST_CONSTANTS.AMOUNTS.EQUITY],
      })

      expect(preview.shares).toBeGreaterThan(0n)
      expect(preview.tokenFee).toBeGreaterThanOrEqual(0n)
      expect(preview.treasuryFee).toBeGreaterThanOrEqual(0n)
    }))

  it('should verify collateral asset is weETH', async () =>
    withFork(async ({ publicClient, ADDR }) => {
      const collateralAsset = await publicClient.readContract({
        address: ADDR.manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [ADDR.leverageToken],
      })

      expect(collateralAsset.toLowerCase()).toBe(BASE_TOKEN_ADDRESSES.weETH.toLowerCase())
    }))

  it('should execute Router.mint with V1 pattern', async () =>
    withFork(async ({ publicClient, ADDR }) => {
      // Setup whale account with weETH balance (includes ETH funding)
      const account = await setupWhaleAccount()

      // Get leverage token data
      const { collateralAsset, debtAsset } = await getLeverageTokenData(
        ADDR.leverageToken,
        ADDR.manager
      )

      // Verify we have sufficient weETH balance
      const balance = await getTokenBalance(collateralAsset, account.address)
      expect(balance).toBeGreaterThan(TEST_CONSTANTS.AMOUNTS.EQUITY)

      // V1 PATTERN: Calculate swap cost and amountAfterSwapCost first
      const { amountAfterSwapCost, maxSwapCost } = calculateMintParams(TEST_CONSTANTS.AMOUNTS.EQUITY)
      // Preview mint with the reduced amount (after swap cost) to get correct minShares
      const { minShares } = await previewMint(ADDR.manager, ADDR.leverageToken, amountAfterSwapCost)

      // Approve Router to spend collateral (V1 pattern - single approval)
      await approveRouter(collateralAsset, ADDR.router, account)

      // Execute Router.mint with V1 pattern - should succeed and return receipt
      const { hash, receipt } = await executeRouterMint(
        ADDR.router,
        ADDR.leverageToken,
        amountAfterSwapCost, // V1 pattern: use amountAfterSwapCost
        minShares,
        maxSwapCost,
        account
      )
      
      // Verify transaction succeeded
      expect(receipt.status).toBe('success')
      expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      
      console.log('✅ Router.mint executed successfully:', hash)
    }))

  it('should check initial allowance is zero', async () =>
    withFork(async ({ account, publicClient, ADDR }) => {
      const { collateralAsset } = await getLeverageTokenData(ADDR.leverageToken, ADDR.manager)

      const allowance = await getTokenAllowance(collateralAsset, account.address, ADDR.router)

      expect(allowance).toBe(0n)
    }))
})