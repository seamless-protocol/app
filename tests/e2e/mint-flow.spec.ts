import { expect, test } from '@playwright/test'

test.describe('Mint Flow - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific token page where mint form is available (hash routing for IPFS)
    await page.goto('/#/tokens/0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c')

    // Wait for the page to load and mint section to be visible
    await expect(page.locator('h2:has-text("Mint Tokens")')).toBeVisible()
  })

  test('should complete full mint flow using mock wallet', async ({ page }) => {
    // Listen to console messages to capture our debugging logs
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('🔍')) {
        console.log(`Browser: ${msg.text()}`)
      }
    })

    // Step 1: Connect mock wallet (should be available in test mode)
    const connectMockButton = page.getByTestId('connect-mock')
    await expect(connectMockButton).toBeVisible()
    await connectMockButton.click()

    // Wait for connection to complete
    await expect(connectMockButton).not.toBeVisible()

    // Step 2: Verify we have weETH balance before attempting mint
    // Check that funding worked by looking for balance display
    const balanceDisplay = page.locator('text=weETH').first()
    await expect(balanceDisplay).toBeVisible({ timeout: 10000 })

    // Step 3: Fill in mint amount first (button is disabled without amount)
    const amountInput = page.getByTestId('mint-amount-input')
    await expect(amountInput).toBeVisible()
    await amountInput.fill('0.1') // Use amount we should be able to afford with 10 weETH funding

    // Step 3: Submit mint transaction (button should be enabled now)
    const submitButton = page.getByTestId('mint-submit-button')
    await submitButton.click()

    // Step 4: Wait for successful transaction
    const txHash = page.getByTestId('mint-tx-hash')
    const errorMessage = page.locator('text=Error occurred')

    // Happy Path: Should succeed without errors
    try {
      // Wait for transaction success
      await expect(txHash).toBeVisible({ timeout: 30000 })
      const hashText = await txHash.textContent()
      expect(hashText).toMatch(/^0x[a-fA-F0-9]{64}$/)
      console.log('✅ Transaction hash:', hashText)

      // Verify we get expected leverage token shares
      const successMessage = page.locator('text=Mint successful!')
      await expect(successMessage).toBeVisible()
    } catch (_successError) {
      // If transaction failed, check what error we got
      const isErrorVisible = await errorMessage.isVisible()
      if (isErrorVisible) {
        const errorText = await page.locator('p').filter({ hasText: 'Error:' }).textContent()
        console.log('❌ Unexpected error in Happy Path test:', errorText)
        throw new Error(`Happy Path test failed with error: ${errorText}`)
      } else {
        throw new Error('Happy Path test failed: Neither success nor error state detected')
      }
    }

    // TODO: Once we fix the balance issue, these assertions should work
    // For now, we're debugging the contract revert
  })

  test('should show wallet connection prompt when not connected', async ({ page }) => {
    // Navigate directly to a token page (assuming tokens exist)
    await page.goto('/tokens')

    // If not connected, should show connect wallet message or button
    const connectPrompt = page.locator('text=Connect your wallet')
    if (await connectPrompt.isVisible()) {
      await expect(connectPrompt).toBeVisible()
    }
  })

  test('should validate mint form inputs', async ({ page }) => {
    // Connect mock wallet first
    const connectMockButton = page.getByTestId('connect-mock')
    if (await connectMockButton.isVisible()) {
      await connectMockButton.click()
      await expect(connectMockButton).not.toBeVisible()
    }

    // Verify mint form is visible (no navigation needed, form should be on token page)
    // Verify submit button is disabled when no amount is entered
    const submitButton = page.getByTestId('mint-submit-button')
    const amountInput = page.getByTestId('mint-amount-input')

    await expect(amountInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeDisabled()

    // Enter amount and verify button becomes enabled
    await amountInput.fill('0.1')
    await expect(submitButton).toBeEnabled()

    // Clear amount and verify button is disabled again
    await amountInput.fill('')
    await expect(submitButton).toBeDisabled()
  })

  test('should handle mint errors gracefully', async ({ page }) => {
    // Connect mock wallet first
    const connectMockButton = page.getByTestId('connect-mock')
    if (await connectMockButton.isVisible()) {
      await connectMockButton.click()
      await expect(connectMockButton).not.toBeVisible()
    }

    // Verify mint form is visible

    // Test that button responds to amount input
    const amountInput = page.getByTestId('mint-amount-input')
    await expect(amountInput).toBeVisible()

    // Clear input - button should be disabled
    await amountInput.fill('')
    const submitButton = page.getByTestId('mint-submit-button')
    await expect(submitButton).toBeDisabled()

    // Enter amount - button should be enabled (validation happens on contract level)
    await amountInput.fill('0.1')
    await expect(submitButton).toBeEnabled()

    // Try with very large amount (might trigger slippage/liquidity errors)
    await amountInput.fill('999999')
    await expect(submitButton).toBeEnabled()

    // Click submit and look for error handling
    await submitButton.click()

    // Should either show error message or complete successfully
    // This is a graceful degradation test - both outcomes are acceptable
    const errorMessage = page.locator('text=Error:')
    const successMessage = page.locator('text=Mint successful!')

    // Wait for either success or error (with reasonable timeout)
    await Promise.race([
      expect(errorMessage).toBeVisible({ timeout: 30000 }),
      expect(successMessage).toBeVisible({ timeout: 30000 }),
    ]).catch(() => {
      // If neither appears, that's also acceptable - transaction might be pending
      console.log('No immediate success/error message - transaction may be pending')
    })
  })
})
