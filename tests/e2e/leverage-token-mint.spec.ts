import { expect, test } from '@playwright/test'
import { erc20Abi, type Hash } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import {
  ADDR,
  account,
  DEFAULT_CHAIN_ID,
  LEVERAGE_TOKEN_ADDRESS,
  publicClient,
  revertSnapshot,
  takeSnapshot,
} from '../shared/clients'
import { LEVERAGE_TOKEN_DEFINITION } from '../shared/env'
import { topUpErc20, topUpNative } from '../shared/funding'
import {
  ensureMintLiquidity,
  type MintPlanningContext,
  planMintTest,
} from '../shared/scenarios/mint'
import { wagmiConfig } from '../shared/wagmi'

const { E2E_CHAIN_ID, E2E_LEVERAGE_TOKEN_ADDRESS } = process.env
const chainId = E2E_CHAIN_ID ?? `${DEFAULT_CHAIN_ID}`
const leverageTokenAddress = (E2E_LEVERAGE_TOKEN_ADDRESS ?? LEVERAGE_TOKEN_ADDRESS) as `0x${string}`
const MINT_AMOUNT = '1'
const mintPlanningContext: MintPlanningContext = {
  config: wagmiConfig as Config,
  publicClient,
}

test.describe('Leverage token mint flow', () => {
  let snapshotId: Hash

  test.beforeEach(async () => {
    snapshotId = await takeSnapshot()
    await ensureMintLiquidity({
      ctx: mintPlanningContext,
      tokenDefinition: LEVERAGE_TOKEN_DEFINITION,
      equityAmountHuman: MINT_AMOUNT,
    })
    await topUpNative(account.address, '5')
    await topUpErc20(ADDR.weeth, account.address, '50')
  })

  test.afterEach(async () => {
    await revertSnapshot(snapshotId)
  })

  test('mints leverage tokens through the modal', async ({ page }) => {
    test.setTimeout(120_000)

    const { plan } = await planMintTest({
      ctx: mintPlanningContext,
      tokenDefinition: LEVERAGE_TOKEN_DEFINITION,
      equityAmountHuman: MINT_AMOUNT,
    })
    const balanceBefore = await readLeverageTokenBalance()

    await page.goto('/#/tokens', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')

    // Connect mock wallet if needed
    const connectButton = page.getByTestId('connect-mock')
    if (await connectButton.isVisible()) {
      await connectButton.click()
      await expect(connectButton).toBeHidden({ timeout: 5_000 })
      await expect(page.getByTestId('connected-address')).toBeVisible({ timeout: 15_000 })
    }

    await page.goto(`/#/tokens/${chainId}/${leverageTokenAddress}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(new RegExp(`/#/tokens/${chainId}/${leverageTokenAddress}`, 'i'))

    // Open the mint modal (button lives inside the holdings card when connected)
    const mintButton = page.getByRole('button', { name: /^Mint$/ })
    await expect(mintButton, 'Mint action should be visible').toBeVisible({ timeout: 15_000 })
    await mintButton.click()

    const modal = page.getByRole('dialog', { name: 'Mint Leverage Token' })
    await expect(modal).toBeVisible()

    // Enter mint amount
    const amountInput = modal.getByLabel('Mint Amount')
    await amountInput.fill(MINT_AMOUNT)

    // Wait for the primary action button to appear and become enabled
    const primaryAction = modal.getByRole('button', {
      name: /(Approve|Mint|Enter an amount)/i,
    })
    await expect(primaryAction).toBeVisible({ timeout: 15_000 })
    await expect(primaryAction).toBeEnabled({ timeout: 15_000 })

    const primaryLabel = (await primaryAction.innerText()) ?? ''
    await primaryAction.click()

    // Approval step may render if allowance missing
    const confirmHeading = page.getByRole('heading', { name: 'Confirm Mint' })
    if (/Approve/i.test(primaryLabel)) {
      await expect(confirmHeading).toBeVisible({ timeout: 20_000 })
    } else {
      await expect(confirmHeading).toBeVisible()
    }

    // Confirm the mint
    await page.getByRole('button', { name: 'Confirm Mint' }).click()

    // Pending + success states
    await expect(page.getByRole('heading', { name: 'Processing Mint' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mint Successful!' })).toBeVisible({
      timeout: 60_000,
    })

    const successSummary = await page.getByText(/has been successfully minted into/i).innerText()
    expect(successSummary).toMatch(/has been successfully minted into/i)

    // Close out the modal
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(mintButton).toBeVisible()

    const balanceAfter = await readLeverageTokenBalance()
    assertMintedShares(balanceBefore, balanceAfter, {
      expectedShares: plan.expectedShares,
      minShares: plan.minShares,
    })
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

function assertMintedShares(
  before: bigint,
  after: bigint,
  scenario: { expectedShares: bigint; minShares: bigint },
): void {
  const mintedShares = after - before
  expect(mintedShares > 0n).toBeTruthy()
  expect(mintedShares >= scenario.minShares).toBeTruthy()

  const delta =
    mintedShares >= scenario.expectedShares
      ? mintedShares - scenario.expectedShares
      : scenario.expectedShares - mintedShares
  const tolerance = scenario.expectedShares / 100n || 1n
  expect(delta <= tolerance).toBeTruthy()
}
// Skip when not running against Base canonical chain
test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== base.id, 'Base-only E2E suite')
