import { expect, test } from '@playwright/test'
import {
  ADDR,
  account,
  DEFAULT_CHAIN_ID,
  LEVERAGE_TOKEN_ADDRESS,
  LEVERAGE_TOKEN_KEY,
  LEVERAGE_TOKEN_LABEL,
  mode,
  revertSnapshot,
  TOKEN_SOURCE,
  takeSnapshot,
} from '../shared/clients'
import { topUpErc20, topUpNative } from '../shared/funding'

const ENABLE_FLOW_TESTS = process.env['E2E_ENABLE_FLOW_TESTS'] === '1'
const chainId = process.env['E2E_CHAIN_ID'] ?? String(DEFAULT_CHAIN_ID)
const tokenSource = (process.env['E2E_TOKEN_SOURCE'] ?? TOKEN_SOURCE).toLowerCase()
const tokenKey = process.env['E2E_LEVERAGE_TOKEN_KEY'] ?? LEVERAGE_TOKEN_KEY
const leverageTokenAddress = (process.env['E2E_LEVERAGE_TOKEN_ADDRESS'] ??
  LEVERAGE_TOKEN_ADDRESS) as `0x${string}`
const leverageTokenLabel = process.env['E2E_LEVERAGE_TOKEN_LABEL'] ?? LEVERAGE_TOKEN_LABEL

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

        await page.goto('/#/tokens')
        await page.waitForLoadState('networkidle')

        // Connect mock wallet if needed
        const connectButton = page.getByTestId('connect-mock')
        if (await connectButton.isVisible()) {
          await connectButton.click()
          await expect(connectButton).toBeHidden({ timeout: 5_000 })
          await expect(page.getByTestId('connected-address')).toBeVisible({ timeout: 15_000 })
        }

        await page.goto(`/#/tokens/${chainId}/${leverageTokenAddress}`)
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(
          new RegExp(`/#/tokens/${chainId}/${leverageTokenAddress}`, 'i'),
        )

        // Open the mint modal (button lives inside the holdings card when connected)
        const mintButton = page.getByRole('button', { name: /^Mint$/ })
        await expect(mintButton, 'Mint action should be visible').toBeVisible({ timeout: 15_000 })
        await mintButton.click()

        await expect(page.getByRole('heading', { name: 'Mint Leverage Token' })).toBeVisible()

        // Enter mint amount
        const amountInput = page.getByLabel('Mint Amount')
        await amountInput.fill('1')

        // Wait for the primary action button to appear and become enabled
        const primaryAction = page.getByTestId('mint-primary-action')
        await expect(primaryAction).toBeVisible({ timeout: 15_000 })
        await expect(primaryAction).toBeEnabled({ timeout: 15_000 })

        const primaryLabel = (await primaryAction.innerText()) ?? ''
        await primaryAction.click()

        // Approval step may render if allowance missing
        if (/Approve/i.test(primaryLabel)) {
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
        await expect(mintButton).toBeVisible()
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
    tokenSource,
    tokenKey,
    leverageTokenAddress,
    leverageTokenLabel,
  })
}
