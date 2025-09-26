import { expect, test } from '@playwright/test'

test.describe('Basic App Loading', () => {
  test('should load app with #root element', async ({ page }) => {
    // Navigate to app root
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })

    // Wait for app to load
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // Wait for the app-ready marker set in src/main.tsx
    await page.waitForFunction(
      () =>
        document.body.dataset['appReady'] === 'true' ||
        Boolean(document.querySelector('#root')?.firstElementChild),
    )
    await expect(page.locator('#root')).toBeVisible()

    // Verify the page doesn't show "Not Found" error
    const content = await page.textContent('body')
    expect(content).not.toContain('Not Found')
  })

  test('should support hash routing', async ({ page }) => {
    // Test hash routing works
    await page.goto('/#/tokens', { waitUntil: 'domcontentloaded', timeout: 15_000 })

    // Wait for navigation
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // Check that we're on the tokens route
    expect(page.url()).toContain('#/tokens')

    await page.waitForFunction(
      () =>
        document.body.dataset['appReady'] === 'true' ||
        Boolean(document.querySelector('#root')?.firstElementChild),
    )
    await expect(page.locator('#root')).toBeVisible()
  })
})
