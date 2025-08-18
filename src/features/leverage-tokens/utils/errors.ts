/**
 * Leverage token error types for proper classification and handling
 */
export type LeverageTokenError =
  | { type: 'STALE_ORACLE'; lastUpdate: number }
  | { type: 'REBALANCING_IN_PROGRESS'; estimatedCompletion?: number }
  | { type: 'INSUFFICIENT_LIQUIDITY'; available: bigint; required: bigint }
  | { type: 'INSUFFICIENT_BALANCE'; available: bigint; required: bigint }
  | { type: 'USER_REJECTED'; code: 4001 }
  | { type: 'CHAIN_MISMATCH'; expected: number; actual: number }
  | { type: 'UNKNOWN'; message: string; originalError?: unknown }

/**
 * Classify errors into actionable types
 * User errors (4001, 4902) should not be sent to Sentry
 */
export function classifyError(e: unknown): LeverageTokenError {
  const error = e as any
  
  // User rejected transaction
  if (error?.code === 4001 || error?.cause?.code === 4001) {
    return { type: 'USER_REJECTED', code: 4001 }
  }
  
  // Chain not added to wallet
  if (error?.code === 4902 || error?.cause?.code === 4902) {
    return { 
      type: 'CHAIN_MISMATCH', 
      expected: error?.expectedChainId || 0, 
      actual: error?.actualChainId || 0 
    }
  }
  
  // Contract revert reasons
  if (error?.reason || error?.data?.message) {
    const reason = error.reason || error.data.message
    
    if (reason.includes('StaleOracle')) {
      return { 
        type: 'STALE_ORACLE', 
        lastUpdate: Date.now() - 3600000 // Default to 1 hour ago
      }
    }
    
    if (reason.includes('RebalancingInProgress')) {
      return { 
        type: 'REBALANCING_IN_PROGRESS',
        estimatedCompletion: Date.now() + 300000 // Default to 5 minutes
      }
    }
    
    if (reason.includes('InsufficientLiquidity')) {
      return {
        type: 'INSUFFICIENT_LIQUIDITY',
        available: 0n,
        required: 0n
      }
    }
    
    if (reason.includes('InsufficientBalance') || reason.includes('ERC20: transfer amount exceeds balance')) {
      return {
        type: 'INSUFFICIENT_BALANCE',
        available: 0n,
        required: 0n
      }
    }
  }
  
  // Default to unknown
  return { 
    type: 'UNKNOWN', 
    message: error?.message || 'An unknown error occurred',
    originalError: e
  }
}

/**
 * Check if an error should be sent to Sentry
 * User errors and expected conditions should not be tracked
 */
export function isActionableError(error: LeverageTokenError): boolean {
  return error.type !== 'USER_REJECTED' && 
         error.type !== 'CHAIN_MISMATCH' &&
         error.type !== 'INSUFFICIENT_BALANCE'
}