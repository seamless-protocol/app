import { type Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'
import { executeMintV2 } from '@/domain/mint/exec/execute.v2'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import { leverageManagerV2Abi } from '@/lib/contracts/abis/leverageManagerV2'
import { leverageRouterV2Abi } from '@/lib/contracts/abis/leverageRouterV2'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
} from '@/lib/contracts/generated'
import { ADDR, mode, RPC } from '../../../shared/env'
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
    withFork(async ({ account, publicClient, walletClient }) => {
      if (mode !== 'tenderly') {
        console.error('Integration requires Tenderly VNet. Configure TEST_RPC_URL.', {
          mode,
          rpc: RPC.primary,
        })
        throw new Error('TEST_RPC_URL missing or invalid for Tenderly mode')
      }

      // Log RPC and chain to ensure we are targeting the expected endpoint
      console.info('[STEP] Using public RPC', { url: RPC.primary })
      const chainId = await publicClient.getChainId()
      console.info('[STEP] Chain ID', { chainId })

      const token: Address =
        (process.env['TEST_LEVERAGE_TOKEN'] as Address) || (ADDR.leverageToken as Address)
      const manager: Address = (process.env['TEST_MANAGER'] as Address) || ADDR.manager
      const router: Address = (process.env['TEST_ROUTER'] as Address) || ADDR.router

      // Resolve assets from manager via generated actions (consistent with plan/execute)
      const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
        address: manager,
        args: [token],
      })
      const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
        address: manager,
        args: [token],
      })
      console.info('[STEP] Resolved assets', { token, manager, router, collateralAsset, debtAsset })

      // Equity input equals collateral to simplify (no input->collateral conversion leg)
      const collateralDecimals = await readErc20Decimals(config, collateralAsset)
      const equityInCollateral = parseUnits('0.5', collateralDecimals)

      // Fund account: gas + collateral tokens
      console.info('[STEP] Funding native & ERC20')
      await topUpNative(account.address, '10')
      await topUpErc20(collateralAsset, account.address, '2')
      // Log balances after top-ups (Tenderly admin RPC operations do not create txs)
      const nativeBal = await publicClient.getBalance({ address: account.address })
      const erc20Bal = (await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })) as bigint
      console.info('[STEP] Post-topup balances', {
        account: account.address,
        nativeWei: nativeBal.toString(),
        erc20: { token: collateralAsset, balance: erc20Bal.toString() },
      })

      // Build V2 plan via domain logic (uses v2 generated reads)
      console.info('[STEP] Creating LiFi quote adapter')
      const quoteDebtToCollateral = createLifiQuoteAdapter({
        chainId: base.id,
        router,
        ...(ADDR.executor ? { fromAddress: ADDR.executor } : {}),
        allowBridges: 'none',
      })
      const quoteSpy = async (args: { inToken: Address; outToken: Address; amountIn: bigint }) => {
        const res = await quoteDebtToCollateral(args)
        console.info('Quote debt->collateral', {
          inToken: args.inToken,
          outToken: args.outToken,
          amountIn: args.amountIn.toString(),
          out: res.out.toString(),
          approvalTarget: res.approvalTarget,
          calldataLen: res.calldata.length,
          calldataPrefix: res.calldata.slice(0, 10),
        })
        return res
      }
      console.info('[STEP] Building V2 plan')
      const plan = await planMintV2({
        config,
        token,
        inputAsset: collateralAsset,
        equityInInputAsset: equityInCollateral,
        slippageBps: 200,
        quoteDebtToCollateral: quoteSpy,
        managerAddress: manager,
      })
      console.info('[STEP] Plan V2', {
        minShares: plan.minShares.toString(),
        expectedTotalCollateral: plan.expectedTotalCollateral.toString(),
        expectedDebt: plan.expectedDebt.toString(),
        calls: plan.calls.length,
        firstCall: plan.calls[0]
          ? {
              target: plan.calls[0].target,
              value: plan.calls[0].value.toString(),
              dataLen: plan.calls[0].data.length,
            }
          : undefined,
        secondCall: plan.calls[1]
          ? {
              target: plan.calls[1].target,
              value: plan.calls[1].value.toString(),
              dataLen: plan.calls[1].data.length,
            }
          : undefined,
      })

      // Router preview (sanity): expected shares/debt from router POV using only user collateral
      console.info('[STEP] Router previewDeposit (sanity)')
      const routerPreview = (await publicClient.readContract({
        address: router,
        abi: leverageRouterV2Abi,
        functionName: 'previewDeposit',
        args: [token, equityInCollateral],
      })) as {
        collateral: bigint
        debt: bigint
        shares: bigint
        tokenFee: bigint
        treasuryFee: bigint
      }
      console.info('[STEP] Router.previewDeposit', {
        collateral: routerPreview.collateral.toString(),
        debt: routerPreview.debt.toString(),
        shares: routerPreview.shares.toString(),
        tokenFee: routerPreview.tokenFee.toString(),
        treasuryFee: routerPreview.treasuryFee.toString(),
      })

      // Allowance checks
      console.info('[STEP] Checking allowance BEFORE')
      const allowance = (await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account.address, router],
      })) as bigint
      console.info('[STEP] User->Router allowance BEFORE', {
        token: collateralAsset,
        owner: account.address,
        spender: router,
        allowance: allowance.toString(),
      })

      // Approvals for collateral (user input) and debt (swap leg)
      console.info('[STEP] Approving router to spend collateral', {
        token: collateralAsset,
        spender: router,
        amount: equityInCollateral.toString(),
      })
      await approveIfNeeded(collateralAsset, router, equityInCollateral)

      // Check allowance after approval
      console.info('[STEP] Checking allowance AFTER')
      const allowanceAfter = (await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account.address, router],
      })) as bigint
      console.info('[STEP] User->Router allowance AFTER', {
        token: collateralAsset,
        owner: account.address,
        spender: router,
        allowance: allowanceAfter.toString(),
      })

      // Execute via generated actions through domain executor
      try {
        console.info('[STEP] Executing deposit (simulate+write)')
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
          multicallExecutor: (ADDR.executor ||
            ('0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd' as Address)) as Address,
        })
        console.info('[STEP] Waiting for receipt', { hash })
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        console.info('[STEP] Receipt', { status: receipt.status })
        expect(receipt.status).toBe('success')
      } catch (e) {
        const msg = prettyViemError(e, [leverageRouterV2Abi, leverageManagerV2Abi, erc20Abi])
        console.error('[STEP] MintV2 failed:', msg, {
          token,
          equityInInputAsset: plan.equityInInputAsset,
          minShares: plan.minShares,
          expectedTotalCollateral: plan.expectedTotalCollateral,
          calls: plan.calls.length,
          router,
          manager,
        })
        // Attempt to send raw tx without simulation to capture Tenderly trace
        try {
          console.info('[STEP] Sending raw tx without simulate for Tenderly trace')
          const data = encodeFunctionData({
            abi: leverageRouterV2Abi,
            functionName: 'deposit',
            args: [
              token,
              plan.equityInInputAsset,
              plan.expectedDebt,
              plan.minShares,
              (ADDR.executor ||
                ('0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd' as Address)) as Address,
              plan.calls.map((c) => ({ target: c.target, value: c.value, data: c.data })),
            ],
          })
          const hash = await walletClient.sendTransaction({
            to: router,
            data,
            account,
            value: 0n,
            // Generous gas to avoid estimation; Tenderly VNet ignores pricing
            gas: 5_000_000n,
          })
          console.error('[STEP] Sent raw tx without simulate (for Tenderly trace)', { hash })
          const receipt = await publicClient.waitForTransactionReceipt({ hash })
          console.error('[STEP] Raw tx receipt', { status: receipt.status })
        } catch (sendErr) {
          console.error('[STEP] Raw send also failed', sendErr)
        }
        throw e
      }
    }))
})
