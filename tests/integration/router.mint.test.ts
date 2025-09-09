import { type Address, erc20Abi, maxUint256 } from 'viem'
import { describe, expect, it } from 'vitest'
import { createSwapContext } from '../../src/features/leverage-tokens/utils/swapContext'
import { leverageManagerAbi } from '../../src/lib/contracts/abis/leverageManager'
import { leverageRouterAbi } from '../../src/lib/contracts/abis/leverageRouter'
import { withFork } from './utils'

describe('Router-Based Minting (Anvil Base fork / viem)', () => {
  it('previewMint and check collateral asset', async () =>
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

  it('Router.mint with real SwapContext (should succeed)', async () =>
    withFork(async ({ account, walletClient, publicClient, ADDR, fund }) => {
      const leverageToken: Address = ADDR.leverageToken
      const router: Address = ADDR.router
      const manager: Address = ADDR.manager

      // Fund: 10 native for gas
      await fund.native([account.address], '10')

      // Get collateral asset
      const collateralAsset = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      })) as Address

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

      console.log('Preview result:')
      console.log('  Expected shares:', preview.shares.toString())
      console.log('  Token fee:', preview.tokenFee.toString())
      console.log('  Treasury fee:', preview.treasuryFee.toString())

      // Calculate minShares with slippage protection (2.5% slippage tolerance)
      const slippageBps = 250n // 2.5%
      const minShares = (preview.shares * (10000n - slippageBps)) / 10000n

      // Get debt asset (underlying asset for leverage exposure)
      const debtAsset = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenDebtAsset',
        args: [leverageToken],
      })) as Address

      console.log('Using debt asset (underlying):', debtAsset)

      // Create real SwapContext for collateral → debt asset swap (chain-aware)
      const swapContext = createSwapContext(
        collateralAsset, // e.g., weETH (collateral)
        debtAsset, // e.g., WETH (debt asset / underlying)
        8453, // Base chain ID - will auto-select Aerodrome V2 for Base
      )
      // Allow up to 100% of equity as swap cost in test environment
      const maxSwapCost = equityAmount

      console.log('Attempting Router.mint with real SwapContext...')

      // This should succeed with proper SwapContext
      await publicClient.simulateContract({
        address: router,
        abi: leverageRouterAbi,
        functionName: 'mint',
        args: [leverageToken, equityAmount, minShares, maxSwapCost, swapContext] as any,
        account,
      })

      console.log('✅ Router accepted real SwapContext - simulation successful')

      // Note: We don't execute the transaction in this test to avoid consuming real funds
      // The simulation success confirms the SwapContext is properly configured
    }))

  it('Router allowance check', async () =>
    withFork(async ({ account, publicClient, ADDR }) => {
      const manager: Address = ADDR.manager
      const router: Address = ADDR.router
      const leverageToken: Address = ADDR.leverageToken

      // Get collateral asset
      const collateralAsset = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [leverageToken],
      })) as Address

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
})
