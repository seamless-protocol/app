import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

const DUMMY_CONFIG = {} as unknown as Config
const TOKEN = '0x0000000000000000000000000000000000000001' as Address
const COLLATERAL = '0x0000000000000000000000000000000000000002' as Address
const DEBT = '0x0000000000000000000000000000000000000003' as Address

// Minimal ManagerPort stub to drive scaling math
const managerPort = {
  async idealPreview({ userCollateral }: { token: Address; userCollateral: bigint }) {
    return {
      targetCollateral: userCollateral * 2n,
      idealDebt: 4_463_830_821n,
      idealShares: 1_000_000_000_000_000_000n,
    }
  },
  async finalPreview({ totalCollateral }: { token: Address; totalCollateral: bigint }) {
    // Return a previewed debt comfortably above the scaled flash loan amount
    return {
      previewDebt: 4_460_000_000n,
      previewShares: (totalCollateral * 997_010_445_737_461_631n) / 1_994_020_891_474_923_263n,
    }
  },
}

// Patch manager getters via dynamic import mocking pattern (local override)
vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerV2GetLeverageTokenCollateralAsset: () => COLLATERAL,
  readLeverageManagerV2GetLeverageTokenDebtAsset: () => DEBT,
}))

describe('planner scaling under underfill', () => {
  it('scales flash loan when quotedOut < neededFromSwap', async () => {
    // User brings 1.0 collateral
    const equityInInputAsset = 1_000_000_000_000_000_000n

    // Quote function that underfills first, then matches scaled amount
    let first = true
    const quoteDebtToCollateral = async (_args: {
      inToken: Address
      outToken: Address
      amountIn: bigint
    }) => {
      if (first) {
        first = false
        // Initial quote out: 0.997357108403566456 collateral
        return {
          out: 997_357_108_403_566_456n,
          approvalTarget: '0x0000000000000000000000000000000000000004' as Address,
          calldata: '0x',
        }
      }
      // After scaling, final quote out: 0.994020891474923263 collateral
      return {
        out: 994_020_891_474_923_263n,
        approvalTarget: '0x0000000000000000000000000000000000000004' as Address,
        calldata: '0x',
      }
    }

    const plan = await planMintV2({
      config: DUMMY_CONFIG,
      token: TOKEN,
      inputAsset: COLLATERAL,
      equityInInputAsset,
      slippageBps: 50,
      quoteDebtToCollateral: quoteDebtToCollateral as any,
      managerPort: managerPort as any,
      chainId: 8453,
    })

    expect(plan.expectedTotalCollateral).toBe(1_994_020_891_474_923_263n)
    expect(plan.expectedDebt >= 4_450_453_945n).toBe(true)
    expect(plan.minShares > 0n).toBe(true)
  })
})
