/** Shared debug utilities for planners. */

// Test/dev-aware logger (no-op unless enabled)
export function debugMintPlan(label: string, data: Record<string, unknown>): void {
  try {
    const testMode = typeof process !== 'undefined' && !!process.env && !!process.env['TEST_MODE']
    const viteFlag =
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, unknown> })?.env?.[
        'VITE_MINT_PLAN_DEBUG'
      ] === '1'
    const nodeFlag = typeof process !== 'undefined' && process.env?.['MINT_PLAN_DEBUG'] === '1'
    const lsFlag = (() => {
      try {
        return (
          typeof window !== 'undefined' && window?.localStorage?.getItem('mint-plan-debug') === '1'
        )
      } catch {
        return false
      }
    })()
    const shouldLog = testMode || viteFlag || nodeFlag || lsFlag
    if (!shouldLog) return
    // eslint-disable-next-line no-console
    console.info('[Mint][Plan][Debug]', label, sanitizeBigints(data))
  } catch {
    // ignore
  }
}

function sanitizeBigints(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'bigint') out[k] = v.toString()
    else out[k] = v as unknown
  }
  return out
}
