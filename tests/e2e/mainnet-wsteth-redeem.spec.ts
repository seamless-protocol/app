import { expect, test } from '@playwright/test'
import { erc20Abi, type Hash } from 'viem'
import { mainnet } from 'viem/chains'
import type { Config } from 'wagmi'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { account, publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'
import {
  ensureRedeemSetup,
  planRedeemTest,
  type RedeemPlanningContext,
} from '../shared/scenarios/redeem'
import { wagmiConfig } from '../shared/wagmi'

const MAINNET_CHAIN_ID = mainnet.id
const TOKEN_KEY = 'wsteth-weth-2x'
const leverageTokenDefinition = getLeverageTokenDefinition('tenderly', TOKEN_KEY)
const leverageTokenAddress = getLeverageTokenAddress('tenderly', TOKEN_KEY)
const SLIPPAGE_BPS = 50

const redeemContext: RedeemPlanningContext = {
  config: wagmiConfig as Config,
  publicClient,
  account,
}

test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== MAINNET_CHAIN_ID, 'Mainnet-only E2E suite')

test.describe('Mainnet wstETH/WETH 2x redeem (JIT + LiFi)', () => {
  let baseSnapshot: Hash
  let sharesToRedeem: bigint
  let collateralAsset: `0x${string}`
  let payoutAsset: `0x${string}` | undefined

  test.beforeAll(async () => {
    const chainId = await publicClient.getChainId()
    if (chainId !== MAINNET_CHAIN_ID) test.skip()
    baseSnapshot = await takeSnapshot()
  })

  test.beforeEach(async () => {
    await revertSnapshot(baseSnapshot)
    baseSnapshot = await takeSnapshot()

    const setup = await ensureRedeemSetup({
      ctx: redeemContext,
      tokenDefinition: leverageTokenDefinition,
      slippageBps: SLIPPAGE_BPS,
    })
    sharesToRedeem = setup.sharesToRedeem
    collateralAsset = setup.collateralAsset
    payoutAsset = setup.payoutAsset
  })

  test.afterEach(async () => {
    await revertSnapshot(baseSnapshot)
  })

  test('redeems via modal using LiFi route', async ({ page }) => {
    test.setTimeout(120_000)

    const { plan } = await planRedeemTest({
      ctx: redeemContext,
      tokenDefinition: leverageTokenDefinition,
      sharesToRedeem,
      slippageBps: SLIPPAGE_BPS,
    })
    expect(plan.sharesToRedeem).toBe(sharesToRedeem)

    const tokenBalanceBefore = await readLeverageTokenBalance()
    const collateralBalanceBefore = await readErc20Balance(collateralAsset)
    const payoutAddress = payoutAsset ?? collateralAsset

    await page.goto('/#/tokens', { waitUntil: 'domcontentloaded' })
    const connectButton = page.getByTestId('connect-mock')
    if (await connectButton.isVisible()) {
      await connectButton.click()
      await expect(connectButton).toBeHidden({ timeout: 5_000 })
    }

    await page.goto(`/#/tokens/${MAINNET_CHAIN_ID}/${leverageTokenAddress}`)
    await expect(page).toHaveURL(
      new RegExp(`/#/tokens/${MAINNET_CHAIN_ID}/${leverageTokenAddress}`, 'i'),
    )

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
    // Wait until the quote/plan is ready (button stops showing Calculating)
    await expect(primaryAction).not.toHaveText(/Calculating/i, { timeout: 60_000 })
    await expect(primaryAction).toBeEnabled({ timeout: 15_000 })
    const primaryLabel = (await primaryAction.innerText()) ?? ''
    await primaryAction.click()

    const confirmHeading = page.getByRole('heading', { name: 'Confirm Redemption' })
    if (/Approve/i.test(primaryLabel)) {
      await expect(confirmHeading).toBeVisible({ timeout: 20_000 })
    } else {
      await expect(confirmHeading).toBeVisible()
    }
    await page.getByRole('button', { name: 'Confirm Redemption' }).click()

    await expect(page.getByRole('heading', { name: 'Processing Redemption' })).toBeVisible()
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

test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== mainnet.id, 'Mainnet-only E2E suite')
