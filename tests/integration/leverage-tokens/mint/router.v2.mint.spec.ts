import { type Address, erc20Abi, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'
import { executeMintV2 } from '@/domain/mint/execute.v2'
import { planMintV2 } from '@/domain/mint/plan.v2'
import { leverageManagerV2Abi } from '@/lib/contracts/abis/leverageManagerV2'
import { leverageRouterV2Abi } from '@/lib/contracts/abis/leverageRouterV2'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
} from '@/lib/contracts/generated'
import { ADDR, mode } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from '../../../shared/funding'
// Use shared Wagmi config (wired to TEST_RPC_URL / VNet)
import { wagmiConfig as config } from '../../../shared/wagmi'
import { withFork } from '../../../shared/withFork'
import { prettyViemError } from '../../../utils/decodeError'

// Adapter returns { out, approvalTarget, calldata }

// Note: LiFi quoting handled via createLifiQuoteAdapter

describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 mint integration: requires Tenderly VNet via TEST_RPC_URL')
    }
  })
  afterAll(() => {})

  it('mints shares successfully (happy path)', async () =>
    withFork(async ({ account, publicClient }) => {
      if (mode !== 'tenderly') return

      const token: Address =
        (process.env['TEST_LEVERAGE_TOKEN'] as Address) || (ADDR.leverageToken as Address)
      const manager: Address = (process.env['TEST_MANAGER'] as Address) || ADDR.manager
      const router: Address = (process.env['TEST_ROUTER'] as Address) || ADDR.router

      // Resolve assets from manager via generated actions (consistent with plan/execute)
      const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
        address: manager,
        args: [token],
      })
      await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
        address: manager,
        args: [token],
      })

      // Equity input equals collateral to simplify (no input->collateral conversion leg)
      const collateralDecimals = await readErc20Decimals(config, collateralAsset)
      const equityInCollateral = parseUnits('0.5', collateralDecimals)

      // Fund account: gas + collateral tokens
      await topUpNative(account.address, '10')
      await topUpErc20(collateralAsset, account.address, '2')

      // Build V2 plan via domain logic (uses v2 generated reads)
      const quoteDebtToCollateral = createLifiQuoteAdapter({
        chainId: base.id,
        router,
        allowBridges: 'none',
      })
      const plan = await planMintV2({
        config,
        token,
        inputAsset: collateralAsset,
        equityInInputAsset: equityInCollateral,
        slippageBps: 200,
        quoteDebtToCollateral,
        managerAddress: manager,
      })

      // Approvals for collateral (user input) and debt (swap leg)
      await approveIfNeeded(collateralAsset, router, equityInCollateral)

      // Execute via generated actions through domain executor
      try {
        const { hash } = await executeMintV2({
          config,
          token,
          account: account.address as Address,
          plan: {
            inputAsset: plan.inputAsset,
            equityInInputAsset: plan.equityInInputAsset,
            minShares: plan.minShares,
            calls: plan.calls,
            expectedTotalCollateral: plan.expectedTotalCollateral,
            expectedDebt: plan.expectedDebt,
          },
          routerAddress: router,
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        expect(receipt.status).toBe('success')
      } catch (e) {
        const msg = prettyViemError(e, [leverageRouterV2Abi, leverageManagerV2Abi, erc20Abi])
        console.error('MintV2 failed:', msg, {
          token,
          equityInInputAsset: plan.equityInInputAsset,
          minShares: plan.minShares,
          expectedTotalCollateral: plan.expectedTotalCollateral,
          calls: plan.calls.length,
          router,
          manager,
        })
        throw e
      }
    }))
})
