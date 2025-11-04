import { useCallback, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { MIN_REDEEM_AMOUNT_DISPLAY } from '../../constants'

export function useRedeemForm(params: {
  leverageTokenDecimals: number
  leverageTokenBalanceFormatted: string
}) {
  const { leverageTokenDecimals, leverageTokenBalanceFormatted } = params

  const [amount, setAmount] = useState('')

  const onAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value)
  }, [])

  const onPercent = useCallback(
    (pct: number, tokenBalance: string) => {
      const n = Math.max(0, Math.min(100, pct))
      try {
        const balanceRaw = parseUnits(tokenBalance || '0', leverageTokenDecimals)
        if (n === 100) {
          setAmount(tokenBalance)
          return
        }
        const amountRaw = (balanceRaw * BigInt(n)) / 100n
        const asUnits = formatUnits(amountRaw, leverageTokenDecimals)
        const [intPart, fracPart = ''] = asUnits.split('.')
        const formatted = `${intPart}.${fracPart.slice(0, 6).padEnd(6, '0')}`
        setAmount(formatted)
      } catch {
        setAmount('0')
      }
    },
    [leverageTokenDecimals],
  )

  const amountRaw = useMemo(() => {
    if (!amount || amount.trim() === '') return undefined
    try {
      const v = parseUnits(amount, leverageTokenDecimals)
      return v > 0n ? v : undefined
    } catch {
      return undefined
    }
  }, [amount, leverageTokenDecimals])

  const isAmountValid = useMemo(() => typeof amountRaw === 'bigint' && amountRaw > 0n, [amountRaw])

  const hasBalance = useMemo(() => {
    try {
      if (!amount || amount.trim() === '') return false
      const balanceRaw = parseUnits(leverageTokenBalanceFormatted || '0', leverageTokenDecimals)
      const amtRaw = parseUnits(amount, leverageTokenDecimals)
      return amtRaw <= balanceRaw
    } catch {
      return false
    }
  }, [amount, leverageTokenBalanceFormatted, leverageTokenDecimals])

  const minAmountOk = useMemo(() => {
    try {
      if (!amount || amount.trim() === '') return false
      const minRaw = parseUnits(MIN_REDEEM_AMOUNT_DISPLAY, leverageTokenDecimals)
      const amtRaw = parseUnits(amount, leverageTokenDecimals)
      return amtRaw >= minRaw
    } catch {
      return false
    }
  }, [amount, leverageTokenDecimals])

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
