import type { Address, Hex, PublicClient } from 'viem'
import { encodeFunctionData, erc20Abi } from 'viem'
import { getCollateralAsset, getDebtAsset } from './manager'
import { mulDivFloor } from './math'
import { previewMint } from './previewMint'
import type { QuoteFn } from './types'

/**
 * Planned inputs and calls for a V2 single-tx mint.
 * Invariants:
 * - If input != collateral, include an input->collateral conversion (approve + call).
 * - Always include a debt->collateral swap sized to cover required collateral.
 * - Repayability is asserted by previewing with the total collateral.
 */
export type MintPlanV2 = {
  inputAsset: Address
  equityInInputAsset: bigint
  collateralAsset: Address
  debtAsset: Address
  minShares: bigint
  expectedShares: bigint
  expectedDebt: bigint
  expectedTotalCollateral: bigint
  expectedExcessDebt: bigint
  calls: Array<{ target: Address; data: Hex; value: bigint }>
}

/**
 * Builds the `calls` array and expectations for a V2 mint.
 * Requires a debt->collateral quote function. An input->collateral quote function is required
 * only when the user input asset differs from the token's collateral asset.
 */
export async function planMintV2(params: {
  publicClient: PublicClient
  router: Address
  manager: Address
  token: Address
  inputAsset: Address
  equityInInputAsset: bigint
  slippageBps: number
  quoteDebtToCollateral: QuoteFn
  quoteInputToCollateral?: QuoteFn
}): Promise<MintPlanV2> {
  const {
    publicClient,
    manager,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    quoteInputToCollateral,
  } = params

  const collateralAsset = await getCollateralAsset(publicClient, manager, token)
  const debtAsset = await getDebtAsset(publicClient, manager, token)

  let userCollateralOut = equityInInputAsset
  const calls: Array<{ target: Address; data: Hex; value: bigint }> = []

  if (inputAsset.toLowerCase() !== collateralAsset.toLowerCase()) {
    if (!quoteInputToCollateral) throw new Error('Router v2: no converter for selected input asset')
    const q = await quoteInputToCollateral({
      inToken: inputAsset,
      outToken: collateralAsset,
      amountIn: equityInInputAsset,
    })
    calls.push({
      target: inputAsset,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [q.approvalTarget, equityInInputAsset],
      }),
      value: 0n,
    })
    calls.push({ target: q.approvalTarget, data: q.calldata, value: 0n })
    userCollateralOut = q.out
  }

  const rp = await previewMint({ publicClient }, manager, token, userCollateralOut)

  const neededFromDebtSwap = rp.collateral - userCollateralOut
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  let debtIn = rp.debt
  let dq = await quoteDebtToCollateral({
    inToken: debtAsset,
    outToken: collateralAsset,
    amountIn: debtIn,
  })
  if (dq.out < neededFromDebtSwap) {
    debtIn = mulDivFloor(rp.debt, dq.out, neededFromDebtSwap)
    dq = await quoteDebtToCollateral({
      inToken: debtAsset,
      outToken: collateralAsset,
      amountIn: debtIn,
    })
  }

  const totalCollateral = userCollateralOut + dq.out
  const mp = await previewMint({ publicClient }, manager, token, totalCollateral)
  if (mp.debt < debtIn) throw new Error('Reprice: manager preview debt < planned flash loan')
  const minShares = (mp.shares * BigInt(10_000 - slippageBps)) / 10_000n
  const excessDebt = mp.debt > debtIn ? mp.debt - debtIn : 0n

  calls.push({
    target: debtAsset,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [dq.approvalTarget, debtIn],
    }),
    value: 0n,
  })
  calls.push({ target: dq.approvalTarget, data: dq.calldata, value: 0n })

  return {
    inputAsset,
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    minShares,
    expectedShares: mp.shares,
    expectedDebt: mp.debt,
    expectedTotalCollateral: totalCollateral,
    expectedExcessDebt: excessDebt,
    calls,
  }
}
