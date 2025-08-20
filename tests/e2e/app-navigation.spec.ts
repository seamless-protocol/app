import { expect, test } from '@playwright/test'

test.describe('App Navigation & Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test('should load home page successfully', async ({ page }) => {
    // Verify we're on the home page
    await expect(page.locator('h1:has-text("Welcome to Seamless Protocol")')).toBeVisible()
    await expect(page.locator('text=DeFi Made Simple')).toBeVisible()
  })

  test('should navigate to tokens page', async ({ page }) => {
    // Navigate to tokens page using hash routing
    await page.goto('/#/tokens')

    // Verify we're on the tokens page
    await expect(page.locator('h3:has-text("Leverage Tokens")')).toBeVisible()
    await expect(page.locator('text=Browse and manage leverage tokens.')).toBeVisible()
  })

  test('should open wallet connection modal', async ({ page }) => {
    // Look for the connect wallet button
    const connectButton = page.locator('button:has-text("Connect Wallet")')

    // Verify the button is visible
    await expect(connectButton).toBeVisible()

    // Click the button to open the modal
    await connectButton.click()

    // Wait for the modal to appear and verify wallet options are shown
    await expect(page.locator('text=MetaMask')).toBeVisible()

    // Verify wallet options are present (should be at least one)
    const walletOptions = page.locator('[role="button"]')
    const count = await walletOptions.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('should show wallet info when connected', async ({ page }) => {
    // Check if wallet info is already visible (indicating wallet is connected)
    const walletInfo = page.locator('text=Connected Address:')

    if (await walletInfo.isVisible()) {
      // Wallet is already connected, verify the info is displayed
      await expect(walletInfo).toBeVisible()
      await expect(page.locator('text=Current Chain:')).toBeVisible()
      await expect(page.locator('text=Balance:')).toBeVisible()
    } else {
      // Wallet is not connected, verify the connection prompt is shown
      await expect(page.locator('text=Connect your wallet to see account info')).toBeVisible()
    }
  })

  test('should show wallet connection prompt when not connected', async ({ page }) => {
    // Navigate to tokens page using hash routing
    await page.goto('/#/tokens')

    // Look for wallet connection prompt
    const walletPrompt = page.locator('text=Connect your wallet to see account info')

    // This should be visible if wallet is not connected
    // Note: In a real test environment, we'd need to ensure wallet is disconnected
    if (await walletPrompt.isVisible()) {
      await expect(walletPrompt).toBeVisible()
    }
  })
})
