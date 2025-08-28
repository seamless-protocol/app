/**
 * Utility functions for formatting numbers, currency, percentages, and other display values
 */

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
  } = {},
): string {
  const { includeDollarSign = false, decimals = 1 } = options
  const prefix = includeDollarSign ? '$' : ''

  if (value >= 1000000) {
    return `${prefix}${(value / 1000000).toFixed(decimals)}M`
  }
  if (value >= 1000) {
    return `${prefix}${(value / 1000).toFixed(decimals)}K`
  }
  return `${prefix}${value.toLocaleString()}`
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
    isDecimal?: boolean
  } = {},
): string {
  const { decimals = 2, showSign = false, isDecimal = false } = options
  const percentage = isDecimal ? value * 100 : value
  const sign = showSign && percentage >= 0 ? '+' : ''
  return `${sign}${percentage.toFixed(decimals)}%`
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
  return `${points.toLocaleString()}/day`
}

/**
 * Get CSS classes for risk level styling
 * @param riskLevel - The risk level string
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

/**
 * Format a large number with appropriate suffixes
 * @param value - The number to format
 * @param decimals - Number of decimal places
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(decimals)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`
  }
  return value.toLocaleString()
}
