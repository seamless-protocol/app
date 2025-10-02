import { useCallback, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { TOKEN_AMOUNT_DISPLAY_DECIMALS } from '../../constants'

export function useMintForm(params: {
  decimals: number
  walletBalanceFormatted: string // display string like '12.3456'
  minAmountFormatted?: string // e.g. '0.01' (pass from MIN_MINT_AMOUNT_DISPLAY)
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
    if (!amount || amount === '') return false
    const n = Number(amount)
    return Number.isFinite(n) && n > 0 && n <= walletBalanceNum + 1e-12
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
      try {
        const walletRaw = parseUnits(walletBalanceFormatted || '0', decimals)
        if (n === 100) {
          // For MAX, show the exact wallet balance (match redeem behavior)
          setAmount(walletBalanceFormatted)
        } else {
          // For other percentages, floor in base units and format to display precision
          const amountRaw = (walletRaw * BigInt(n)) / 100n
          const asUnits = formatUnits(amountRaw, decimals)
          const [intPart, fracPart = ''] = asUnits.split('.')
          const formatted = `${intPart}.${fracPart.slice(0, TOKEN_AMOUNT_DISPLAY_DECIMALS).padEnd(TOKEN_AMOUNT_DISPLAY_DECIMALS, '0')}`
          setAmount(formatted)
        }
      } catch {
        const next = ((walletBalanceNum * n) / 100).toFixed(TOKEN_AMOUNT_DISPLAY_DECIMALS)
        setAmount(next)
      }
    },
    [decimals, walletBalanceFormatted, walletBalanceNum],
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
