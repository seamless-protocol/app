import type { MintContext, MintParams, MintResult } from './types'

/**
 * mintWithRouter: slice 1 placeholder implementation.
 * - Intentionally throws so callers do not accidentally trigger writes before slice 2.
 * - The function is present for API stability and test coverage of the exported shape.
 */
export async function mintWithRouter(_ctx: MintContext, _params: MintParams): Promise<MintResult> {
  throw new Error('mintWithRouter is not implemented in slice 1 (structure only).')
}
