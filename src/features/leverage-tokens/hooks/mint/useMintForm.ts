import { useCallback, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { TOKEN_AMOUNT_DISPLAY_DECIMALS } from '../../constants'

export function useMintForm(params: {
  decimals: number
  walletBalanceFormatted: string // display string like '12.3456'
  minAmountFormatted?: string // e.g. '0.01' (pass from MIN_MINT_AMOUNT_DISPLAY)
  currentSupply?: number | undefined // current leverage token supply
  supplyCap?: number | undefined // leverage token supply cap
}) {
  const {
    decimals,
    walletBalanceFormatted,
    minAmountFormatted = '0.01',
    currentSupply,
    supplyCap,
  } = params

  const [amount, setAmount] = useState('')

  const amountRaw = useMemo(() => {
    if (!amount || amount.trim() === '') return undefined
    try {
      const v = parseUnits(amount, decimals)
      return v > 0n ? v : undefined
    } catch {
      return undefined
    }
  }, [amount, decimals])

  const walletBalanceRaw = useMemo(() => {
    try {
      return parseUnits(walletBalanceFormatted || '0', decimals)
    } catch {
      return 0n
    }
  }, [walletBalanceFormatted, decimals])

  const minAmountRaw = useMemo(() => {
    try {
      return parseUnits(minAmountFormatted || '0', decimals)
    } catch {
      return 0n
    }
  }, [minAmountFormatted, decimals])

  const isAmountValid = useMemo(() => typeof amountRaw === 'bigint' && amountRaw > 0n, [amountRaw])

  const hasBalance = useMemo(() => {
    if (typeof amountRaw !== 'bigint') return false
    return amountRaw > 0n && amountRaw <= walletBalanceRaw
  }, [amountRaw, walletBalanceRaw])

  const minAmountOk = useMemo(() => {
    if (typeof amountRaw !== 'bigint') return false
    return amountRaw >= minAmountRaw
  }, [amountRaw, minAmountRaw])

  const supplyCapOk = useMemo(() => {
    if (!supplyCap) return true
    if (typeof currentSupply !== 'number') return true
    const n = typeof amount === 'string' && amount.trim() !== '' ? parseFloat(amount) : NaN
    if (!Number.isFinite(n) || n <= 0) return true
    return currentSupply + n <= supplyCap
  }, [amount, currentSupply, supplyCap])

  const onAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value)
  }, [])

  const onPercent = useCallback(
    (pct: number) => {
      const n = Math.max(0, Math.min(100, pct))
      try {
        const walletRaw = parseUnits(walletBalanceFormatted || '0', decimals)
        if (n === 100) {
          setAmount(walletBalanceFormatted)
        } else {
          const nextRaw = (walletRaw * BigInt(n)) / 100n
          const asUnits = formatUnits(nextRaw, decimals)
          const [intPart, fracPart = ''] = asUnits.split('.')
          const formatted = `${intPart}.${fracPart
            .slice(0, TOKEN_AMOUNT_DISPLAY_DECIMALS)
            .padEnd(TOKEN_AMOUNT_DISPLAY_DECIMALS, '0')}`
          setAmount(formatted)
        }
      } catch {
        setAmount('0')
      }
    },
    [decimals, walletBalanceFormatted],
  )
  return {
    amount,
    setAmount,
    amountRaw,
    isAmountValid,
    hasBalance,
    minAmountOk,
    supplyCapOk,
    onAmountChange,
    onPercent,
  }
}
