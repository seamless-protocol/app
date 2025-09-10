import { expect, test } from '@playwright/test'

test.describe('Basic App Loading', () => {
  test('should load app with #root element', async ({ page }) => {
    // Navigate to app root
    await page.goto('/')

    // Wait for app to load
    await page.waitForLoadState('networkidle')

    // Verify the React app loaded by checking for #root element
    await expect(page.locator('#root')).toBeVisible()

    // Verify the page doesn't show "Not Found" error
    const content = await page.textContent('body')
    expect(content).not.toContain('Not Found')
  })

  test('should support hash routing', async ({ page }) => {
    // Test hash routing works
    await page.goto('/#/tokens')

    // Wait for navigation
    await page.waitForLoadState('networkidle')

    // Check that we're on the tokens route
    expect(page.url()).toContain('#/tokens')

    // Verify app loaded (should have #root element)
    await expect(page.locator('#root')).toBeVisible()
  })
})
