import { useCallback, useMemo, useState } from 'react'
import { parseUnits } from 'viem'

export function useMintForm(params: {
  decimals: number
  walletBalanceFormatted: string // display string like '12.3456'
  minAmountFormatted?: string // e.g. '0.01'
}) {
  const { decimals, walletBalanceFormatted, minAmountFormatted = '0.01' } = params

  const [amount, setAmount] = useState('')

  const amountRaw = useMemo(() => {
    const n = Number(amount)
    if (!amount || !Number.isFinite(n) || n <= 0) return undefined
    try {
      return parseUnits(amount, decimals)
    } catch {
      return undefined
    }
  }, [amount, decimals])

  const walletBalanceNum = useMemo(
    () => Number(walletBalanceFormatted || '0'),
    [walletBalanceFormatted],
  )
  const minAmountNum = useMemo(() => Number(minAmountFormatted || '0'), [minAmountFormatted])

  const isAmountValid = useMemo(() => {
    const n = Number(amount || '0')
    return Number.isFinite(n) && n > 0
  }, [amount])

  const hasBalance = useMemo(() => {
    const n = Number(amount || '0')
    return Number.isFinite(n) && n <= walletBalanceNum + 1e-12
  }, [amount, walletBalanceNum])

  const minAmountOk = useMemo(() => {
    const n = Number(amount || '0')
    return Number.isFinite(n) && n >= minAmountNum
  }, [amount, minAmountNum])

  const onAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value)
  }, [])

  const onPercent = useCallback(
    (pct: number) => {
      const n = Math.max(0, Math.min(100, pct))
      const next = ((walletBalanceNum * n) / 100).toFixed(6)
      setAmount(next)
    },
    [walletBalanceNum],
  )

  return {
    amount,
    setAmount,
    amountRaw,
    isAmountValid,
    hasBalance,
    minAmountOk,
    onAmountChange,
    onPercent,
  }
}
