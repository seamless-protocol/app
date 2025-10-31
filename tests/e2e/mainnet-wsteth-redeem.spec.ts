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

test.describe('Mainnet wstETH/ETH 25x redeem (JIT + LiFi)', () => {
  let snapshotId: `0x${string}`

  test.beforeEach(async () => {
    const chainId = await publicClient.getChainId()
    if (chainId !== leverageTokenDefinition.chainId)
      throw new Error(
        'Mainnet wstETH/ETH 25x redeem: Chain ID mismatch between leverage token definition and public client',
      )

    // Fund test account with wstETH so we can mint tokens first
    await topUpErc20(MAINNET_WSTETH, TEST_ACCOUNT, '1')

    snapshotId = await takeSnapshot()
  })

  test.afterEach(async () => {
    await revertSnapshot(snapshotId)
  })

  test('redeems wstETH/ETH 25x via modal using LiFi route', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/#/leverage-tokens', { waitUntil: 'domcontentloaded' })

    // Connect mock wallet
    const connect = page.getByTestId('connect-mock')
    await expect(connect).toBeVisible({ timeout: 10_000 })
    await connect.click()
    await expect(connect).toBeHidden({ timeout: 10_000 })

    await page.goto(`/#/leverage-tokens/${leverageTokenDefinition.chainId}/${leverageTokenAddress}`)

    // Wait for page to load and scroll to holdings card (use .last() due to duplicate renders)
    const holdingsCard = page.getByTestId('leverage-token-holdings-card').last()
    await expect(holdingsCard).toBeVisible({ timeout: 10_000 })
    await holdingsCard.scrollIntoViewIfNeeded()

    // First, mint some tokens so we have something to redeem
    const mintButton = page.getByTestId('mint-button').last()
    await expect(mintButton).toBeVisible({ timeout: 15_000 })
    await mintButton.click()

    const mintModal = page.getByRole('dialog', { name: 'Mint Leverage Token' })
    await expect(mintModal).toBeVisible()

    const mintAmountInput = mintModal.getByLabel('Mint Amount')
    await mintAmountInput.fill('0.1')

    // TODO: Investigate why tests require 2.5% slippage (higher than prod default 0.5%)
    // May be related to CoinGecko price discrepancies or LiFi quote variations
    const mintAdvancedButton = mintModal.getByRole('button', { name: 'Advanced' })
    await mintAdvancedButton.click()
    const mintSlippageInput = mintModal.getByPlaceholder('0.5')
    await expect(mintSlippageInput).toBeVisible({ timeout: 5_000 })
    await mintSlippageInput.fill('2.5')

    const mintPrimary = mintModal.getByRole('button', { name: /(Approve|Mint|Enter an amount)/i })
    await expect(mintPrimary).toBeVisible({ timeout: 20_000 })
    await expect(mintPrimary).toBeEnabled({ timeout: 20_000 })
    const mintLabel = (await mintPrimary.innerText()) ?? ''
    await mintPrimary.click()

    const mintConfirm = page.getByRole('heading', { name: 'Confirm Mint' })
    if (/Approve/i.test(mintLabel)) {
      await expect(mintConfirm).toBeVisible({ timeout: 20_000 })
    } else {
      await expect(mintConfirm).toBeVisible()
    }

    await page.getByRole('button', { name: 'Confirm Mint' }).click()

    await expect(page.getByRole('heading', { name: 'Mint Success!' })).toBeVisible({
      timeout: 60_000,
    })

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(mintButton).toBeVisible()

    // Now redeem the tokens we just minted
    const redeemButton = page.getByTestId('redeem-button').last()
    await expect(redeemButton).toBeVisible({ timeout: 15_000 })
    await redeemButton.click()

    const redeemModal = page.getByRole('dialog', { name: 'Redeem Leverage Token' })
    await expect(redeemModal).toBeVisible()

    // Click MAX to redeem all tokens
    await redeemModal.getByRole('button', { name: 'MAX' }).click()

    // TODO: Investigate why tests require 2.5% slippage (higher than prod default 0.5%)
    // May be related to CoinGecko price discrepancies or LiFi quote variations
    const redeemAdvancedButton = redeemModal.getByRole('button', { name: 'Advanced' })
    await redeemAdvancedButton.click()
    const redeemSlippageInput = redeemModal.getByPlaceholder('0.5')
    await expect(redeemSlippageInput).toBeVisible({ timeout: 5_000 })
    await redeemSlippageInput.fill('2.5')

    // Wait for quote/plan to resolve (button stops showing Calculating)
    const redeemPrimary = redeemModal.getByRole('button', {
      name: /(Approve|Redeem|Enter an amount|Calculating)/i,
    })
    await expect(redeemPrimary).toBeVisible({ timeout: 30_000 })
    await expect(redeemPrimary).not.toHaveText(/Calculating/i, { timeout: 60_000 })
    await expect(redeemPrimary).toBeEnabled({ timeout: 15_000 })
    const redeemLabel = (await redeemPrimary.innerText()) ?? ''
    await redeemPrimary.click()

    const redeemConfirm = page.getByRole('heading', { name: 'Confirm Redemption' })
    if (/Approve/i.test(redeemLabel)) {
      await expect(redeemConfirm).toBeVisible({ timeout: 20_000 })
    } else {
      await expect(redeemConfirm).toBeVisible()
    }

    await page.getByRole('button', { name: 'Confirm Redemption' }).click()

    // Wait for either wallet confirmation or processing state
    await expect(
      page.getByRole('heading', { name: /(Confirm in Wallet|Processing Redemption)/ }),
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Redemption Completed!' })).toBeVisible({
      timeout: 60_000,
    })

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(redeemButton).toBeVisible()
  })
})
