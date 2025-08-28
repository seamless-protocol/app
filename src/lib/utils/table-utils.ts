/**
 * Utility functions for table sorting, filtering, and data manipulation
 */

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: string
  direction: SortDirection
}

/**
 * Generic sorting function for arrays of objects
 * @param data - Array of objects to sort
 * @param sortConfig - Sort configuration
 * @param customValueExtractor - Optional custom function to extract sort value
 */
export function sortData<T>(
  data: Array<T>,
  sortConfig: SortConfig,
  customValueExtractor?: (item: T, key: string) => unknown,
): Array<T> {
  return [...data].sort((a, b) => {
    let aValue: unknown
    let bValue: unknown

    if (customValueExtractor) {
      aValue = customValueExtractor(a, sortConfig.key)
      bValue = customValueExtractor(b, sortConfig.key)
    } else {
      aValue = (a as Record<string, unknown>)[sortConfig.key]
      bValue = (b as Record<string, unknown>)[sortConfig.key]
    }

    if (aValue == null || bValue == null) return 0

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }

    return 0
  })
}

/**
 * Parse sort string format like "apy-desc" into SortConfig
 * @param sortString - Sort string in format "key-direction"
 */
export function parseSortString(sortString: string): SortConfig {
  const [key, direction] = sortString.split('-') as [string, SortDirection]
  return { key, direction: direction || 'asc' }
}

/**
 * Toggle sort direction for a given key
 * @param currentConfig - Current sort configuration
 * @param newKey - Key to sort by
 */
export function toggleSortDirection(currentConfig: SortConfig, newKey: string): SortConfig {
  if (currentConfig.key === newKey) {
    return {
      key: newKey,
      direction: currentConfig.direction === 'asc' ? 'desc' : 'asc',
    }
  }
  return { key: newKey, direction: 'asc' }
}

/**
 * Generic text search filter
 * @param items - Array of items to filter
 * @param searchQuery - Search query string
 * @param searchFields - Function that returns searchable text for an item
 */
export function filterBySearch<T>(
  items: Array<T>,
  searchQuery: string,
  searchFields: (item: T) => Array<string>,
): Array<T> {
  if (!searchQuery.trim()) return items

  const query = searchQuery.toLowerCase()
  return items.filter((item) =>
    searchFields(item).some((field) => field.toLowerCase().includes(query)),
  )
}

/**
 * Filter items by a specific field value
 * @param items - Array of items to filter
 * @param fieldPath - Dot notation path to the field (e.g., "asset.symbol")
 * @param value - Value to filter by
 * @param allValue - Value that represents "show all" (default: 'all')
 */
export function filterByField<T>(
  items: Array<T>,
  fieldPath: string,
  value: string,
  allValue: string = 'all',
): Array<T> {
  if (value === allValue) return items

  return items.filter((item) => {
    const fieldValue = getNestedValue(item, fieldPath)
    return fieldValue === value
  })
}

/**
 * Get nested value from object using dot notation
 * @param obj - Object to extract value from
 * @param path - Dot notation path (e.g., "user.profile.name")
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce(
      (current: unknown, key: string) =>
        current && typeof current === 'object' && current !== null
          ? (current as Record<string, unknown>)[key]
          : undefined,
      obj,
    )
}

/**
 * Filter items by numeric range
 * @param items - Array of items to filter
 * @param fieldPath - Path to numeric field
 * @param range - Range string like "1-5" or "10+"
 * @param allValue - Value that represents "show all"
 */
export function filterByRange<T>(
  items: Array<T>,
  fieldPath: string,
  range: string,
  allValue: string = 'all',
): Array<T> {
  if (range === allValue) return items

  return items.filter((item) => {
    const value = getNestedValue(item, fieldPath)
    if (typeof value !== 'number') return false

    if (range.endsWith('+')) {
      const min = parseInt(range.slice(0, -1), 10)
      return value >= min
    }

    const parts = range.split('-').map(Number)
    const min = parts[0]
    const max = parts[1]

    if (min !== undefined && max !== undefined) {
      return value >= min && value <= max
    }

    return false
  })
}

/**
 * Count items that match a specific field value
 * @param items - Array of items to count
 * @param fieldPath - Path to field
 * @param value - Value to count
 */
export function countByField<T>(items: Array<T>, fieldPath: string, value: string): number {
  return items.filter((item) => getNestedValue(item, fieldPath) === value).length
}

/**
 * Get unique values from a field across all items
 * @param items - Array of items
 * @param fieldPath - Path to field
 */
export function getUniqueValues<T>(items: Array<T>, fieldPath: string): Array<string> {
  const values = items.map((item) => getNestedValue(item, fieldPath))
  return Array.from(new Set(values)).filter(
    (value): value is string => typeof value === 'string' && Boolean(value),
  )
}
