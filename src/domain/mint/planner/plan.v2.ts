/**
 * Planner for V2 single-tx mint.
 *
 * Builds optional user-input->collateral conversion and the debt->collateral swap, then
 * re-previews the manager state with total collateral to ensure repayability.
 */
import type { Address } from 'viem'
import { encodeFunctionData, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import {
  // V2 reads (explicit address may be provided when using VNets/custom deployments)
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewMint,
} from '@/lib/contracts/generated'
import type { ManagerPort } from '../ports'
import { applySlippageFloor, mulDivFloor } from './math'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling in tests/VNet)
type TokenArg = Address
type EquityInInputAssetArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>
type V2Call = RouterV2Call

// Base WETH native path support
const BASE_WETH = '0x4200000000000000000000000000000000000006' as Address
const ETH_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address
const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

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
  // Prefer native path for Base WETH: withdraw -> aggregator with msg.value
  const useNativeDebtPath = getAddress(debtAsset) === getAddress(BASE_WETH)
  const inTokenForQuote = useNativeDebtPath ? ETH_SENTINEL : debtAsset
  let debtQuote = await quoteDebtToCollateral({
    inToken: inTokenForQuote,
    outToken: collateralAsset,
    amountIn: debtIn,
  })
  if (debtQuote.out < neededFromDebtSwap) {
    debtIn = mulDivFloor(ideal.idealDebt, debtQuote.out, neededFromDebtSwap)
    debtQuote = await quoteDebtToCollateral({
      inToken: inTokenForQuote,
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

  calls.push(...buildDebtSwapCalls({ debtAsset, debtQuote, debtIn, useNative: useNativeDebtPath }))

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

function buildDebtSwapCalls(args: {
  debtAsset: Address
  debtQuote: Quote
  debtIn: bigint
  useNative: boolean
}): Array<V2Call> {
  const { debtAsset, debtQuote, debtIn, useNative } = args
  if (useNative) {
    return [
      {
        target: debtAsset,
        data: encodeFunctionData({
          abi: WETH_WITHDRAW_ABI,
          functionName: 'withdraw',
          args: [debtIn],
        }),
        value: 0n,
      },
      { target: debtQuote.approvalTarget, data: debtQuote.calldata, value: debtIn },
    ]
  }
  // ERC20-in path: aggregator call only (router handles approvals internally)
  return [{ target: debtQuote.approvalTarget, data: debtQuote.calldata, value: 0n }]
}
