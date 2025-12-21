import { expect, test } from '@playwright/test'
import { erc20Abi, type Hash } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import {
  account,
  DEFAULT_CHAIN_ID,
  LEVERAGE_TOKEN_ADDRESS,
  publicClient,
  revertSnapshot,
  takeSnapshot,
} from '../shared/clients'
import { LEVERAGE_TOKEN_DEFINITION } from '../shared/env'
import {
  ensureRedeemSetup,
  planRedeemTest,
  type RedeemPlanningContext,
} from '../shared/scenarios/redeem'
import { wagmiConfig } from '../shared/wagmi'

const { E2E_CHAIN_ID, E2E_LEVERAGE_TOKEN_ADDRESS } = process.env
const chainId = E2E_CHAIN_ID ?? `${DEFAULT_CHAIN_ID}`
const leverageTokenAddress = (E2E_LEVERAGE_TOKEN_ADDRESS ?? LEVERAGE_TOKEN_ADDRESS) as `0x${string}`
const SLIPPAGE_BPS = 50

const redeemContext: RedeemPlanningContext = {
  config: wagmiConfig as Config,
  publicClient,
  account,
}

// Skip entire file when not running against Base canonical chain
// Must be placed before any tests are declared
test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== base.id, 'Base-only E2E suite')

test.describe('Leverage token redeem flow', () => {
  let baseSnapshot: Hash
  let sharesToRedeem: bigint
  let collateralAsset: `0x${string}`
  test.beforeAll(async () => {
    baseSnapshot = await takeSnapshot()
  })

  test.beforeEach(async () => {
    await revertSnapshot(baseSnapshot)
    baseSnapshot = await takeSnapshot()

    const setup = await ensureRedeemSetup({
      ctx: redeemContext,
      tokenDefinition: LEVERAGE_TOKEN_DEFINITION,
      slippageBps: SLIPPAGE_BPS,
    })

    sharesToRedeem = setup.sharesToRedeem
    collateralAsset = setup.collateralAsset
  })

  test.afterEach(async () => {
    await revertSnapshot(baseSnapshot)
  })

  test('redeems leverage tokens through the modal', async ({ page }) => {
    test.setTimeout(120_000)

    const { plan } = await planRedeemTest({
      ctx: redeemContext,
      tokenDefinition: LEVERAGE_TOKEN_DEFINITION,
      sharesToRedeem,
      slippageBps: SLIPPAGE_BPS,
    })

    expect(plan.sharesToRedeem).toBe(sharesToRedeem)

    const tokenBalanceBefore = await readLeverageTokenBalance()
    const collateralBalanceBefore = await readErc20Balance(collateralAsset)
    const payoutAddress = collateralAsset

    await page.goto('/#/tokens', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('domcontentloaded')

    const connectButton = page.getByTestId('connect-mock')
    if (await connectButton.isVisible()) {
      await connectButton.click()
      await expect(connectButton).toBeHidden({ timeout: 5_000 })
    }

    await page.goto(`/#/tokens/${chainId}/${leverageTokenAddress}`)
    await expect(page).toHaveURL(new RegExp(`/#/tokens/${chainId}/${leverageTokenAddress}`, 'i'))

    const redeemButton = page.getByRole('button', { name: /^Redeem$/ })
    await expect(redeemButton).toBeVisible({ timeout: 15_000 })
    await redeemButton.click()

    const modal = page.getByRole('dialog', { name: 'Redeem Leverage Token' })
    await expect(modal).toBeVisible()

    await modal.getByRole('button', { name: 'MAX' }).click()

    // Allow initial 'Calculating...' label while quotes/preview resolve
    const primaryAction = modal.getByRole('button', {
      name: /(Approve|Redeem|Enter an amount|Calculating)/i,
    })
    await expect(primaryAction).toBeVisible({ timeout: 30_000 })
    await expect(primaryAction).not.toHaveText(/Minimum redeem/i, { timeout: 30_000 })
    await expect(primaryAction).not.toHaveText(/Calculating/i, { timeout: 60_000 })
    await expect(primaryAction).toBeEnabled({ timeout: 15_000 })

    const primaryLabel = (await primaryAction.innerText()) ?? ''
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
    })
    await modal.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: 'instant' }))
    await primaryAction.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }))
    await primaryAction.click()

    const confirmHeading = page.getByRole('heading', { name: 'Confirm Redemption' })
    if (/Approve/i.test(primaryLabel)) {
      await expect(confirmHeading).toBeVisible({ timeout: 20_000 })
    } else {
      await expect(confirmHeading).toBeVisible()
    }

    await page.getByRole('button', { name: 'Confirm Redemption' }).click()

    await expect(page.getByRole('heading', { name: 'Processing Redemption' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('heading', { name: 'Redemption Completed!' })).toBeVisible({
      timeout: 60_000,
    })

    await page.getByRole('button', { name: 'Done' }).click()
    await expect(redeemButton).toBeVisible()

    const tokenBalanceAfter = await readLeverageTokenBalance()
    const collateralBalanceAfter = await readErc20Balance(payoutAddress)

    expect(tokenBalanceAfter).toBe(tokenBalanceBefore - plan.sharesToRedeem)

    if (payoutAddress.toLowerCase() === collateralAsset.toLowerCase()) {
      expect(collateralBalanceAfter - collateralBalanceBefore >= plan.minCollateralForSender).toBe(
        true,
      )
    }
  })
})

async function readLeverageTokenBalance(): Promise<bigint> {
  return await publicClient.readContract({
    address: leverageTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
}

async function readErc20Balance(asset: `0x${string}`): Promise<bigint> {
  return await publicClient.readContract({
    address: asset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })
}
// Skip when not running against Base canonical chain
test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== base.id, 'Base-only E2E suite')
