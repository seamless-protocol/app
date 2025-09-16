import { type Address, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateMint } from '@/domain/mint'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
} from '@/lib/contracts/generated'
import { ADDR, mode, RPC } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from '../../../shared/funding'
import { withFork } from '../../../shared/withFork'

describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 mint integration: requires Tenderly VNet via TEST_RPC_URL')
    }
  })
  afterAll(() => {})

  it('mints shares successfully (happy path)', async () =>
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
      if (ADDR.executor) process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = ADDR.executor

      // Log RPC and chain to ensure we are targeting the expected endpoint
      console.info('[STEP] Using public RPC', { url: RPC.primary })
      const chainId = base.id
      console.info('[STEP] Chain ID', { chainId })

      const token: Address = ((process.env['TEST_LEVERAGE_TOKEN'] as Address) ||
        ADDR.leverageToken) as Address
      const manager: Address = ((process.env['TEST_MANAGER'] as Address) || ADDR.manager) as Address
      const router: Address = ((process.env['TEST_ROUTER'] as Address) || ADDR.router) as Address

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

      // Fund user with collateral and native gas; approve router to pull collateral
      const decimals = await readErc20Decimals(config, collateralAsset)
      const equityInInputAsset = parseUnits('10', decimals) // 10 units of collateral
      console.info('[STEP] Funding + approving collateral', {
        collateralAsset,
        equityInInputAsset: equityInInputAsset.toString(),
      })
      await topUpNative(account.address, '1')
      await topUpErc20(collateralAsset, account.address, '25') // cushion above equity
      await approveIfNeeded(collateralAsset, router, equityInInputAsset)

      // Create LiFi adapter for debt->collateral swap quotes
      console.info('[STEP] Creating LiFi quote adapter', {
        chainId,
        router,
        fromAddress: ADDR.executor,
        allowBridges: 'none',
      })
      const quoteDebtToCollateral = createLifiQuoteAdapter({
        chainId,
        router,
        fromAddress: ADDR.executor,
        allowBridges: 'none',
      })

      // Orchestrate V2 mint (simulate+write)
      console.info('[STEP] Orchestrating V2 mint (simulate+write)')
      const res = await orchestrateMint({
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
      expect(res.routerVersion).toBe('v2')
      expect(/^0x[0-9a-fA-F]{64}$/.test(res.hash)).toBe(true)
      if (res.routerVersion === 'v2') {
        console.info('[PLAN]', {
          minShares: res.plan.minShares.toString(),
          expectedShares: res.plan.expectedShares.toString(),
          expectedDebt: res.plan.expectedDebt.toString(),
          expectedTotalCollateral: res.plan.expectedTotalCollateral.toString(),
          calls: res.plan.calls.length,
        })
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: res.hash })
      expect(receipt.status).toBe('success')
    }))
})
