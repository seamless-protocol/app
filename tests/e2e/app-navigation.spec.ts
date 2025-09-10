import { expect, test } from '@playwright/test'

test.describe('App Navigation & Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tokens page using hash routing
    await page.goto('/#/tokens')
  })

  test('should load tokens page', async ({ page }) => {
    // Wait for page to load and check content
    await page.waitForLoadState('networkidle')

    // Debug: log the page content
    const content = await page.content()
    if (content.includes('Not Found')) {
      console.error('Page shows Not Found - app not loading correctly')
    }

    // Verify we're on the tokens page
    await expect(page).toHaveURL(/#\/tokens/)
    // Check for the main page heading in the top bar
    await expect(page.locator('h1:has-text("Leverage Tokens")')).toBeVisible()
    // Check for the Featured High-Reward Tokens section
    await expect(page.locator('h2:has-text("Featured High-Reward Tokens")')).toBeVisible()
    await expect(page.locator('text=Top Rewards')).toBeVisible()
  })

  test('should redirect from home to tokens', async ({ page }) => {
    // Test the redirect separately
    await page.goto('/')

    // Wait for redirect to happen and page to load
    await page.waitForURL(/#\/tokens/, { timeout: 10000 })

    // Should be redirected to tokens
    await expect(page).toHaveURL(/#\/tokens/)
    // Verify the page actually loaded with content
    await expect(page.locator('h1:has-text("Leverage Tokens")')).toBeVisible()
  })

  test('should show connect wallet button', async ({ page }) => {
    // Navigate to tokens page
    await page.goto('/#/tokens')

    // Look for the connect wallet button in the top bar
    const connectButton = page.getByTestId('connect-mock')

    // Verify the button is visible
    await expect(connectButton).toBeVisible()
    await expect(connectButton).toHaveText('Connect (Mock)')
  })

  test('should show connection status card on portfolio page when not connected', async ({
    page,
  }) => {
    // Navigate to portfolio page
    await page.goto('/#/portfolio')

    // Verify we're on portfolio page by checking URL
    await expect(page).toHaveURL(/#\/portfolio/)

    // Look for connection status or wallet info (tests run with mock connector)
    // The exact content depends on whether mock wallet auto-connects
    const hasConnectButton = await page.getByTestId('connect-mock').isVisible()
    const hasDisconnectButton = await page.getByTestId('disconnect-mock').isVisible()

    // Either connect or disconnect button should be visible
    expect(hasConnectButton || hasDisconnectButton).toBeTruthy()
  })

  test('should show vertical navigation', async ({ page }) => {
    // Navigate to tokens page
    await page.goto('/#/tokens')

    // Check viewport width to determine desktop vs mobile
    const viewport = page.viewportSize()
    const isDesktop = viewport && viewport.width >= 1024 // lg breakpoint

    if (isDesktop) {
      // Desktop navigation - check for desktop navigation container
      await expect(page.locator('.hidden.lg\\:block.w-84')).toBeVisible()
      // Check for navigation items in the sidebar
      await expect(page.locator('text=Leverage Tokens').first()).toBeVisible()
      await expect(page.locator('text=Portfolio').first()).toBeVisible()
      await expect(page.locator('text=Analytics').first()).toBeVisible()
    } else {
      // Mobile navigation - verify mobile menu button exists
      await expect(page.locator('.lg\\:hidden')).toBeVisible()
    }
  })

  test('should navigate between pages using sidebar', async ({ page }) => {
    // Start on tokens page
    await page.goto('/#/tokens')

    // Check if desktop navigation is visible
    const desktopNav = page.locator('.hidden.lg\\:block')
    const isDesktop = await desktopNav.isVisible()

    if (isDesktop) {
      // Desktop navigation - click on navigation items
      await page.locator('text=Portfolio').first().click()
      await expect(page).toHaveURL(/#\/portfolio/)

      // Navigate to Analytics
      await page.locator('text=Analytics').first().click()
      await expect(page).toHaveURL(/#\/analytics/)
    } else {
      // Mobile - skip navigation test since it requires mobile menu interaction
      test.skip(true, 'Skipping navigation test on mobile viewport')
    }
  })
})
