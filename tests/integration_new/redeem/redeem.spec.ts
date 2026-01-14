import { renderHook, waitFor } from '@morpho-org/test-wagmi'
import { act } from '@testing-library/react'
import { type Address, parseEther, parseUnits } from 'viem'
import { describe, expect } from 'vitest'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem'
import { useApprovalFlow } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { useCollateralToDebtQuote } from '@/features/leverage-tokens/hooks/redeem/useCollateralToDebtQuote'
import { useRedeemExecution } from '@/features/leverage-tokens/hooks/redeem/useRedeemExecution'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { executeMintFlow } from '../helpers/mint'
import { useRedeemPlanPreviewWithSlippageRetries } from '../helpers/redeem'
import { wagmiTest } from '../setup'

describe('redeem integration tests', () => {
  const leverageTokenConfigs = getAllLeverageTokenConfigs()

  for (const leverageTokenConfig of leverageTokenConfigs) {
    wagmiTest(leverageTokenConfig.chainId)(
      `redeems ${leverageTokenConfig.symbol} shares on ${leverageTokenConfig.chainId}`,
      async ({ client, config: wagmiConfig }) => {
        const addresses = getContractAddresses(leverageTokenConfig.chainId)

        const equityInCollateralAsset = parseUnits(
          '1',
          leverageTokenConfig.collateralAsset.decimals,
        )

        await client.deal({
          erc20: leverageTokenConfig.collateralAsset.address,
          account: client.account.address,
          amount: equityInCollateralAsset,
        })
        await client.setBalance({
          address: client.account.address,
          value: parseEther('1'),
        })

        await executeMintFlow({
          client,
          wagmiConfig,
          leverageTokenConfig,
          equityInCollateralAsset,
        })

        const leverageTokenBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.address,
          args: [client.account.address],
        })
        const collateralBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.collateralAsset.address,
          args: [client.account.address],
        })
        const debtBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.debtAsset.address,
          args: [client.account.address],
        })

        // Get the function to quote the collateral to debt swap for the redeem
        const { result: useCollateralToDebtQuoteResult } = renderHook(wagmiConfig, () =>
          useCollateralToDebtQuote({
            chainId: leverageTokenConfig.chainId,
            routerAddress: addresses.leverageRouterV2 as Address,
            swap: leverageTokenConfig.swaps?.collateralToDebt as CollateralToDebtSwapConfig,
            requiresQuote: true,
          }),
        )
        await waitFor(() => expect(useCollateralToDebtQuoteResult.current.quote).toBeDefined())
        if (!useCollateralToDebtQuoteResult.current.quote) {
          throw new Error('Quote function for collateral to debt not found')
        }
        const quoteFn = useCollateralToDebtQuoteResult.current.quote

        // Preview the redeem plan with slippage retries using the quote function
        const redeemPlanPreviewResult = await useRedeemPlanPreviewWithSlippageRetries({
          wagmiConfig,
          leverageTokenConfig,
          sharesToRedeem: leverageTokenBalanceBefore,
          quoteFn,
          slippageBps: 50,
          retries: 5,
          slippageIncrementBps: 100,
        })
        const plan = redeemPlanPreviewResult.current.plan
        if (!plan) {
          throw new Error('Redeem plan not found')
        }

        // Approve the leverage token shares from the user to be spent by the leverage router
        const { result: approvalFlow } = renderHook(wagmiConfig, () =>
          useApprovalFlow({
            tokenAddress: leverageTokenConfig.address,
            spender: addresses.leverageRouterV2 as Address,
            amountRaw: plan.sharesToRedeem,
            decimals: leverageTokenConfig.collateralAsset.decimals,
            chainId: leverageTokenConfig.chainId,
            enabled: true,
          }),
        )
        expect(approvalFlow.current.isApproved).toBe(false)
        approvalFlow.current.approve()
        await waitFor(() => expect(approvalFlow.current.isApproved).toBe(true))

        // Execute the redeem using the plan
        const { result: redeemWriteResult } = renderHook(wagmiConfig, () =>
          useRedeemExecution({
            token: leverageTokenConfig.address,
            chainId: leverageTokenConfig.chainId,
            account: client.account.address,
            routerAddress: addresses.leverageRouterV2 as Address,
            swap: leverageTokenConfig.swaps?.collateralToDebt as CollateralToDebtSwapConfig,
          }),
        )
        await waitFor(() => expect(redeemWriteResult.current.redeem).toBeDefined())
        await act(async () => {
          await redeemWriteResult.current.redeem(plan)
        })

        // Check the shares redeemed by the user
        const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.address,
          args: [client.account.address],
        })
        const sharesDelta = leverageTokenBalanceBefore - sharesAfter
        expect(sharesDelta).toBe(plan.sharesToRedeem)

        // Check the collateral balance of the user
        const collateralBalanceAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.collateralAsset.address,
          args: [client.account.address],
        })
        const collateralDelta = collateralBalanceAfter - collateralBalanceBefore
        expect(collateralDelta).toBeGreaterThanOrEqual(plan.minCollateralForSender)

        // Check the debt balance of the user
        const debtBalanceAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.debtAsset.address,
          args: [client.account.address],
        })
        const debtDelta = debtBalanceAfter - debtBalanceBefore
        expect(debtDelta).toBeGreaterThanOrEqual(plan.minExcessDebt)
      },
    )
  }
})
