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
  simulateRouterMint,
  getTokenBalance,
  getTokenAllowance,
} from './helpers'
import { withFork } from './utils'

describe('Router Mint Integration', () => {
  it('should preview mint correctly', async () =>
    withFork(async ({ account, publicClient, ADDR, fund }) => {
      await fund.native([account.address], '1')

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

  it('should simulate Router.mint with V1 pattern', async () =>
    withFork(async ({ publicClient, ADDR, fund }) => {
      // Setup whale account with weETH balance
      const account = await setupWhaleAccount()
      await fund.native([account.address], '10')

      // Get leverage token data
      const { collateralAsset, debtAsset } = await getLeverageTokenData(
        ADDR.leverageToken,
        ADDR.manager
      )

      // Verify we have sufficient weETH balance
      const balance = await getTokenBalance(collateralAsset, account.address)
      expect(balance).toBeGreaterThan(TEST_CONSTANTS.AMOUNTS.EQUITY)

      // Calculate mint parameters using V1 pattern
      const { amountAfterSwapCost, maxSwapCost } = calculateMintParams(TEST_CONSTANTS.AMOUNTS.EQUITY)
      const { minShares } = await previewMint(ADDR.manager, ADDR.leverageToken, amountAfterSwapCost)

      // Approve Router to spend collateral (V1 pattern - single approval)
      await approveRouter(collateralAsset, ADDR.router, account)

      // Simulate Router.mint - should succeed
      await simulateRouterMint(
        ADDR.router,
        ADDR.leverageToken,
        amountAfterSwapCost,
        minShares,
        maxSwapCost,
        account
      )
    }))

  it('should check initial allowance is zero', async () =>
    withFork(async ({ account, publicClient, ADDR }) => {
      const { collateralAsset } = await getLeverageTokenData(ADDR.leverageToken, ADDR.manager)

      const allowance = await getTokenAllowance(collateralAsset, account.address, ADDR.router)

      expect(allowance).toBe(0n)
    }))
})