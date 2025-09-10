import { expect, test } from '@playwright/test'

test('verify dev server is responding', async ({ page }) => {
  // Navigate to app root
  await page.goto('/')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Get the response to verify server is working
  const response = await page.request.get('http://127.0.0.1:3000/')
  console.log('Server response status:', response.status())

  // Check if app loaded successfully
  const hasRoot = await page.locator('#root').isVisible()
  console.log('App has #root element:', hasRoot)

  // Basic assertions
  expect(response.status()).toBe(200)
  await expect(page.locator('#root')).toBeVisible()
})
