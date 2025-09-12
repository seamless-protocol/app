import { type Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'
import { BPS_DENOMINATOR, DEFAULT_MAX_SWAP_COST_BPS } from '@/domain/mint/constants'
import { applySlippageFloor } from '@/domain/mint/math'
import { leverageManagerAbi, leverageRouterV2Abi } from '@/lib/contracts'
import { ADDR, mode } from '../../../shared/env'
import { approveIfNeeded } from '../../../shared/funding'
import { withFork } from '../../../shared/withFork'

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
      if (mode !== 'tenderly') return

      const token: Address =
        (process.env['TEST_LEVERAGE_TOKEN'] as Address) || (ADDR.leverageToken as Address)
      const manager: Address = (process.env['TEST_MANAGER'] as Address) || ADDR.manager
      const router: Address = (process.env['TEST_ROUTER'] as Address) || ADDR.router

      // Resolve assets from manager
      const [collateralAsset, debtAsset] = (await Promise.all([
        publicClient.readContract({
          address: manager,
          abi: leverageManagerAbi,
          functionName: 'getLeverageTokenCollateralAsset',
          args: [token],
        }),
        publicClient.readContract({
          address: manager,
          abi: leverageManagerAbi,
          functionName: 'getLeverageTokenDebtAsset',
          args: [token],
        }),
      ])) as [Address, Address]

      // Equity input equals collateral to simplify (no input->collateral conversion leg)
      const collateralDecimals = (await publicClient.readContract({
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'decimals',
      })) as number
      const equityInCollateral = parseUnits('0.5', collateralDecimals)

      // Fund account: gas + collateral tokens
      // Note: use direct calls to funding helpers to avoid circular import in withFork context
      const { topUpNative, topUpErc20 } = await import('../../../shared/funding')
      await topUpNative(account.address, '10')
      await topUpErc20(collateralAsset, account.address, '2')

      // First preview: how much collateral/debt manager expects with user equity only
      const preview1 = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'previewMint',
        args: [token, equityInCollateral],
      })) as {
        collateral: bigint
        debt: bigint
        equity: bigint
        shares: bigint
        tokenFee: bigint
        treasuryFee: bigint
      }

      // Plan debt swap to cover missing collateral via LiFi
      const neededFromDebtSwap = preview1.collateral - preview1.equity
      expect(neededFromDebtSwap).toBeGreaterThan(0n)

      // Request a quote for swapping previewed debt -> collateral using adapter
      const quoteFn = createLifiQuoteAdapter({ chainId: 8453, router })
      const debtQuote = await quoteFn({
        inToken: debtAsset,
        outToken: collateralAsset,
        amountIn: preview1.debt,
      })

      // If quote insufficient, re-quote with scaled amount
      let debtIn = preview1.debt
      if (debtQuote.out < neededFromDebtSwap) {
        // scale proportionally (floor)
        debtIn = (debtIn * neededFromDebtSwap) / (debtQuote.out === 0n ? 1n : debtQuote.out)
      }
      const debtQuote2 =
        debtQuote.out >= neededFromDebtSwap
          ? debtQuote
          : await quoteFn({ inToken: debtAsset, outToken: collateralAsset, amountIn: debtIn })

      const totalCollateral = equityInCollateral + debtQuote2.out
      const preview2 = (await publicClient.readContract({
        address: manager,
        abi: leverageManagerAbi,
        functionName: 'previewMint',
        args: [token, totalCollateral],
      })) as {
        collateral: bigint
        debt: bigint
        equity: bigint
        shares: bigint
        tokenFee: bigint
        treasuryFee: bigint
      }
      expect(preview2.debt).toBeGreaterThanOrEqual(debtIn)

      const minShares = applySlippageFloor(preview2.shares, 50)
      const maxSwapCost =
        (totalCollateral * BigInt(DEFAULT_MAX_SWAP_COST_BPS)) / BigInt(BPS_DENOMINATOR)

      // Approvals for collateral (user input) and debt (swap leg)
      await approveIfNeeded(collateralAsset, router, equityInCollateral)

      // Build calls array for router V2
      const calls = [
        // router-level approval for debt token -> DEX spender
        {
          target: debtAsset,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [debtQuote2.approvalTarget, debtIn],
          }),
          value: 0n,
        },
        // perform the swap via LiFi-provided calldata
        {
          target: debtQuote2.approvalTarget,
          data: debtQuote2.calldata,
          value: 0n,
        },
      ] as Array<{ target: Address; data: `0x${string}`; value: bigint }>

      const hash = await walletClient.writeContract({
        address: router,
        abi: leverageRouterV2Abi,
        functionName: 'mintWithCalls',
        args: [token, equityInCollateral, minShares, maxSwapCost, calls],
        account: account,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      expect(receipt.status).toBe('success')
    }))
})
