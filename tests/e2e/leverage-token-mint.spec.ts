import { expect, test } from '@playwright/test'
import { erc20Abi } from 'viem'
import { TOKEN_AMOUNT_DISPLAY_DECIMALS } from '@/features/leverage-tokens/constants'
import { formatTokenAmountFromBase } from '@/lib/utils/formatting'
import {
  ADDR,
  account,
  DEFAULT_CHAIN_ID,
  LEVERAGE_TOKEN_ADDRESS,
  LEVERAGE_TOKEN_KEY,
  LEVERAGE_TOKEN_LABEL,
  mode,
  publicClient,
  revertSnapshot,
  TOKEN_SOURCE,
  takeSnapshot,
} from '../shared/clients'
import { LEVERAGE_TOKEN_DEFINITION } from '../shared/env'
import { topUpErc20, topUpNative } from '../shared/funding'
import { runMintTest } from '../shared/scenarios/mint'

const ENABLE_FLOW_TESTS = process.env['E2E_ENABLE_FLOW_TESTS'] === '1'
const chainId = process.env['E2E_CHAIN_ID'] ?? String(DEFAULT_CHAIN_ID)
const tokenSource = (process.env['E2E_TOKEN_SOURCE'] ?? TOKEN_SOURCE).toLowerCase()
const tokenKey = process.env['E2E_LEVERAGE_TOKEN_KEY'] ?? LEVERAGE_TOKEN_KEY
const leverageTokenAddress = (process.env['E2E_LEVERAGE_TOKEN_ADDRESS'] ??
  LEVERAGE_TOKEN_ADDRESS) as `0x${string}`
const leverageTokenLabel = process.env['E2E_LEVERAGE_TOKEN_LABEL'] ?? LEVERAGE_TOKEN_LABEL
const MINT_AMOUNT = '1'

type MintScenarioContext = {
  expectedShares: bigint
  minShares: bigint
  expectedDisplay: string
}

let mintScenario: MintScenarioContext | undefined

// Skip suite unless explicitly enabled
if (!ENABLE_FLOW_TESTS) {
  test.describe.skip('Leverage token mint flow', () => {
    // Intentionally empty
  })
} else {
  test.describe('Leverage token mint flow', () => {
    test.beforeAll(async () => {
      const scenario = await runMintTest({
        tokenDefinition: LEVERAGE_TOKEN_DEFINITION,
        equityAmountHuman: MINT_AMOUNT,
      })

      if (scenario.orchestration.routerVersion !== 'v2') {
        throw new Error('Mint scenario expected router v2 orchestration')
      }

      const decimals = Number(
        await publicClient.readContract({
          address: leverageTokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      )

      const expectedDisplay = formatTokenAmountFromBase(
        scenario.orchestration.plan.expectedShares,
        decimals,
        TOKEN_AMOUNT_DISPLAY_DECIMALS,
      )

      mintScenario = {
        expectedShares: scenario.orchestration.plan.expectedShares,
        minShares: scenario.orchestration.plan.minShares,
        expectedDisplay,
      }
    })

    test('mints leverage tokens through the modal', async ({ page }) => {
      test.setTimeout(120_000)

      if (!mintScenario) {
        throw new Error('Mint scenario did not initialize before test execution')
      }

      const snapshotId = await takeSnapshot()
      try {
        // Fund the mock wallet with gas and collateral
        await topUpNative(account.address, '5')
        await topUpErc20(ADDR.weeth, account.address, '50')

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

        await page.goto(`/#/tokens/${chainId}/${leverageTokenAddress}`)
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(
          new RegExp(`/#/tokens/${chainId}/${leverageTokenAddress}`, 'i'),
        )

        // Open the mint modal (button lives inside the holdings card when connected)
        const mintButton = page.getByRole('button', { name: /^Mint$/ })
        await expect(mintButton, 'Mint action should be visible').toBeVisible({ timeout: 15_000 })
        await mintButton.click()

        await expect(page.getByRole('heading', { name: 'Mint Leverage Token' })).toBeVisible()

        // Enter mint amount
        const amountInput = page.getByLabel('Mint Amount')
        await amountInput.fill(MINT_AMOUNT)

        // Wait for the primary action button to appear and become enabled
        const primaryAction = page.getByTestId('mint-primary-action')
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

        await expect(page.getByText(`${mintScenario.expectedDisplay} tokens`).first()).toBeVisible({
          timeout: 20_000,
        })

        // Confirm the mint
        await page.getByRole('button', { name: 'Confirm Mint' }).click()

        // Pending + success states
        await expect(page.getByRole('heading', { name: 'Processing Mint' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Mint Successful!' })).toBeVisible({
          timeout: 60_000,
        })

        await expect(
          page.getByText(
            `successfully minted into ${mintScenario.expectedDisplay} leverage tokens`,
            {
              exact: false,
            },
          ),
        ).toBeVisible()

        // Close out the modal
        await page.getByRole('button', { name: 'Done' }).click()
        await expect(mintButton).toBeVisible()

        const balanceAfter = await readLeverageTokenBalance()
        assertMintedShares(balanceBefore, balanceAfter, mintScenario)
      } finally {
        await revertSnapshot(snapshotId)
      }
    })
  })
}

// Provide context in logs about the selected token/back-end
if (ENABLE_FLOW_TESTS) {
  console.info('[E2E] Mint flow enabled', {
    backendMode: mode,
    tokenSource,
    tokenKey,
    leverageTokenAddress,
    leverageTokenLabel,
  })
}

async function readLeverageTokenBalance(): Promise<bigint> {
  return (await publicClient.readContract({
    address: leverageTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })) as bigint
}

function assertMintedShares(before: bigint, after: bigint, scenario: MintScenarioContext): void {
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
