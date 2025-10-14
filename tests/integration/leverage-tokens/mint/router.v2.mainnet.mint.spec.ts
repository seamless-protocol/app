/**
 * Intent
 * - Mirror the app’s mint flow end-to-end on a Tenderly VNet using the same steps as UI:
 *   plan -> simulate -> write (single-tx deposit via Router V2).
 * - Use a deterministic on-chain swap (Uniswap V2) for fork stability.
 * - Use withFork() harness for deterministic setup, funding, and cleanup.
 *
 * Notes
 * - Swap calls execute from the MulticallExecutor; we set fromAddress accordingly for quotes.
 * - We fund the test account and approve the Router for the user equity amount.
 * - Assertions check the tx succeeds and mints a positive share balance.
 */
import type { Address } from 'viem'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { parseMintedSharesFromReceipt } from '@/features/leverage-tokens/utils/receipt'
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
    'Mint integration requires a Tenderly backend. Update test configuration to use Tenderly VNet.',
  )
}

// This spec is intended for mainnet leverage tokens.
const suite = CHAIN_ID === 1 ? describe : describe.skip

suite('Leverage Router V2 Mint (Tenderly VNet, Mainnet)', () => {
  const SLIPPAGE_BPS = 50

  it('mints shares successfully via Uniswap V2 debt->collateral swap', async () => {
    await withFork(async ({ account, publicClient, config }) => {
      // 0) Addresses (single source of truth)
      const token = ADDR.leverageToken
      const router = (ADDR.routerV2 ?? ADDR.router) as Address
      const executor = ADDR.executor as Address

      // 1) Fund + approve user inputs (match UI preconditions)
      const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
        args: [token],
      })
      const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
        args: [token],
      })
      const decimals = await readErc20Decimals(config, collateralAsset)
      const equityHuman = process.env['TEST_EQUITY_AMOUNT'] ?? '1'
      const equityInInputAsset = parseUnits(equityHuman, decimals)
      await topUpNative(account.address, '1')
      await topUpErc20(collateralAsset, account.address, '25')
      await approveIfNeeded(collateralAsset, router, equityInInputAsset)

      // 2) Build a deterministic on-chain swap quote (Uniswap V2) for fork stability
      //    LiFi is avoided in integration due to flakiness on fresh VNets.
      const defaultV2Router = getUniswapV2Router(CHAIN_ID) as Address
      const swap = { type: 'uniswapV2', router: defaultV2Router } as const
      // Ensure the Uniswap V2 pair has sane liquidity on the fork (deterministic routing)
      await seedUniswapV2PairLiquidity({
        router: swap.router,
        tokenA: collateralAsset,
        tokenB: debtAsset,
      })
      const { quote: quoteDebtToCollateral } = createDebtToCollateralQuote({
        chainId: CHAIN_ID as SupportedChainId,
        routerAddress: router,
        swap,
        slippageBps: SLIPPAGE_BPS,
        getPublicClient: (cid) => (cid === CHAIN_ID ? publicClient : undefined),
        // Align expected sender with MulticallExecutor for swap calls
        fromAddress: executor,
      })

      // 3) PLAN: size flash + swaps from manager/router previews
      const plan = await planMintV2({
        config,
        token,
        inputAsset: collateralAsset,
        equityInInputAsset,
        slippageBps: SLIPPAGE_BPS,
        quoteDebtToCollateral,
        chainId: CHAIN_ID as SupportedChainId,
      })

      // 4) SIMULATE: check deposit call on current fork state
      const { request } = await simulateLeverageRouterV2Deposit(config, {
        args: [
          token,
          plan.equityInInputAsset,
          plan.flashLoanAmount ?? plan.expectedDebt,
          plan.minShares,
          executor,
          plan.calls,
        ],
        account: account.address,
        chainId: CHAIN_ID as SupportedChainId,
      })

      // 5) WRITE: submit the transaction and assert success
      const hash = await writeLeverageRouterV2Deposit(config, request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      expect(receipt.status).toBe('success')

      // 6) Sanity: minted shares for user increased
      const userShares = await readLeverageTokenBalanceOf(config, {
        address: token,
        args: [account.address],
      })
      expect(userShares).toBeGreaterThan(0n)

      // Verify parsed receipt matches actual balance
      const parsedReceipt = parseMintedSharesFromReceipt({
        receipt,
        leverageTokenAddress: token,
        userAddress: account.address,
      })
      expect(parsedReceipt).toBe(userShares)
    })
  }, 120_000)
})
