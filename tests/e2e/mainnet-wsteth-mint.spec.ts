import { expect, test } from '@playwright/test'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'

const TOKEN_KEY = 'wsteth-eth-25x'
const leverageTokenDefinition = getLeverageTokenDefinition('prod', TOKEN_KEY)
const leverageTokenAddress = getLeverageTokenAddress('prod', TOKEN_KEY)

test.describe('Mainnet wstETH/ETH 25x mint (JIT + LiFi)', () => {
  let snapshotId: `0x${string}`

  test.beforeEach(async () => {
    const chainId = await publicClient.getChainId()
    if (chainId !== leverageTokenDefinition.chainId)
      throw new Error(
        'Mainnet wstETH/ETH 25x mint: Chain ID mismatch between leverage token definition and public client',
      )
    snapshotId = await takeSnapshot()
  })

  test.afterEach(async () => {
    await revertSnapshot(snapshotId)
  })

  test('mints wstETH/ETH 25x via modal using LiFi route', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/#/leverage-tokens')
    const connect = page.getByTestId('connect-mock')
    if (await connect.isVisible()) {
      await connect.click()
      await expect(connect).toBeHidden({ timeout: 10_000 })
    }

    await page.goto(`/#/leverage-tokens/${leverageTokenDefinition.chainId}/${leverageTokenAddress}`)

    const mintButton = page.getByRole('button', { name: 'Mint' })
    await expect(mintButton).toBeVisible({ timeout: 15_000 })
    await mintButton.click()

    const modal = page.getByRole('dialog', { name: 'Mint Leverage Token' })
    await expect(modal).toBeVisible()

    const amountInput = modal.getByLabel('Mint Amount')
    await amountInput.fill('0.1')

    const primary = modal.getByRole('button', { name: /(Approve|Mint|Enter an amount)/i })
    await expect(primary).toBeVisible({ timeout: 20_000 })
    await expect(primary).toBeEnabled({ timeout: 20_000 })
    const label = (await primary.innerText()) ?? ''
    await primary.click()

    const confirm = page.getByRole('heading', { name: 'Confirm Mint' })
    if (/Approve/i.test(label)) {
      await expect(confirm).toBeVisible({ timeout: 20_000 })
    } else {
      await expect(confirm).toBeVisible()
    }

    await page.getByRole('button', { name: 'Confirm Mint' }).click()
    await expect(page.getByRole('heading', { name: 'Processing Mint' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mint Success!' })).toBeVisible({
      timeout: 60_000,
    })

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(mintButton).toBeVisible()
  })
})
