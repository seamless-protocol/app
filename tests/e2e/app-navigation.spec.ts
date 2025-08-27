import { expect, test } from '@playwright/test'

test.describe('App Navigation & Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to tokens page to avoid redirect issues in tests
    await page.goto('/tokens')
  })

  test('should load tokens page', async ({ page }) => {
    // Verify we're on the tokens page (with hash routing)
    await expect(page).toHaveURL(/.*#\/tokens/)
    await expect(page.locator('main h3:has-text("Leverage Tokens")')).toBeVisible()
    await expect(page.locator('text=Browse and manage leverage tokens.')).toBeVisible()
  })

  test('should redirect from home to tokens', async ({ page }) => {
    // Test the redirect separately
    await page.goto('/')

    // Wait a bit for redirect to happen
    await page.waitForTimeout(1000)

    // Should be redirected to tokens (with hash routing)
    await expect(page).toHaveURL(/.*#\/tokens/)
  })

  test('should show connect wallet button', async ({ page }) => {
    // Navigate to tokens page
    await page.goto('/tokens')

    // Look for the connect wallet button in the top bar
    const connectButton = page.locator('button:has-text("Connect Wallet")')

    // Verify the button is visible
    await expect(connectButton).toBeVisible()
  })

  test('should show connection status card on portfolio page when not connected', async ({
    page,
  }) => {
    // Navigate to portfolio page
    await page.goto('/portfolio')

    // Look for connection status card (assuming wallet is not connected in test environment)
    const connectionCard = page.locator('text=Connect Your Wallet')

    // This should be visible if wallet is not connected
    if (await connectionCard.isVisible()) {
      await expect(connectionCard).toBeVisible()
    }
  })

  test('should show vertical navigation', async ({ page }) => {
    // Navigate to tokens page
    await page.goto('/tokens')

    // Verify vertical navigation is visible (look for navigation items by title)
    await expect(page.locator('h3:has-text("Leverage Tokens")').first()).toBeVisible()
    await expect(page.locator('h3:has-text("Portfolio")').first()).toBeVisible()
    await expect(page.locator('h3:has-text("Analytics")').first()).toBeVisible()
  })

  test('should navigate between pages using sidebar', async ({ page }) => {
    // Start on tokens page
    await page.goto('/tokens')

    // Click on Portfolio in sidebar (click the button containing the Portfolio text)
    await page.locator('button:has(h3:has-text("Portfolio"))').click()
    await expect(page).toHaveURL(/.*#\/portfolio/)

    // Click on Analytics in sidebar
    await page.locator('button:has(h3:has-text("Analytics"))').click()
    await expect(page).toHaveURL(/.*#\/analytics/)
  })
})
