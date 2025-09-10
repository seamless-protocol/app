import { expect, test } from '@playwright/test'

test('debug server check', async ({ page }) => {
  // Try to load the base URL
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

  console.log('Response status:', response?.status())
  console.log('Response URL:', response?.url())

  // Get page content
  const content = await page.content()
  console.log('Page title:', await page.title())

  // Check if we have the app root element
  const hasRoot = await page.locator('#root').count()
  console.log('Has #root element:', hasRoot > 0)

  // Check for any error messages
  if (content.includes('Not Found')) {
    console.error('Page shows "Not Found"')
  }

  if (content.includes('Cannot GET')) {
    console.error('Server error: Cannot GET')
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/debug-screenshot.png' })

  // We expect the app to have a root element
  await expect(page.locator('#root')).toBeVisible()
})
