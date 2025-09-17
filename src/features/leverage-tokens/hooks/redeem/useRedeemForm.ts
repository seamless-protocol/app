import { useCallback, useMemo, useState } from 'react'
import { parseUnits } from 'viem'

export function useRedeemForm(params: {
  leverageTokenConfig: {
    symbol: string
    name: string
    collateralAsset: {
      symbol: string
      name: string
      decimals: number
    }
  }
  leverageTokenBalanceFormatted: string
}) {
  const { leverageTokenConfig, leverageTokenBalanceFormatted } = params

  // Form state
  const [amount, setAmount] = useState('')

  // Handle amount input changes
  const onAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value)
  }, [])

  // Handle percentage shortcuts
  const onPercent = useCallback((pct: number, tokenBalance: string) => {
    const n = Math.max(0, Math.min(100, pct))
    const balance = parseFloat(tokenBalance)
    const next = ((balance * n) / 100).toFixed(6)
    setAmount(next)
  }, [])

  // Validation helpers
  const amountRaw = useMemo(() => {
    const n = Number(amount)
    if (!amount || !Number.isFinite(n) || n <= 0) return undefined
    try {
      return parseUnits(amount, leverageTokenConfig.collateralAsset.decimals)
    } catch {
      return undefined
    }
  }, [amount, leverageTokenConfig.collateralAsset.decimals])

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
    const minRedeem = 0.01 // Minimum redeem amount
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
