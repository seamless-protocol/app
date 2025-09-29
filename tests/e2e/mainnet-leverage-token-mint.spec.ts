import { expect, test } from '@playwright/test'
import { erc20Abi, type Hash } from 'viem'
import { mainnet } from 'viem/chains'
import type { Config } from 'wagmi'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { account, publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'
import { topUpErc20, topUpNative } from '../shared/funding'
import {
  ensureMintLiquidity,
  type MintPlanningContext,
  planMintTest,
} from '../shared/scenarios/mint'
import { wagmiConfig } from '../shared/wagmi'

// Mainnet Tenderly VNet configuration for cbBTC/USDC 2x
const MAINNET_CHAIN_ID = mainnet.id
const TOKEN_KEY = 'cbbtc-usdc-2x'
const leverageTokenDefinition = getLeverageTokenDefinition('tenderly', TOKEN_KEY)
const leverageTokenAddress = getLeverageTokenAddress('tenderly', TOKEN_KEY)

// cbBTC address on mainnet
const CBBTC_ADDRESS = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' as `0x${string}`
const MINT_AMOUNT = '0.01' // Minimum mint amount for cbBTC

const mintPlanningContext: MintPlanningContext = {
  config: wagmiConfig as Config,
  publicClient,
}

test.describe('Mainnet leverage token mint flow', () => {
  let snapshotId: Hash

  test.beforeEach(async () => {
    // Skip if not running against mainnet Tenderly VNet
    const chainId = await publicClient.getChainId()
    if (chainId !== MAINNET_CHAIN_ID) {
      test.skip()
    }

    snapshotId = await takeSnapshot()
    await ensureMintLiquidity({
      ctx: mintPlanningContext,
      tokenDefinition: leverageTokenDefinition,
      equityAmountHuman: MINT_AMOUNT,
    })
    await topUpNative(account.address, '5')
    await topUpErc20(CBBTC_ADDRESS, account.address, '1')
  })

  test.afterEach(async () => {
    await revertSnapshot(snapshotId)
  })

  test('mints cbBTC/USDC leverage tokens through the modal', async ({ page }) => {
    test.setTimeout(120_000)

    const { plan } = await planMintTest({
      ctx: mintPlanningContext,
      tokenDefinition: leverageTokenDefinition,
      equityAmountHuman: MINT_AMOUNT,
    })
    const balanceBefore = await readLeverageTokenBalance()

    await page.goto('/#/tokens')
    await page.waitForLoadState('networkidle')

    // Connect mock wallet if needed
    const connectButton = page.getByTestId('connect-mock')
    if (await connectButton.isVisible()) {
      await connectButton.click()
      await expect(connectButton).toBeHidden({ timeout: 5_000 })
      await expect(page.getByTestId('connected-address')).toBeVisible({ timeout: 15_000 })
    }

    await page.goto(`/#/tokens/${MAINNET_CHAIN_ID}/${leverageTokenAddress}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(
      new RegExp(`/#/tokens/${MAINNET_CHAIN_ID}/${leverageTokenAddress}`, 'i'),
    )

    // Open the mint modal
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
