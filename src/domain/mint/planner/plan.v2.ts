/**
 * Planner for V2 single-tx mint.
 *
 * Builds optional user-input->collateral conversion and the debt->collateral swap, then
 * re-previews the manager state with total collateral to ensure repayability.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import {
  BASE_WETH,
  ETH_SENTINEL,
  getContractAddresses,
  type SupportedChainId,
} from '@/lib/contracts/addresses'
import {
  // V2 reads
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewDeposit,
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'
import { applySlippageFloor, mulDivFloor } from './math'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling in tests/VNet)
type TokenArg = Address
type EquityInInputAssetArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>
type V2Call = RouterV2Call

// Base WETH native path support
const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction mint.
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
   * The sequence always includes the debt->collateral swap plus an ERC-20 approve
   * when the debt asset is not the wrapped native token; if `inputAsset` differs
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
  /** Optional explicit LeverageManagerV2 address (for VNet/custom) */
  managerAddress?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<MintPlanV2> {
  const {
    config,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    managerAddress,
    chainId,
  } = params

  const { collateralAsset, debtAsset } = await getManagerAssets({
    config,
    token,
    chainId,
    ...(managerAddress ? { managerAddress } : {}),
  })

  // Enforce collateral-only input in initial scope
  const calls: V2Calls = []
  if (getAddress(inputAsset) !== getAddress(collateralAsset)) {
    throw new Error('Router v2 initial scope requires collateral-only input')
  }
  const userCollateralOut = equityInInputAsset

  // Ideal preview based on user's collateral only
  const idealPreview = await readLeverageRouterV2PreviewDeposit(config, {
    args: [token, userCollateralOut],
    chainId: chainId as SupportedChainId,
  })
  const ideal = {
    targetCollateral: idealPreview.collateral,
    idealDebt: idealPreview.debt,
    idealShares: idealPreview.shares,
  }
  const neededFromDebtSwap = ideal.targetCollateral - userCollateralOut
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  // Size the debt leg and quote swap parameters (prefer exact-out when available)
  // Prefer native-path (unwrap WETH->ETH) when the debt asset is the chain's WETH.
  // Important: do not rely on Base's WETH constant for other chains.
  const chainWeth = (getContractAddresses(chainId).tokens?.weth as Address | undefined) ?? BASE_WETH
  const useNativeDebtPath = getAddress(debtAsset) === getAddress(chainWeth)
  const inTokenForQuote = useNativeDebtPath ? ETH_SENTINEL : debtAsset
  const { debtIn, debtQuote } = await sizeDebtToCollateralSwap({
    idealDebt: ideal.idealDebt,
    neededOut: neededFromDebtSwap,
    inToken: inTokenForQuote,
    outToken: collateralAsset,
    quote: quoteDebtToCollateral,
  })

  // Compute total collateral to be added (user + swap out). The manager's deposit logic
  // reasons about total collateral to size the final debt.
  const totalCollateral = userCollateralOut + debtQuote.out

  // Final preview should use the manager with total collateral to size required debt.
  const managerPreview = await readLeverageManagerV2PreviewDeposit(config, {
    args: [token, totalCollateral],
    chainId: chainId as SupportedChainId,
  })
  const requiredDebt = managerPreview.debt
  const finalShares = managerPreview.shares

  // Ensure flash loan (debtIn) does not exceed requiredDebt; clamp and re-quote if needed.
  let effectiveDebtIn = debtIn
  let effectiveQuote = debtQuote
  if (effectiveDebtIn > requiredDebt) {
    const adjustedDebtIn = requiredDebt
    const reclamped = await requoteForAdjustedDebt({
      adjustedDebtIn,
      inToken: inTokenForQuote,
      outToken: collateralAsset,
      quote: quoteDebtToCollateral,
    })
    effectiveDebtIn = reclamped.debtIn
    effectiveQuote = reclamped.debtQuote
  }

  // Build calls based on the amount actually used for the swap
  calls.push(
    ...buildDebtSwapCalls({
      debtAsset,
      debtQuote: effectiveQuote,
      debtIn: effectiveDebtIn,
      useNative: useNativeDebtPath,
    }),
  )

  const minShares = applySlippageFloor(finalShares, slippageBps)
  const excessDebt = requiredDebt > effectiveDebtIn ? requiredDebt - effectiveDebtIn : 0n

  return {
    inputAsset,
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    minShares,
    expectedShares: finalShares,
    expectedDebt: effectiveDebtIn,
    expectedTotalCollateral: userCollateralOut + effectiveQuote.out,
    expectedExcessDebt: excessDebt,
    calls,
  }
}

// Helpers — defined below the main function for clarity

/**
 * Size the debt flash loan and quote the debt->collateral swap.
 * Prefers exact-out (when adapter supports it) and falls back to exact-in refinement.
 */
export async function sizeDebtToCollateralSwap(args: {
  idealDebt: bigint
  neededOut: bigint
  inToken: Address
  outToken: Address
  quote: QuoteFn
}): Promise<{ debtIn: bigint; debtQuote: Quote }> {
  const { idealDebt, neededOut, inToken, outToken, quote } = args
  let debtIn = idealDebt

  // Try exact-out fast path
  let debtQuote: Quote
  try {
    debtQuote = await quote({
      inToken,
      outToken,
      amountIn: debtIn,
      amountOut: neededOut,
      intent: 'exactOut',
    })
    if (debtQuote.out >= neededOut && typeof debtQuote.maxIn === 'bigint') {
      return { debtIn: debtQuote.maxIn, debtQuote }
    }
  } catch {
    // Ignore and fall back to exact-in refinement below
  }

  // Fallback: refine exact-in against non-linear quotes
  debtQuote = await quote({ inToken, outToken, amountIn: debtIn })
  if (debtQuote.out >= neededOut) return { debtIn, debtQuote }

  const MAX_REFINES = 6
  for (let i = 0; i < MAX_REFINES; i++) {
    const adjusted = mulDivFloor(debtIn, debtQuote.out, neededOut)
    if (adjusted >= debtIn || adjusted === 0n) break
    debtIn = adjusted
    debtQuote = await quote({ inToken, outToken, amountIn: debtIn })
    if (debtQuote.out >= neededOut) break
  }
  return { debtIn, debtQuote }
}

/**
 * Re-quote for a reduced flash loan amount when the manager preview debt is lower
 * than the planned flash loan.
 */
export async function requoteForAdjustedDebt(args: {
  adjustedDebtIn: bigint
  inToken: Address
  outToken: Address
  quote: QuoteFn
}): Promise<{ debtIn: bigint; debtQuote: Quote }> {
  const { adjustedDebtIn, inToken, outToken, quote } = args
  const debtIn = adjustedDebtIn
  const debtQuote = await quote({ inToken, outToken, amountIn: debtIn })
  return { debtIn, debtQuote }
}

async function getManagerAssets(args: {
  config: Config
  token: TokenArg
  managerAddress?: Address
  chainId: number
}) {
  const { config, token, chainId } = args
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
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
      {
        target: debtQuote.approvalTarget,
        data: debtQuote.calldata,
        value: debtIn,
      },
    ]
  }
  // ERC20-in path: approve router for debt asset then perform swap
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
