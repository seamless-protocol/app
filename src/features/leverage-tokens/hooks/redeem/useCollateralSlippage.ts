import { useMemo } from 'react'
import { DEFAULT_SHARE_SLIPPAGE_BPS } from '@/domain/shared/adapters/helpers'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

export function useCollateralSlippage(tokenAddress: string, initial: string = '0.5') {
  const [collateralSlippage, setCollateralSlippage] = useLocalStorage<string>(
    `collateral-slippage-${tokenAddress}`,
    initial,
  )

  const collateralSlippageBps = useMemo(() => {
    // Accept common user inputs like "2" or "2%"; trim whitespace and a trailing % sign
    const raw = (collateralSlippage ?? '0') as unknown as string
    const normalized = typeof raw === 'string' ? raw.trim().replace(/%$/, '') : String(raw)
    // Empty string is valid and means 0 slippage
    if (normalized === '') return 0
    // Validate: normalized must be parseable as a valid number
    const testParse = Number.parseFloat(normalized)
    if (!Number.isFinite(testParse)) return DEFAULT_SHARE_SLIPPAGE_BPS
    // Compute BPS by parsing at most two fractional digits without floating math
    const [intPartRaw = '0', fracRaw = ''] = normalized.split('.')
    const intDigits = intPartRaw.replace(/[^0-9-]/g, '') || '0'
    const intPart = Number.parseInt(intDigits, 10) || 0
    const fracTwo = `${fracRaw.replace(/[^0-9]/g, '')}00`.slice(0, 2)
    const fracPart = Number.parseInt(fracTwo || '0', 10) || 0
    let bps = intPart * 100 + fracPart
    if (!Number.isFinite(bps) || bps < 0) bps = DEFAULT_SHARE_SLIPPAGE_BPS
    const BPS_MAX = 10000 // 100% in basis points
    if (bps > BPS_MAX) bps = BPS_MAX
    return bps
  }, [collateralSlippage])

  return { collateralSlippage, setCollateralSlippage, collateralSlippageBps }
}
