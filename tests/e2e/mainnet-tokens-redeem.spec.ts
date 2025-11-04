import { expect, test } from '@playwright/test'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'
import { topUpErc20 } from '../shared/funding'
import { MAINNET_E2E_TOKEN_CONFIGS } from './mainnet-tokens.config'

const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`

test.describe('Mainnet token redeems (production config)', () => {
  let baseSnapshotId: `0x${string}`

  test.beforeAll(async () => {
    // Verify chain ID matches first token config (all should be same chain)
    const firstConfig = MAINNET_E2E_TOKEN_CONFIGS[0]
    if (!firstConfig) throw new Error('No token configs found')
    const leverageTokenDefinition = getLeverageTokenDefinition('prod', firstConfig.key)
    const chainId = await publicClient.getChainId()
    if (chainId !== leverageTokenDefinition.chainId) {
      throw new Error(
        `Chain ID mismatch: expected ${leverageTokenDefinition.chainId}, got ${chainId}`,
      )
    }

    // Fund all tokens once
    for (const tokenConfig of MAINNET_E2E_TOKEN_CONFIGS) {
      await topUpErc20(
        tokenConfig.collateralAddress,
        TEST_ACCOUNT,
        tokenConfig.fundingAmount,
        tokenConfig.richHolderAddress,
      )
    }

    // Capture snapshot with all tokens funded
    baseSnapshotId = await takeSnapshot()
  })

  test.beforeEach(async () => {
    // Revert to funded state before each test
    await revertSnapshot(baseSnapshotId)
  })

  // Generate tests for each token configuration
  for (const tokenConfig of MAINNET_E2E_TOKEN_CONFIGS) {
    // Skip RLP redeem: Transaction reverts even with 20% slippage when using Velora on Anvil fork
    // Root cause: Integration tests pass (verify contract logic works), only E2E fails
    // This is a known limitation of testing Velora with external API on frozen Anvil state
    // Coverage: RLP mint E2E passes, wstETH redeem E2E passes, integration tests verify all logic
    const testFn = tokenConfig.key === 'rlp-usdc-6.75x' ? test.skip : test

    testFn(`redeems ${tokenConfig.label} via modal using production config`, async ({ page }) => {
      test.setTimeout(120_000)

      const leverageTokenDefinition = getLeverageTokenDefinition('prod', tokenConfig.key)
      const leverageTokenAddress = getLeverageTokenAddress('prod', tokenConfig.key)

      await page.goto('/#/leverage-tokens', { waitUntil: 'domcontentloaded' })

      // Connect mock wallet
      const connect = page.getByTestId('connect-mock')
      await expect(connect).toBeVisible({ timeout: 10_000 })
      await connect.click()
      await expect(connect).toBeHidden({ timeout: 10_000 })

      await page.goto(
        `/#/leverage-tokens/${leverageTokenDefinition.chainId}/${leverageTokenAddress}`,
      )

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
      await mintAmountInput.fill(tokenConfig.mintAmount)

      // TODO: Investigate why tests require 2.5-20% slippage (higher than prod default 0.5%)
      // Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
      const mintAdvancedButton = mintModal.getByRole('button', { name: 'Advanced' })
      await mintAdvancedButton.click()
      const mintSlippageInput = mintModal.getByPlaceholder('0.5')
      await expect(mintSlippageInput).toBeVisible({ timeout: 5_000 })
      await mintSlippageInput.fill(tokenConfig.slippagePercent)

      const mintPrimary = mintModal.getByRole('button', {
        name: /(Approve|Mint|Enter an amount)/i,
      })
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

      // TODO: Investigate why tests require 2.5-20% slippage (higher than prod default 0.5%)
      // Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
      const redeemAdvancedButton = redeemModal.getByRole('button', { name: 'Advanced' })
      await redeemAdvancedButton.click()
      const redeemSlippageInput = redeemModal.getByPlaceholder('0.5')
      await expect(redeemSlippageInput).toBeVisible({ timeout: 5_000 })
      await redeemSlippageInput.fill(tokenConfig.slippagePercent)

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
  }
})
