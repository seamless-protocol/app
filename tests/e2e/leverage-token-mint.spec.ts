import { expect, test } from '@playwright/test'
import { ADDR, account, mode, revertSnapshot, takeSnapshot } from '../shared/clients'
import { topUpErc20, topUpNative } from '../shared/funding'

const ENABLE_FLOW_TESTS = process.env['E2E_ENABLE_FLOW_TESTS'] === '1'
const DEFAULT_CHAIN_ID = process.env['E2E_CHAIN_ID'] ?? '8453'
const TOKEN_SOURCE = process.env['E2E_TOKEN_SOURCE'] ?? 'prod'
const DEFAULT_TENDERLY_ADDRESS = '0x17533ef332083aD03417DEe7BC058D10e18b22c5'
const DEFAULT_BASE_ADDRESS = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c'
const leverageTokenAddress = (process.env['E2E_LEVERAGE_TOKEN_ADDRESS'] ??
  (TOKEN_SOURCE === 'tenderly' ? DEFAULT_TENDERLY_ADDRESS : DEFAULT_BASE_ADDRESS)) as `0x${string}`
const leverageTokenLabel =
  process.env['E2E_LEVERAGE_TOKEN_LABEL'] ??
  (TOKEN_SOURCE === 'tenderly'
    ? 'weETH / WETH 17x Leverage Token (Tenderly)'
    : 'weETH / WETH 17x Leverage Token')

// Skip suite unless explicitly enabled
if (!ENABLE_FLOW_TESTS) {
  test.describe.skip('Leverage token mint flow', () => {
    // Intentionally empty
  })
} else {
  test.describe('Leverage token mint flow', () => {
    test('mints leverage tokens through the modal', async ({ page }) => {
      test.setTimeout(120_000)

      const snapshotId = await takeSnapshot()
      try {
        // Fund the mock wallet with gas and collateral
        await topUpNative(account.address, '5')
        await topUpErc20(ADDR.weeth, account.address, '50')

        // Navigate directly to the leverage token detail route
        await page.goto(`/#/tokens/${DEFAULT_CHAIN_ID}/${leverageTokenAddress}`)
        await page.waitForLoadState('networkidle')

        // Connect mock wallet if needed
        const connectButton = page.getByTestId('connect-mock')
        if (await connectButton.isVisible()) {
          await connectButton.click()
        }
        await expect(page.getByTestId('connected-address')).toBeVisible()

        // Open the mint modal from the holdings card
        const holdingsCard = page.locator('[data-testid="leverage-token-holdings-card"]')
        await expect(holdingsCard).toBeVisible()
        await holdingsCard.getByRole('button', { name: 'Mint' }).first().click()

        await expect(page.getByRole('heading', { name: 'Mint Leverage Token' })).toBeVisible()

        // Enter mint amount
        const amountInput = page.getByLabel('Mint Amount')
        await amountInput.fill('1')

        // Wait for preview to settle and primary action to enable
        const primaryAction = page.getByRole('button', { name: /(Approve|Mint)/ })
        await expect(primaryAction).toBeEnabled({ timeout: 15_000 })

        const primaryLabel = (await primaryAction.innerText()) ?? ''
        await primaryAction.click()

        // Approval step may render if allowance missing
        if (/Approve/i.test(primaryLabel)) {
          // Wait for approval to finish and confirm step to appear
          await expect(page.getByRole('heading', { name: 'Confirm Mint' })).toBeVisible({
            timeout: 20_000,
          })
        } else {
          await expect(page.getByRole('heading', { name: 'Confirm Mint' })).toBeVisible()
        }

        // Confirm the mint
        await page.getByRole('button', { name: 'Confirm Mint' }).click()

        // Pending + success states
        await expect(page.getByRole('heading', { name: 'Processing Mint' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Mint Successful!' })).toBeVisible({
          timeout: 60_000,
        })

        // Close out the modal
        await page.getByRole('button', { name: 'Done' }).click()
        await expect(holdingsCard).toBeVisible()
      } finally {
        await revertSnapshot(snapshotId)
      }
    })
  })
}

// Provide context in logs about the selected token/back-end
if (ENABLE_FLOW_TESTS) {
  console.info('[E2E] Mint flow enabled', {
    backendMode: mode,
    tokenSource: TOKEN_SOURCE,
    leverageTokenAddress,
    leverageTokenLabel,
  })
}
