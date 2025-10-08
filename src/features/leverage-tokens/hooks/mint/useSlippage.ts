import { useMemo } from 'react'
import { BPS_DENOMINATOR, DEFAULT_SLIPPAGE_BPS } from '@/domain/mint/utils/constants'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

export function useSlippage(initial: string = '0.5') {
  const [slippage, setSlippage] = useLocalStorage<string>('slippage-tolerance', initial)

  const slippageBps = useMemo(() => {
    // Accept common user inputs like "2" or "2%"; trim whitespace and a trailing % sign
    const raw = (slippage ?? '0') as unknown as string
    const normalized = typeof raw === 'string' ? raw.trim().replace(/%$/, '') : String(raw)
    const pct = Number(normalized || '0')
    if (!Number.isFinite(pct) || pct < 0) return DEFAULT_SLIPPAGE_BPS
    return Math.min(Number(BPS_DENOMINATOR), Math.max(0, Math.round(pct * 100)))
  }, [slippage])

  return { slippage, setSlippage, slippageBps }
}
