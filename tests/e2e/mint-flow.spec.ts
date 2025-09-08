import { expect, test } from '@playwright/test'

test.describe('Leverage Token smoke tests', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c'
  const chainId = '8453'

  test('loads token page and shows holdings card', async ({ page }) => {
    await page.goto(`/#/tokens/${chainId}/${tokenAddress}`)
    await expect(page.getByTestId('leverage-token-holdings-card')).toBeVisible({ timeout: 15000 })
    // In test mode, mock connect button should be visible
    await expect(page.getByTestId('connect-mock')).toBeVisible()
  })

  test('tokens index renders table', async ({ page }) => {
    await page.goto('/#/tokens')
    await expect(page.locator('text=Leverage Token Name')).toBeVisible({ timeout: 15000 })
  })
})
