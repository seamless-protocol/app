import type { AllowanceResult, MintContext, MintParams } from './types'

/**
 * checkAllowance: slice 1 placeholder implementation.
 * - No approvals are attempted; we just report allowance as true to unblock flow wiring later.
 */
export async function checkAllowance(
  _ctx: MintContext,
  _params: MintParams,
): Promise<AllowanceResult> {
  return { hasAllowance: true }
}
