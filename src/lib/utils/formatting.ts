/**
 * Utility functions for formatting numbers, currency, percentages, and other display values
 */
import { formatUnits } from 'viem'

/**
 * Format a number as currency with appropriate suffixes (K, M)
 * @param value - The number to format
 * @param options - Formatting options
 */
export function formatCurrency(
  value: number,
  options: {
    includeDollarSign?: boolean
    decimals?: number
    millionDecimals?: number
    thousandDecimals?: number
  } = {},
): string {
  const {
    includeDollarSign = true,
    decimals = 0,
    millionDecimals = 2,
    thousandDecimals = 0,
  } = options
  const prefix = includeDollarSign ? '$' : ''

  if (value >= 1000000) {
    return `${prefix}${(value / 1000000).toFixed(millionDecimals)}M`
  }
  if (value >= 1000) {
    return `${prefix}${(value / 1000).toFixed(thousandDecimals)}K`
  }
  return `${prefix}${value.toFixed(decimals)}`
}

/**
 * Format a number as a percentage
 * @param value - The number to format (as decimal or percentage)
 * @param options - Formatting options
 */
export function formatPercentage(
  value: number,
  options: {
    decimals?: number
    showSign?: boolean
  } = {},
): string {
  const { decimals = 1, showSign = true } = options
  const percentage = value * 100
  const sign = showSign && percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(decimals)}%`
}

/**
 * Format a price from bigint (wei) to USD string
 * @param price - The price in wei (bigint)
 * @param decimals - Number of decimal places
 */
export function formatPrice(price: bigint, decimals: number = 2): string {
  return `$${(Number(price) / 1e18).toFixed(decimals)}`
}

/**
 * Format APY percentage (convenience function for formatPercentage)
 * @param apy - The APY value to format
 * @param decimals - Number of decimal places
 */
export function formatAPY(apy: number, decimals: number = 2): string {
  return formatPercentage(apy, { decimals })
}

/**
 * Format points with appropriate suffix
 * @param points - The points value to format
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString('en-US')} x`
}

/**
 * Get CSS classes for risk level styling
 * @param riskLevel - The risk level string
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'low':
      return 'bg-[var(--tag-success-bg)] text-[var(--tag-success-text)] border-[color-mix(in_srgb,var(--tag-success-text)_30%,transparent)]'
    case 'medium':
      return 'bg-[var(--tag-warning-bg)] text-[var(--tag-warning-text)] border-[color-mix(in_srgb,var(--tag-warning-text)_30%,transparent)]'
    case 'high':
      return 'bg-[var(--tag-error-bg)] text-[var(--tag-error-text)] border-[color-mix(in_srgb,var(--tag-error-text)_30%,transparent)]'
    default:
      return 'bg-[var(--tag-neutral-bg)] text-[var(--tag-neutral-text)] border-[color-mix(in_srgb,var(--tag-neutral-text)_20%,transparent)]'
  }
}

/**
 * Format a large number with appropriate suffixes and smart decimal handling
 * @param value - The number to format
 * @param options - Formatting options
 */
export function formatNumber(
  value: number,
  options: {
    decimals?: number
    thousandDecimals?: number
    millionDecimals?: number
    billionDecimals?: number
  } = {},
): string {
  const { decimals = 0, thousandDecimals = 2, millionDecimals = 1, billionDecimals = 1 } = options

  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(billionDecimals)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(millionDecimals)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(thousandDecimals)}K`
  }

  // Smart decimal handling for small amounts
  if (value > 0) {
    // For any non-zero value, avoid showing 0.00
    const formatted = value.toFixed(decimals)
    if (formatted === '0.00' && value > 0) {
      // If the value is positive but rounds to 0.00, show the actual value with more precision
      // Find the minimum number of decimals needed to show a non-zero value
      let precision = decimals
      while (precision < 8 && value.toFixed(precision) === '0.00') {
        precision++
      }
      return value.toFixed(precision)
    }
    return formatted
  } else {
    // For zero or negative values, show as is
    return value.toFixed(decimals)
  }
}

/**
 * Format a token amount from base units (bigint) to a fixed-decimal string with rounding.
 * Caller chooses display precision; defaults to 6.
 * Uses string-based rounding to preserve precision from formatUnits without Number conversion.
 */
export function formatTokenAmountFromBase(
  value: bigint | undefined,
  decimals: number,
  displayDecimals: number = 6,
): string {
  if (typeof value !== 'bigint') return '0'

  // Use formatUnits directly without Number conversion to preserve precision
  const formatted = formatUnits(value, decimals)

  // Find decimal point to split integer and fractional parts
  const dotIndex = formatted.indexOf('.')

  if (dotIndex === -1) {
    // No decimal point, whole number
    if (displayDecimals === 0) {
      return formatted
    }
    return `${formatted}.${'0'.repeat(displayDecimals)}`
  }

  let integerPart = formatted.slice(0, dotIndex)
  const decimalPart = formatted.slice(dotIndex + 1)

  if (displayDecimals === 0) {
    // Round to integer: check first decimal digit
    const firstDecimal = decimalPart[0]
    if (firstDecimal && Number.parseInt(firstDecimal, 10) >= 5) {
      return (BigInt(integerPart) + 1n).toString()
    }
    return integerPart
  }

  // Get the decimals we want to keep
  let resultDecimals = decimalPart.slice(0, displayDecimals)

  // Check if we need to round up (look at the next digit after our cutoff)
  const nextDigit = decimalPart[displayDecimals]
  if (nextDigit && Number.parseInt(nextDigit, 10) >= 5) {
    // Use BigInt for exact arithmetic on long fractional parts
    const incremented = (BigInt(resultDecimals || '0') + 1n).toString()

    // If increment produced an extra digit, carry into the integer part
    if (incremented.length > displayDecimals) {
      integerPart = (BigInt(integerPart) + 1n).toString()
      resultDecimals = '0'.repeat(displayDecimals)
    } else {
      resultDecimals = incremented.padStart(displayDecimals, '0')
    }
  }

  // Pad with zeros if needed
  resultDecimals = resultDecimals.padEnd(displayDecimals, '0')
  return `${integerPart}.${resultDecimals}`
}
