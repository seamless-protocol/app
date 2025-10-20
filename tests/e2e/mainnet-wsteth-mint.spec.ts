import { expect, test } from '@playwright/test'
import type { Address } from 'viem'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'
import { topUpErc20 } from '../shared/funding'

const TOKEN_KEY = 'wsteth-eth-25x'
const leverageTokenDefinition = getLeverageTokenDefinition('prod', TOKEN_KEY)
const leverageTokenAddress = getLeverageTokenAddress('prod', TOKEN_KEY)

// Canonical mainnet wstETH address
const MAINNET_WSTETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address
// Test account address (default Anvil/Tenderly account #0)
const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address

test.describe('Mainnet wstETH/ETH 25x mint (JIT + LiFi)', () => {
  let snapshotId: `0x${string}`

  test.beforeEach(async () => {
    const chainId = await publicClient.getChainId()
    if (chainId !== leverageTokenDefinition.chainId)
      throw new Error(
        'Mainnet wstETH/ETH 25x mint: Chain ID mismatch between leverage token definition and public client',
      )

    // Fund test account with wstETH for minting
    await topUpErc20(MAINNET_WSTETH, TEST_ACCOUNT, '1')

    snapshotId = await takeSnapshot()
  })

  test.afterEach(async () => {
    await revertSnapshot(snapshotId)
  })

  test('mints wstETH/ETH 25x via modal using LiFi route', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/#/leverage-tokens', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')

    // Connect mock wallet
    const connect = page.getByTestId('connect-mock')
    await expect(connect).toBeVisible({ timeout: 10_000 })
    await connect.click()
    await expect(connect).toBeHidden({ timeout: 10_000 })

    await page.goto(`/#/leverage-tokens/${leverageTokenDefinition.chainId}/${leverageTokenAddress}`)

    // Wait for page to load and scroll to holdings card (use .last() due to duplicate renders)
    await page.waitForLoadState('networkidle')
    const holdingsCard = page.getByTestId('leverage-token-holdings-card').last()
    await expect(holdingsCard).toBeVisible({ timeout: 10_000 })
    await holdingsCard.scrollIntoViewIfNeeded()

    // Find mint button (use .last() due to duplicate renders)
    const mintButton = page.getByTestId('mint-button').last()
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

    await expect(page.getByRole('heading', { name: 'Mint Success!' })).toBeVisible({
      timeout: 60_000,
    })

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(mintButton).toBeVisible()
  })
})
