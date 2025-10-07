import { expect, test } from '@playwright/test'
import { erc20Abi } from 'viem'
import { mainnet } from 'viem/chains'
import type { Config } from 'wagmi'
import { getLeverageTokenAddress, getLeverageTokenDefinition } from '../fixtures/addresses'
import { account, publicClient, revertSnapshot, takeSnapshot } from '../shared/clients'
import { type MintPlanningContext, planMintTest } from '../shared/scenarios/mint'
import { wagmiConfig } from '../shared/wagmi'

const MAINNET_CHAIN_ID = mainnet.id
const TOKEN_KEY = 'wsteth-eth-2x'
const leverageTokenDefinition = getLeverageTokenDefinition('tenderly', TOKEN_KEY)
const leverageTokenAddress = getLeverageTokenAddress('tenderly', TOKEN_KEY)

const mintPlanningContext: MintPlanningContext = {
  config: wagmiConfig as Config,
  publicClient,
}

// Mainnet-only E2E
test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== MAINNET_CHAIN_ID, 'Mainnet-only E2E suite')

test.describe('Mainnet wstETH/ETH 2x mint (JIT + LiFi)', () => {
  let snapshotId: `0x${string}`

  test.beforeEach(async () => {
    const chainId = await publicClient.getChainId()
    if (chainId !== MAINNET_CHAIN_ID) test.skip()
    snapshotId = await takeSnapshot()
  })

  test.afterEach(async () => {
    await revertSnapshot(snapshotId)
  })

  test('mints via modal using LiFi route', async ({ page }) => {
    test.setTimeout(120_000)

    const { plan } = await planMintTest({
      ctx: mintPlanningContext,
      tokenDefinition: leverageTokenDefinition,
      equityAmountHuman: '0.1',
    })

    const balanceBefore = await readLeverageTokenBalance()

    await page.goto('/#/tokens', { waitUntil: 'domcontentloaded' })
    const connect = page.getByTestId('connect-mock')
    if (await connect.isVisible()) {
      await connect.click()
      await expect(connect).toBeHidden({ timeout: 10_000 })
    }

    await page.goto(`/#/tokens/${MAINNET_CHAIN_ID}/${leverageTokenAddress}`)

    const mintButton = page.getByRole('button', { name: /^Mint$/ })
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

    const balanceAfter = await readLeverageTokenBalance()
    expect(balanceAfter - balanceBefore >= plan.minShares).toBeTruthy()
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

// Ensure suite only runs on mainnet (Tenderly) backends
test.skip(Number(process.env['E2E_CHAIN_ID'] ?? '0') !== mainnet.id, 'Mainnet-only E2E suite')
