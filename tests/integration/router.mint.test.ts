import { describe, it, expect } from 'vitest'
import { type Address, erc20Abi, maxUint256 } from 'viem'
import { withFork } from './utils'
import { leverageManagerAbi } from '../../src/lib/contracts/abis/leverageManager'
import { leverageRouterAbi } from '../../src/lib/contracts/abis/leverageRouter'
import { makeNoopSwapContext } from '../../src/features/leverage-tokens/utils/swapContext'

describe('Router-Based Minting (Tenderly VNet / viem)', () => {
  it('previewMint and check collateral asset', async () =>
    withFork(async ({ account, publicClient, ADDR, fund }) => {
      const leverageToken: Address = ADDR.leverageToken
      const manager: Address = ADDR.manager

      // Fund: 1 native for gas
      await fund.native([account.address], '1')

      // Get collateral asset for this leverage token
      const collateralAsset = await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      }) as Address

      console.log('Collateral asset:', collateralAsset)
      expect(collateralAsset).toMatch(/^0x[a-fA-F0-9]{40}$/)

      // Preview mint with 1 unit of collateral
      const equityInCollateralAsset = 1000000000000000000n // 1 token in wei
      const preview = await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'previewMint',
        args: [leverageToken, equityInCollateralAsset],
      })

      console.log('Preview result:')
      console.log('  Expected shares:', preview.shares.toString())
      console.log('  Token fee:', preview.tokenFee.toString()) 
      console.log('  Treasury fee:', preview.treasuryFee.toString())

      // Should return positive shares
      expect(preview.shares).toBeGreaterThan(0n)
    }))

  it('Router.mint with noop SwapContext (expect revert)', async () =>
    withFork(async ({ account, walletClient, publicClient, ADDR, fund }) => {
      const leverageToken: Address = ADDR.leverageToken
      const router: Address = ADDR.router
      const manager: Address = ADDR.manager
      
      // Fund: 10 native for gas
      await fund.native([account.address], '10')

      // Get collateral asset
      const collateralAsset = await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      }) as Address

      console.log('Using collateral asset:', collateralAsset)

      // Fund account with collateral tokens (simulate)
      const equityAmount = 1000000000000000000n // 1 token
      await fund.erc20(collateralAsset, [account.address], '1')

      // Approve Router for collateral
      const { request: approveRequest } = await publicClient.simulateContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'approve',
        args: [router, maxUint256],
        account,
      })
      const approveHash = await walletClient.writeContract(approveRequest)
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // Preview mint to calculate minShares
      const preview = await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'previewMint',
        args: [leverageToken, equityAmount],
      })
      const minShares = preview.shares // No slippage for test

      // Create noop SwapContext (this should cause revert)
      const noopContext = makeNoopSwapContext()
      const maxSwapCost = (equityAmount * 500n) / 10000n // 5%

      console.log('Attempting Router.mint with noop SwapContext...')

      // This should revert due to invalid SwapContext
      await expect(
        publicClient.simulateContract({
          address: router,
          abi: leverageRouterAbi,
          functionName: 'mint',
          args: [leverageToken, equityAmount, minShares, maxSwapCost, noopContext] as any,
          account,
        })
      ).rejects.toThrow()

      console.log('✅ Router correctly rejected noop SwapContext')
    }))

  it('Router allowance check', async () =>
    withFork(async ({ account, publicClient, ADDR }) => {
      const manager: Address = ADDR.manager
      const router: Address = ADDR.router
      const leverageToken: Address = ADDR.leverageToken

      // Get collateral asset
      const collateralAsset = await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      }) as Address

      // Check initial allowance (should be 0)
      const initialAllowance = await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account.address, router],
      })

      console.log('Initial allowance:', initialAllowance.toString())
      expect(initialAllowance).toBe(0n)

      // This test shows the approval flow is properly set up
      // In a real flow, user would approve Router before minting
    }))

  // TODO: Add test with proper SwapContext once we have DEX configuration
  // This test would use makeSingleHopV2Context() with real DEX addresses
  // and should succeed once SwapContext configuration is properly set up
})