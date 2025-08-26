/**
 * Utility functions for generating consistent colors for assets
 */

/**
 * Generate a consistent color for any asset/token symbol using hash-based approach
 * @param symbol - The asset symbol (e.g., 'WETH', 'USDC', 'XYZ')
 * @returns Tailwind CSS color class
 */
export function getAssetColor(symbol: string): string {
  // Use a simple hash-based approach for consistent colors
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-orange-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
  ]
  return colors[hash % colors.length] || 'bg-blue-500'
}

/**
 * Get the best available color for an asset
 * @param symbol - The asset symbol
 * @returns Tailwind CSS color class
 */
export function getBestAssetColor(symbol: string): string {
  return getAssetColor(symbol)
}
