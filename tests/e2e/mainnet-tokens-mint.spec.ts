import { expect, test } from '@playwright/test'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'
import { topUpErc20 } from '../shared/funding'
import { MAINNET_E2E_TOKEN_CONFIGS } from './mainnet-tokens.config'

const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`

test.describe('Mainnet token mints (production config)', () => {
  let baseSnapshotId: `0x${string}`

  test.beforeAll(async () => {
    // Verify chain ID matches first token config (all should be same chain)
    const firstConfig = MAINNET_E2E_TOKEN_CONFIGS[0]
    if (!firstConfig) throw new Error('No token configs found')
    const leverageTokenDefinition = getLeverageTokenDefinition('prod', firstConfig.key)
    const chainId = await publicClient.getChainId()
    if (chainId !== leverageTokenDefinition.chainId) {
      throw new Error(
        `Chain ID mismatch: expected ${leverageTokenDefinition.chainId}, got ${chainId}`,
      )
    }

    // Fund all tokens once
    for (const tokenConfig of MAINNET_E2E_TOKEN_CONFIGS) {
      await topUpErc20(
        tokenConfig.collateralAddress,
        TEST_ACCOUNT,
        tokenConfig.fundingAmount,
        tokenConfig.richHolderAddress,
      )
    }

    // Capture snapshot with all tokens funded
    baseSnapshotId = await takeSnapshot()
  })

  test.beforeEach(async () => {
    // Revert to funded state before each test
    await revertSnapshot(baseSnapshotId)
  })

  // Generate tests for each token configuration
  for (const tokenConfig of MAINNET_E2E_TOKEN_CONFIGS) {
    test(`mints ${tokenConfig.label} via modal using production config`, async ({ page }) => {
      test.setTimeout(120_000)

      const leverageTokenDefinition = getLeverageTokenDefinition('prod', tokenConfig.key)
      const leverageTokenAddress = getLeverageTokenAddress('prod', tokenConfig.key)

      await page.goto('/#/leverage-tokens', { waitUntil: 'domcontentloaded' })

      // Connect mock wallet
      const connect = page.getByTestId('connect-mock')
      await expect(connect).toBeVisible({ timeout: 10_000 })
      await connect.click()
      await expect(connect).toBeHidden({ timeout: 10_000 })

      await page.goto(
        `/#/leverage-tokens/${leverageTokenDefinition.chainId}/${leverageTokenAddress}`,
      )

      // Wait for page to load and scroll to holdings card (use .last() due to duplicate renders)
      const holdingsCard = page.getByTestId('leverage-token-holdings-card').last()
      await expect(holdingsCard).toBeVisible({ timeout: 10_000 })
      await holdingsCard.scrollIntoViewIfNeeded()

      // Find mint button (use .last() due to duplicate renders)
      const mintButton = page.getByTestId('mint-button').last()
      await expect(mintButton).toBeVisible({ timeout: 15_000 })
      await mintButton.click()

      const modal = page.getByRole('dialog', { name: 'Mint Leverage Token' })
      await expect(modal).toBeVisible()

      const amountInput = modal.getByLabel('Mint Amount')
      await amountInput.fill(tokenConfig.mintAmount)

      // TODO: Investigate why tests require 2.5-20% slippage (higher than prod default 0.5%)
      // Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
      const advancedButton = modal.getByRole('button', { name: 'Advanced' })
      await advancedButton.click()
      const slippageInput = modal.getByPlaceholder('0.5')
      await expect(slippageInput).toBeVisible({ timeout: 5_000 })
      await slippageInput.fill(tokenConfig.slippagePercent)

      const primary = modal.getByRole('button', { name: /(Approve|Mint|Enter an amount)/i })
      await expect(primary).toBeVisible({ timeout: 20_000 })
      await expect(primary).toBeEnabled({ timeout: 20_000 })
      const label = (await primary.innerText()) ?? ''
      await primary.click()

      const confirm = page.getByRole('heading', { name: 'Confirm Mint' })
      if (/Approve/i.test(label)) {
        await expect(confirm).toBeVisible({ timeout: 20_000 })
      } else {
        await expect(confirm).toBeVisible()
      }

      // Wait for quote to stabilize and ensure "Confirm Mint" button is ready
      // (not showing "Acknowledge Updated Quote" due to quote changes)
      const confirmButton = page.getByRole('button', {
        name: /^(Confirm Mint|Acknowledge Updated Quote)$/,
      })
      await expect(confirmButton).toBeVisible({ timeout: 5_000 })

      // If quote worsened and needs re-acknowledgment, handle it
      const buttonText = await confirmButton.innerText()
      if (buttonText === 'Acknowledge Updated Quote') {
        await confirmButton.click()
        // Wait for button to change back to "Confirm Mint" after acknowledgment
        await expect(page.getByRole('button', { name: 'Confirm Mint' })).toBeVisible({
          timeout: 5_000,
        })
      }

      // Now proceed with the actual confirmation
      await page.getByRole('button', { name: 'Confirm Mint' }).click()

      await expect(page.getByRole('heading', { name: 'Mint Success!' })).toBeVisible({
        timeout: 60_000,
      })

      await page.getByRole('button', { name: 'Done' }).click()
      await expect(mintButton).toBeVisible()
    })
  }
})
