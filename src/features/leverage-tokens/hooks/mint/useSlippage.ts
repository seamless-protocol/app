import { useMemo, useState } from 'react'
import { DEFAULT_SLIPPAGE_BPS } from '@/domain/mint/constants'

export function useSlippage(initial: string = '0.5') {
  const [slippage, setSlippage] = useState<string>(initial)
  const slippageBps = useMemo(() => {
    const pct = Number(slippage || '0')
    if (!Number.isFinite(pct) || pct < 0) return DEFAULT_SLIPPAGE_BPS
    return Math.min(10_000, Math.max(0, Math.round(pct * 100)))
  }, [slippage])

  return { slippage, setSlippage, slippageBps }
}
