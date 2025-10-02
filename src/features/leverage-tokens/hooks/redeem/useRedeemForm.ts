import { useCallback, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { MIN_REDEEM_AMOUNT_DISPLAY } from '../../constants'

export function useRedeemForm(params: {
  leverageTokenDecimals: number
  leverageTokenBalanceFormatted: string
}) {
  const { leverageTokenDecimals, leverageTokenBalanceFormatted } = params

  // Form state
  const [amount, setAmount] = useState('')

  // Handle amount input changes
  const onAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value)
  }, [])

  // Handle percentage shortcuts (MAX uses exact balance; others floor in base units)
  const onPercent = useCallback(
    (pct: number, tokenBalance: string) => {
      const n = Math.max(0, Math.min(100, pct))
      try {
        const balanceRaw = parseUnits(tokenBalance || '0', leverageTokenDecimals)
        if (n === 100) {
          // Use exact wallet balance string for MAX
          setAmount(tokenBalance)
          return
        }
        // Floor via integer math in base units
        const amountRaw = (balanceRaw * BigInt(n)) / 100n
        const asUnits = formatUnits(amountRaw, leverageTokenDecimals)
        const [intPart, fracPart = ''] = asUnits.split('.')
        const formatted = `${intPart}.${fracPart.slice(0, 6).padEnd(6, '0')}`
        setAmount(formatted)
      } catch {
        // Fallback to float math (legacy behavior)
        const balance = parseFloat(tokenBalance)
        const next = ((balance * n) / 100).toFixed(6)
        setAmount(next)
      }
    },
    [leverageTokenDecimals],
  )

  // Validation helpers
  const amountRaw = useMemo(() => {
    const n = Number(amount)
    if (!amount || !Number.isFinite(n) || n <= 0) return undefined
    try {
      return parseUnits(amount, leverageTokenDecimals)
    } catch {
      return undefined
    }
  }, [amount, leverageTokenDecimals])

  const isAmountValid = useMemo(() => {
    const n = Number(amount || '0')
    return Number.isFinite(n) && n > 0
  }, [amount])

  const hasBalance = useMemo(() => {
    const inputAmount = parseFloat(amount)
    const balance = parseFloat(leverageTokenBalanceFormatted)
    return Number.isFinite(inputAmount) && inputAmount <= balance + 1e-12
  }, [amount, leverageTokenBalanceFormatted])

  const minAmountOk = useMemo(() => {
    const inputAmount = parseFloat(amount)
    const minRedeem = parseFloat(MIN_REDEEM_AMOUNT_DISPLAY)
    return Number.isFinite(inputAmount) && inputAmount >= minRedeem
  }, [amount])

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
