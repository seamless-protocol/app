/**
 * Intent
 * - Mirror the mainnet mint test structure, but test full mint + redeem flow.
 * - Use deterministic Uniswap V2 for both mint (debt->collateral) and redeem (collateral->debt) swaps.
 * - Use withFork() harness for snapshot/revert isolation.
 *
 * Flow:
 * 1. Mint shares using Router V2 (same as mint test)
 * 2. Redeem all shares back to collateral using Router V2
 * 3. Assert user receives collateral payout
 */
import { readContract } from '@wagmi/core'
import type { Address } from 'viem'
import { erc20Abi, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { orchestrateRedeem } from '@/domain/redeem'
import { createCollateralToDebtQuote } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { getUniswapV2Router } from '@/lib/config/uniswapV2'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID, mode } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import {
  approveIfNeeded,
  seedUniswapV2PairLiquidity,
  topUpErc20,
  topUpNative,
} from '../../../shared/funding'
import { withFork } from '../../../shared/withFork'

if (mode !== 'tenderly') {
  throw new Error(
    'Redeem integration requires a Tenderly backend. Update test configuration to use Tenderly VNet.',
  )
}

// This spec is intended for mainnet leverage tokens.
const suite = CHAIN_ID === mainnet.id ? describe : describe.skip

suite('Leverage Router V2 Redeem (Tenderly VNet, Mainnet)', () => {
  const SLIPPAGE_BPS = 50

  it('redeems all minted shares into collateral via Uniswap V2', async () => {
    await withFork(async ({ account, publicClient, config }) => {
      // 0) Addresses (single source of truth)
      const token = ADDR.leverageToken
      const router = (ADDR.routerV2 ?? ADDR.router) as Address
      const executor = ADDR.executor as Address

      // 1) Get token assets
      const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
        args: [token],
      })
      const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
        args: [token],
      })
      const decimals = await readErc20Decimals(config, collateralAsset)

      // 2) Seed Uniswap V2 liquidity for deterministic swaps
      const defaultV2Router = getUniswapV2Router(mainnet.id) as Address
      const swap = { type: 'uniswapV2', router: defaultV2Router } as const
      await seedUniswapV2PairLiquidity({
        router: swap.router,
        tokenA: collateralAsset,
        tokenB: debtAsset,
      })

      // ============ MINT PHASE ============
      // 3) Fund + approve for mint
      const equityHuman = process.env['TEST_EQUITY_AMOUNT'] ?? '1'
      const equityInInputAsset = parseUnits(equityHuman, decimals)
      await topUpNative(account.address, '1')
      await topUpErc20(collateralAsset, account.address, '25')
      await approveIfNeeded(collateralAsset, router, equityInInputAsset)

      // 4) Plan mint with Uniswap V2 debt->collateral quote
      const { quote: quoteDebtToCollateral } = createDebtToCollateralQuote({
        chainId: CHAIN_ID as SupportedChainId,
        routerAddress: router,
        swap,
        slippageBps: SLIPPAGE_BPS,
        getPublicClient: (cid) => (cid === CHAIN_ID ? publicClient : undefined),
        fromAddress: executor,
      })

      const mintPlan = await planMintV2({
        config,
        token,
        inputAsset: collateralAsset,
        equityInInputAsset,
        slippageBps: SLIPPAGE_BPS,
        quoteDebtToCollateral,
        chainId: CHAIN_ID as SupportedChainId,
      })

      // 5) Execute mint
      const { request: mintRequest } = await simulateLeverageRouterV2Deposit(config, {
        args: [
          token,
          mintPlan.equityInInputAsset,
          mintPlan.flashLoanAmount ?? mintPlan.expectedDebt,
          mintPlan.minShares,
          executor,
          mintPlan.calls,
        ],
        account: account.address,
        chainId: CHAIN_ID as SupportedChainId,
      })

      const mintHash = await writeLeverageRouterV2Deposit(config, mintRequest)
      const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash })
      expect(mintReceipt.status).toBe('success')

      // 6) Verify minted shares
      const userShares = await readLeverageTokenBalanceOf(config, {
        address: token,
        args: [account.address],
      })
      expect(userShares).toBeGreaterThan(0n)

      // ============ REDEEM PHASE ============
      // 7) Approve router to spend shares
      await approveIfNeeded(token, router, userShares)

      // 8) Create Uniswap V2 collateral->debt quote
      const { quote: quoteCollateralToDebt } = createCollateralToDebtQuote({
        chainId: CHAIN_ID as SupportedChainId,
        routerAddress: router,
        swap,
        slippageBps: SLIPPAGE_BPS,
        getPublicClient: (cid) => (cid === CHAIN_ID ? publicClient : undefined),
      })

      // 9) Execute redeem
      const collateralBefore = (await readContract(config, {
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })) as bigint

      const redeemTx = await orchestrateRedeem({
        config,
        account: account.address,
        token,
        sharesToRedeem: userShares,
        slippageBps: SLIPPAGE_BPS,
        quoteCollateralToDebt,
        chainId: CHAIN_ID as SupportedChainId,
        // Redeem to collateral (not debt)
        outputAsset: collateralAsset,
      })

      const redeemReceipt = await publicClient.waitForTransactionReceipt({ hash: redeemTx.hash })
      expect(redeemReceipt.status).toBe('success')

      // 10) Verify user received collateral payout
      const collateralAfter = (await readContract(config, {
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })) as bigint
      const collateralDelta = collateralAfter - collateralBefore
      expect(collateralDelta).toBeGreaterThan(0n)

      // 11) Verify shares were burned
      const sharesAfterRedeem = await readLeverageTokenBalanceOf(config, {
        address: token,
        args: [account.address],
      })
      expect(sharesAfterRedeem).toBe(0n)
    })
  }, 180_000)
})
