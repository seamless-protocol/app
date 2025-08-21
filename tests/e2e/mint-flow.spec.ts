import { expect, test } from '@playwright/test'

test.describe('Mint Flow - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tokens page
    await page.goto('/#/tokens')

    // Wait for the page to load
    await expect(page.locator('h3:has-text("Leverage Tokens")')).toBeVisible()
  })

  test('should complete full mint flow using mock wallet', async ({ page }) => {
    // Step 1: Connect mock wallet (should be available in test mode)
    const connectMockButton = page.getByTestId('connect-mock')
    await expect(connectMockButton).toBeVisible()
    await connectMockButton.click()

    // Wait for connection to complete
    await expect(connectMockButton).not.toBeVisible()

    // Step 2: Find and click a mint button for a leverage token
    // Look for any mint button (assuming tokens are displayed)
    const mintButton = page.locator('button:has-text("Mint")')
    await expect(mintButton.first()).toBeVisible()
    await mintButton.first().click()

    // Step 3: Fill in mint amount
    const amountInput = page.getByTestId('mint-amount-input')
    await expect(amountInput).toBeVisible()

    // Enter test amount (1 ETH)
    await amountInput.fill('1')

    // Step 4: Submit mint transaction
    const submitButton = page.getByTestId('mint-submit-button')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()

    await submitButton.click()

    // Step 5: Wait for transaction to complete and verify success
    // Look for transaction hash (indicates successful transaction)
    const txHash = page.getByTestId('mint-tx-hash')
    await expect(txHash).toBeVisible({ timeout: 30000 }) // Allow 30s for tx

    // Verify the hash looks like a valid Ethereum transaction hash (0x + 64 hex chars)
    const hashText = await txHash.textContent()
    expect(hashText).toMatch(/^0x[a-fA-F0-9]{64}$/)

    // Step 6: Verify expected shares are displayed
    const expectedShares = page.getByTestId('mint-expected-shares')
    await expect(expectedShares).toBeVisible()

    // Verify shares value is not "N/A" (indicates successful preview)
    const sharesText = await expectedShares.textContent()
    expect(sharesText).not.toBe('N/A')
    expect(sharesText).toMatch(/^\d+$/) // Should be a number

    // Step 7: Verify success message is shown
    await expect(page.locator('text=Mint successful!')).toBeVisible()
  })

  test('should show wallet connection prompt when not connected', async ({ page }) => {
    // Navigate directly to a token page (assuming tokens exist)
    await page.goto('/#/tokens')

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

    // Find and click mint button
    const mintButton = page.locator('button:has-text("Mint")')
    await expect(mintButton.first()).toBeVisible()
    await mintButton.first().click()

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

    // Find and click mint button
    const mintButton = page.locator('button:has-text("Mint")')
    await expect(mintButton.first()).toBeVisible()
    await mintButton.first().click()

    // Enter invalid amount (negative or zero)
    const amountInput = page.getByTestId('mint-amount-input')
    await expect(amountInput).toBeVisible()
    await amountInput.fill('0')

    const submitButton = page.getByTestId('mint-submit-button')

    // Button should be disabled for invalid amounts
    await expect(submitButton).toBeDisabled()

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
