import { type Address, type PublicClient, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateRedeem } from '@/domain/redeem'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'
import { createUniswapV2QuoteAdapter } from '@/domain/shared/adapters/uniswapV2'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, mode, RPC } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from '../../../shared/funding'
import { withFork } from '../../../shared/withFork'

describe('Leverage Router V2 Redeem (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 redeem integration: requires Tenderly VNet via TEST_RPC_URL')
    }
  })
  afterAll(() => {})

  // NOTE: This test currently fails due to quote function limitations:
  // - UniswapV2 has poor liquidity for collateral->debt direction
  // - LiFi has different execution issues
  // - The core V2 redeem functionality is working, but quote functions need better DEX integration

  it('redeems shares successfully (happy path) - NOTE: Currently fails due to quote function limitations', async () =>
    withFork(async ({ account, publicClient, config }) => {
      if (mode !== 'tenderly') {
        console.error('Integration requires Tenderly VNet. Configure TEST_RPC_URL.', {
          mode,
          rpc: RPC.primary,
        })
        throw new Error('TEST_RPC_URL missing or invalid for Tenderly mode')
      }

      // Force router version to V2 for this test and provide executor address
      process.env['VITE_ROUTER_VERSION'] = 'v2'
      const executor = ADDR.executor
      if (!executor) {
        throw new Error('Multicall executor address missing; update contract map for V2 harness')
      }
      process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

      // Log RPC and chain to ensure we are targeting the expected endpoint
      const token: Address = ADDR.leverageToken
      const manager: Address = (ADDR.managerV2 ?? ADDR.manager) as Address
      const router: Address = (ADDR.routerV2 ?? ADDR.router) as Address

      const tokenConfig = getLeverageTokenConfig(token)
      if (!tokenConfig) {
        throw new Error(`Leverage token config not found for ${token}`)
      }

      console.info('[STEP] Using public RPC', { url: RPC.primary })
      const chainId = tokenConfig.chainId
      console.info('[STEP] Chain ID', { chainId })

      // Discover token assets
      const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
        address: manager,
        args: [token],
      })
      const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
        address: manager,
        args: [token],
      })
      console.info('[STEP] Token assets', { collateralAsset, debtAsset })

      // First, we need to mint some leverage tokens to redeem
      // Fund user with collateral and native gas; approve router to pull collateral
      const decimals = await readErc20Decimals(config, collateralAsset)
      const equityInInputAsset = parseUnits('10', decimals) // 10 units of collateral
      console.info('[STEP] Funding + approving collateral for mint', {
        collateralAsset,
        equityInInputAsset: equityInInputAsset.toString(),
      })
      await topUpNative(account.address, '1')
      await topUpErc20(collateralAsset, account.address, '25') // cushion above equity
      await approveIfNeeded(collateralAsset, router, equityInInputAsset)

      // Create quote function for mint
             // Use UniswapV2 for mint (we know it works) and LiFi for redeem
             const useLiFiForMint = false // Force UniswapV2 for mint
             const useLiFiForRedeem = process.env['TEST_USE_LIFI'] === '1'
             
             const quoteDebtToCollateral = (() => {
               const uniswapRouter =
                 (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
                 ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)
               console.info('[STEP] Creating Uniswap V2 quote adapter for mint', {
                 chainId,
                 router,
                 uniswapRouter,
               })
               return createUniswapV2QuoteAdapter({
                 publicClient: publicClient as unknown as Pick<
                   PublicClient,
                   'readContract' | 'getBlock'
                 >,
                 router: uniswapRouter,
                 recipient: router,
                 wrappedNative: ADDR.weth,
               })
             })()

      // Mint some leverage tokens first
      console.info('[STEP] Minting leverage tokens')
      const { orchestrateMint } = await import('@/domain/mint')
      const mintRes = await orchestrateMint({
        config,
        account: account.address as Address,
        token,
        inputAsset: collateralAsset,
        equityInInputAsset,
        slippageBps: 50,
        quoteDebtToCollateral,
        routerAddressV2: router,
        managerAddressV2: manager,
      })
      
      const mintReceipt = await publicClient.waitForTransactionReceipt({
        hash: mintRes.hash,
      })
      expect(mintReceipt.status).toBe('success')

      const sharesAfterMint = await readLeverageTokenBalanceOf(config, {
        address: token,
        args: [account.address as Address],
      })
      console.info('[STEP] Minted shares', { sharesAfterMint: sharesAfterMint.toString() })

      // Now redeem half of the minted shares
      const sharesToRedeem = sharesAfterMint / 2n
      console.info('[STEP] Redeeming shares', { sharesToRedeem: sharesToRedeem.toString() })

      // Create quote function for redeem (collateral to debt)
             const quoteCollateralToDebt = useLiFiForRedeem
               ? (() => {
                   console.info('[STEP] Creating LiFi quote adapter for redeem', {
                     chainId,
                     router,
                     fromAddress: ADDR.executor,
                     allowBridges: 'none',
                   })
                   return createLifiQuoteAdapter({
                     chainId,
                     router,
                     fromAddress: executor,
                     allowBridges: 'none',
                   })
                 })()
               : (() => {
                   const uniswapRouter =
                     (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
                     ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)
                   console.info('[STEP] Creating Uniswap V2 quote adapter for redeem', {
                     chainId,
                     router,
                     uniswapRouter,
                   })
                   return createUniswapV2QuoteAdapter({
                     publicClient: publicClient as unknown as Pick<
                       PublicClient,
                       'readContract' | 'getBlock'
                     >,
                     router: uniswapRouter,
                     recipient: router,
                     wrappedNative: ADDR.weth,
                   })
                 })()

      const sharesBeforeRedeem = await readLeverageTokenBalanceOf(config, {
        address: token,
        args: [account.address as Address],
      })

      // Orchestrate V2 redeem (simulate+write)
      console.info('[STEP] Orchestrating V2 redeem (simulate+write)')
      const res = await orchestrateRedeem({
        config,
        account: account.address as Address,
        token,
        sharesToRedeem,
        slippageBps: 50,
        quoteCollateralToDebt,
        routerAddressV2: router,
        managerAddressV2: manager,
      })
      expect(res.routerVersion).toBe('v2')
      expect(/^0x[0-9a-fA-F]{64}$/.test(res.hash)).toBe(true)
      if (res.routerVersion === 'v2') {
        console.info('[PLAN]', {
          minCollateral: res.plan.minCollateral.toString(),
          expectedCollateral: res.plan.expectedCollateral.toString(),
          expectedDebt: res.plan.expectedDebt.toString(),
          calls: res.plan.calls.length,
        })
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: res.hash,
      })
      expect(receipt.status).toBe('success')

      const sharesAfterRedeem = await readLeverageTokenBalanceOf(config, {
        address: token,
        args: [account.address],
      })
      const redeemedShares = sharesBeforeRedeem - sharesAfterRedeem
      expect(redeemedShares > 0n).toBe(true)
      expect(redeemedShares).toBe(sharesToRedeem)
      if (res.routerVersion === 'v2') {
        expect(redeemedShares >= res.plan.minShares).toBe(true)
        expect(redeemedShares).toBe(res.plan.expectedShares)
      }
    }))
})
