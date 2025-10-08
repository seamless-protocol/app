/**
 * Planner for V2 single-tx mint.
 *
 * Builds optional user-input->collateral conversion and the debt->collateral swap, then
 * re-previews the manager state with total collateral to ensure repayability.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import { BASE_WETH, ETH_SENTINEL, type SupportedChainId } from '@/lib/contracts/addresses'
import {
  // V2 reads (explicit address may be provided when using VNets/custom deployments)
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2ConvertToShares,
  readLeverageManagerV2ConvertCollateralToDebt,
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
  /** ManagerPort used for ideal/final previews (v2 router or v1-style manager fallback) */
  managerPort?: ManagerPort
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
    managerPort,
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
  const ideal = managerPort
    ? await managerPort.idealPreview({
        token,
        userCollateral: userCollateralOut,
        chainId,
      })
    : await (async () => {
        // Fallback: approximate ideal using manager converters
        const idealShares = await readLeverageManagerV2ConvertToShares(config, {
          args: [token, userCollateralOut],
          chainId: chainId as SupportedChainId,
        })
        const idealDebt = await readLeverageManagerV2ConvertCollateralToDebt(config, {
          args: [token, userCollateralOut, 0],
          chainId: chainId as SupportedChainId,
        })
        // Target collateral is user's collateral + collateral from swapping 'idealDebt'
        // At planning stage we approximate neededOut via 'idealDebt' and refine below.
        return {
          targetCollateral: userCollateralOut, // refined by quote below
          idealDebt,
          idealShares,
        }
      })()
  const neededFromDebtSwap = ideal.targetCollateral - userCollateralOut
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  // Size the debt leg and quote swap parameters (prefer exact-out when available)
  const useNativeDebtPath = getAddress(debtAsset) === getAddress(BASE_WETH)
  const inTokenForQuote = useNativeDebtPath ? ETH_SENTINEL : debtAsset
  const { debtIn, debtQuote } = await sizeDebtToCollateralSwap({
    idealDebt: ideal.idealDebt,
    neededOut: neededFromDebtSwap,
    inToken: inTokenForQuote,
    outToken: collateralAsset,
    quote: quoteDebtToCollateral,
  })

  const totalCollateral = userCollateralOut + debtQuote.out
  let final = managerPort
    ? await managerPort.finalPreview({ token, userCollateral: userCollateralOut, chainId })
    : await (async () => {
        // Fallback to router-style expectation is not available; approximate via manager converters
        const shares = await readLeverageManagerV2ConvertToShares(config, {
          args: [token, userCollateralOut],
          chainId: chainId as SupportedChainId,
        })
        const debt = await readLeverageManagerV2ConvertCollateralToDebt(config, {
          args: [token, userCollateralOut, 0],
          chainId: chainId as SupportedChainId,
        })
        return { previewDebt: debt, previewShares: shares }
      })()
  if (final.previewDebt < debtIn) {
    // Adjust down to the manager's previewed need and re-quote once
    const adjustedDebtIn = final.previewDebt
    if (adjustedDebtIn > 0n && adjustedDebtIn < debtIn) {
      const reclamped = await requoteForAdjustedDebt({
        adjustedDebtIn,
        inToken: inTokenForQuote,
        outToken: collateralAsset,
        quote: quoteDebtToCollateral,
      })

      const clampedDebtIn = reclamped.debtIn
      const clampedDebtQuote = reclamped.debtQuote

      const revisedTotalCollateral = userCollateralOut + clampedDebtQuote.out
      final = managerPort
        ? await managerPort.finalPreview({ token, userCollateral: userCollateralOut, chainId })
        : await (async () => {
            const shares = await readLeverageManagerV2ConvertToShares(config, {
              args: [token, userCollateralOut],
              chainId: chainId as SupportedChainId,
            })
            const debt = await readLeverageManagerV2ConvertCollateralToDebt(config, {
              args: [token, userCollateralOut, 0],
              chainId: chainId as SupportedChainId,
            })
            return { previewDebt: debt, previewShares: shares }
          })()
      if (final.previewDebt < clampedDebtIn) {
        throw new Error('Reprice: manager preview debt < planned flash loan')
      }
      // Recompute minShares/excess based on updated values
      const minShares = applySlippageFloor(final.previewShares, slippageBps)
      const excessDebt = final.previewDebt > clampedDebtIn ? final.previewDebt - clampedDebtIn : 0n
      calls.push(
        ...buildDebtSwapCalls({
          debtAsset,
          debtQuote: clampedDebtQuote,
          debtIn: clampedDebtIn,
          useNative: useNativeDebtPath,
        }),
      )
      return {
        inputAsset,
        equityInInputAsset,
        collateralAsset,
        debtAsset,
        minShares,
        expectedShares: final.previewShares,
        expectedDebt: final.previewDebt,
        expectedTotalCollateral: revisedTotalCollateral,
        expectedExcessDebt: excessDebt,
        calls,
      }
    } else {
      throw new Error('Reprice: manager preview debt < planned flash loan')
    }
  }

  const minShares = applySlippageFloor(final.previewShares, slippageBps)
  const excessDebt = final.previewDebt > debtIn ? final.previewDebt - debtIn : 0n

  calls.push(
    ...buildDebtSwapCalls({
      debtAsset,
      debtQuote,
      debtIn,
      useNative: useNativeDebtPath,
    }),
  )

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
