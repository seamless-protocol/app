import { useMemo } from 'react'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { DEFAULT_SWAP_SLIPPAGE_PERCENT_DISPLAY } from '../../constants'

export function useSwapSlippage(tokenAddress: string, initial: string = '0.01') {
  const [swapSlippage, setSwapSlippage] = useLocalStorage<string>(
    `swap-slippage-${tokenAddress}`,
    initial,
  )

  const swapSlippageBps = useMemo(() => {
    // Accept common user inputs like "2" or "2%"; trim whitespace and a trailing % sign
    const raw = (swapSlippage ?? '0') as unknown as string
    const normalized = typeof raw === 'string' ? raw.trim().replace(/%$/, '') : String(raw)
    // Empty string is valid and means 0 slippage
    if (normalized === '') return 0
    // Validate: normalized must be parseable as a valid number
    const testParse = Number.parseFloat(normalized)
    if (!Number.isFinite(testParse)) return Number(DEFAULT_SWAP_SLIPPAGE_PERCENT_DISPLAY) * 100
    // Compute BPS by parsing at most two fractional digits without floating math
    const [intPartRaw = '0', fracRaw = ''] = normalized.split('.')
    const intDigits = intPartRaw.replace(/[^0-9-]/g, '') || '0'
    const intPart = Number.parseInt(intDigits, 10) || 0
    const fracTwo = `${fracRaw.replace(/[^0-9]/g, '')}00`.slice(0, 2)
    const fracPart = Number.parseInt(fracTwo || '0', 10) || 0
    let bps = intPart * 100 + fracPart
    if (!Number.isFinite(bps) || bps < 0) bps = Number(DEFAULT_SWAP_SLIPPAGE_PERCENT_DISPLAY) * 100
    const BPS_MAX = 10000 // 100% in basis points
    if (bps > BPS_MAX) bps = BPS_MAX
    return bps
  }, [swapSlippage])

  return { swapSlippage, setSwapSlippage, swapSlippageBps }
}
