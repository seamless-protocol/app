import { parseEther, parseUnits } from 'viem'
import { describe, expect } from 'vitest'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { executeMintFlow } from '../helpers/mint'
import { wagmiTest } from '../setup'

describe('mint integration tests', () => {
  const leverageTokenConfigs = getAllLeverageTokenConfigs()

  for (const leverageTokenConfig of leverageTokenConfigs) {
    wagmiTest(leverageTokenConfig.chainId)(
      `mints ${leverageTokenConfig.symbol} shares on ${leverageTokenConfig.chainId}`,
      async ({ client, config: wagmiConfig }) => {
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

        const collateralBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.collateralAsset.address,
          args: [client.account.address],
        })
        const debtBalanceBefore = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.debtAsset.address,
          args: [client.account.address],
        })

        const { plan } = await executeMintFlow({
          client,
          wagmiConfig,
          leverageTokenConfig,
          equityInCollateralAsset,
        })

        // Check the shares minted to the user
        const sharesAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.address,
          args: [client.account.address],
        })
        expect(sharesAfter).toBeGreaterThanOrEqual(plan.minShares)

        // Verify the user's collateral balance decreased by the expected amount
        const collateralBalanceAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.collateralAsset.address,
          args: [client.account.address],
        })
        const collateralDelta = collateralBalanceBefore - collateralBalanceAfter
        expect(collateralDelta).toBe(equityInCollateralAsset)

        // Check the excess debt assets the user received from the mint
        const debtAfter = await readLeverageTokenBalanceOf(wagmiConfig, {
          address: leverageTokenConfig.debtAsset.address,
          args: [client.account.address],
        })
        const debtDelta = debtAfter - debtBalanceBefore
        expect(debtDelta).toBeGreaterThanOrEqual(plan.minExcessDebt)
      },
    )
  }
})
