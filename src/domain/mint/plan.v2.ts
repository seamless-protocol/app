/**
 * Planner for V2 single-tx mint.
 *
 * Builds optional user-input->collateral conversion and the debt->collateral swap, then
 * re-previews the manager state with total collateral to ensure repayability.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress } from 'viem'
import type { Config } from 'wagmi'
import {
  // V2 reads (explicit address may be provided when using VNets/custom deployments)
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewMint,
} from '@/lib/contracts/generated'
import { applySlippageFloor, mulDivFloor } from './math'
import type { ManagerPort } from './ports'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling in tests/VNet)
type TokenArg = Address
type EquityInInputAssetArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>
type V2Call = RouterV2Call

/**
 * Structured plan for executing a single-transaction mint via the V2 router.
 *
 * Fields prefixed with "expected" are derived from LeverageManager.previewMint and
 * are used to size swaps and to provide UI expectations. "minShares" is a
 * slippage-adjusted floor used for the on-chain mint call.
 */
export type MintPlanV2 = {
  /** User-selected input asset (can differ from collateral). */
  inputAsset: Address
  /** Equity amount denominated in the input asset. */
  equityInInputAsset: EquityInInputAssetArg
  /** Token's collateral asset as reported by the manager. */
  collateralAsset: Address
  /** Token's debt asset as reported by the manager. */
  debtAsset: Address
  /** Minimum acceptable shares after applying `slippageBps` against expected shares. */
  minShares: bigint
  /** Shares expected from preview with total collateral (user + swap output). */
  expectedShares: bigint
  /** Debt expected from preview with total collateral (prior to flash loan payback). */
  expectedDebt: bigint
  /** Total collateral expected (user out + debt->collateral swap out). */
  expectedTotalCollateral: bigint
  /** Excess debt (if previewed debt exceeds the flash loan amount sized by the quote). */
  expectedExcessDebt: bigint
  /**
   * Encoded router calls (approve + swap) to be submitted to V2 `mintWithCalls`.
   * The sequence always includes the debt->collateral swap; if `inputAsset` differs
   * from `collateralAsset`, it also includes an input->collateral approval and swap.
   */
  calls: V2Calls
}

/**
 * Builds the minimal set of encoded calls and expectations to perform a V2 mint in a single transaction.
 *
 * Behavior
 * - Reads collateral/debt assets from the manager.
 * - If `inputAsset != collateralAsset`, adds an input->collateral approval + swap using `quoteInputToCollateral`.
 * - Always adds a debt->collateral approval + swap using `quoteDebtToCollateral` sized to cover the previewed need.
 * - Re-previews the manager with total collateral to compute `minShares` and validate repayability.
 *
 * Flow
 * - Fetch the token's collateral and debt assets from the manager.
 * - If the user's input asset differs from the collateral, plan an input→collateral
 *   approval and swap, and compute how much collateral the user contributes.
 * - Preview the mint using only the user-contributed collateral to determine how much
 *   additional collateral must come from the debt swap.
 * - Size the flash debt and obtain a debt→collateral swap quote sufficient to cover
 *   the missing collateral (re-quoting if needed).
 * - Preview again with the total collateral (user + swap output) to compute a
 *   slippage-adjusted minShares and to validate the flash loan is repayable.
 * - Append the debt-leg approval and swap calls, then return the complete plan.
 *
 * Errors
 * - Throws when `inputAsset != collateralAsset` but `quoteInputToCollateral` is not provided.
 * - Throws when preview indicates no debt swap is required (unexpected for V2 path).
 * - Throws when reprice indicates previewed debt < planned flash loan amount.
 *
 * @param params.config Wagmi Config for chain resolution and contract reads
 * @param params.token Leverage token address
 * @param params.inputAsset User-selected input asset
 * @param params.equityInInputAsset Equity amount denominated in the input asset
 * @param params.slippageBps Slippage in basis points applied to `expectedShares` to compute `minShares`
 * @param params.quoteDebtToCollateral Required quote fn for debt->collateral swap
 * @param params.quoteInputToCollateral Optional quote fn for input->collateral swap when input differs from collateral
 * @returns MintPlanV2 containing encoded calls and expected outcomes used by execute V2
 */
export async function planMintV2(params: {
  config: Config
  token: TokenArg
  inputAsset: Address
  equityInInputAsset: EquityInInputAssetArg
  slippageBps: number
  quoteDebtToCollateral: QuoteFn
  /** ManagerPort used for ideal/final previews (v2 router or v1-style manager fallback) */
  managerPort?: ManagerPort
  /** Optional explicit LeverageManagerV2 address (for VNet/custom) */
  managerAddress?: Address
}): Promise<MintPlanV2> {
  const {
    config,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    managerPort,
    managerAddress,
  } = params

  const { collateralAsset, debtAsset } = await getManagerAssets({
    config,
    token,
    ...(managerAddress ? { managerAddress } : {}),
  })

  // Enforce collateral-only input in initial scope
  const calls: V2Calls = []
  if (getAddress(inputAsset) !== getAddress(collateralAsset)) {
    throw new Error('Router v2 initial scope requires collateral-only input')
  }
  const userCollateralOut = equityInInputAsset

  // Ideal preview based on user's collateral only
  const ideal = managerPort
    ? await managerPort.idealPreview({ token, userCollateral: userCollateralOut })
    : await (async () => {
        const r = await readLeverageManagerV2PreviewMint(config, {
          ...(managerAddress ? { address: managerAddress } : {}),
          args: [token, userCollateralOut],
        })
        return { targetCollateral: r.collateral, idealDebt: r.debt, idealShares: r.shares }
      })()
  const neededFromDebtSwap = ideal.targetCollateral - userCollateralOut
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  // Size debt leg and quote
  let debtIn = ideal.idealDebt
  let debtQuote = await quoteDebtToCollateral({
    inToken: debtAsset,
    outToken: collateralAsset,
    amountIn: debtIn,
  })
  if (debtQuote.out < neededFromDebtSwap) {
    debtIn = mulDivFloor(ideal.idealDebt, debtQuote.out, neededFromDebtSwap)
    debtQuote = await quoteDebtToCollateral({
      inToken: debtAsset,
      outToken: collateralAsset,
      amountIn: debtIn,
    })
  }

  const totalCollateral = userCollateralOut + debtQuote.out
  const final = managerPort
    ? await managerPort.finalPreview({ token, totalCollateral })
    : await (async () => {
        const r = await readLeverageManagerV2PreviewMint(config, {
          ...(managerAddress ? { address: managerAddress } : {}),
          args: [token, totalCollateral],
        })
        return { previewDebt: r.debt, previewShares: r.shares }
      })()
  if (final.previewDebt < debtIn)
    throw new Error('Reprice: manager preview debt < planned flash loan')

  const minShares = applySlippageFloor(final.previewShares, slippageBps)
  const excessDebt: bigint = final.previewDebt > debtIn ? final.previewDebt - debtIn : 0n

  calls.push(...buildDebtSwapCalls({ debtAsset, debtQuote, debtIn }))

  return {
    inputAsset,
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    minShares,
    expectedShares: final.previewShares,
    expectedDebt: final.previewDebt,
    expectedTotalCollateral: totalCollateral,
    expectedExcessDebt: excessDebt,
    calls,
  }
}

// Helpers — defined below the main function for clarity

async function getManagerAssets(args: {
  config: Config
  token: TokenArg
  managerAddress?: Address
}) {
  const { config, token, managerAddress } = args
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token],
  })
  return { collateralAsset, debtAsset }
}

// Removed input conversion for initial scope per PRD

// planDebtSwap inlined into main flow using ideal preview values

// minShares computation centralized via applySlippageFloor in math.ts

function buildDebtSwapCalls(args: {
  debtAsset: Address
  debtQuote: Quote
  debtIn: bigint
}): Array<V2Call> {
  const { debtAsset, debtQuote, debtIn } = args
  return [
    {
      target: debtAsset,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [debtQuote.approvalTarget, debtIn],
      }),
      value: 0n,
    },
    { target: debtQuote.approvalTarget, data: debtQuote.calldata, value: 0n },
  ]
}
