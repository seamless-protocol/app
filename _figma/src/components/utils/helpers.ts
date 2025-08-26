// Helper functions for formatting and utility operations

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toLocaleString()}`
}

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export const formatTokens = (value: number): string => {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`
}

export const getRiskColor = (risk: string): string => {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'high':
      return 'text-red-400 bg-red-400/10 border-red-400/20'
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'healthy':
    case 'passed':
      return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'warning':
    case 'pending':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'critical':
    case 'failed':
      return 'text-red-400 bg-red-400/10 border-red-400/20'
    case 'closed':
    case 'ended':
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Parameter Change':
      return 'bg-purple-600/20 text-purple-400'
    case 'Treasury':
      return 'bg-yellow-600/20 text-yellow-400'
    case 'New Feature':
      return 'bg-cyan-600/20 text-cyan-400'
    case 'Token Distribution':
      return 'bg-pink-600/20 text-pink-400'
    case 'Leverage':
      return 'bg-purple-600/20 text-purple-400'
    case 'Yield':
      return 'bg-green-600/20 text-green-400'
    case 'Portfolio':
      return 'bg-blue-600/20 text-blue-400'
    case 'Stable':
      return 'bg-yellow-600/20 text-yellow-400'
    case 'Layer2':
      return 'bg-cyan-600/20 text-cyan-400'
    case 'Trading':
      return 'bg-pink-600/20 text-pink-400'
    default:
      return 'bg-slate-600/20 text-slate-400'
  }
}

export const getTimeRemaining = (endTime: string): string => {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

export const truncateAddress = (address: string, start: number = 6, end: number = 4): string => {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return (value / total) * 100
}

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMs = now.getTime() - time.getTime()
  
  const minutes = Math.floor(diffInMs / (1000 * 60))
  const hours = Math.floor(diffInMs / (1000 * 60 * 60))
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export const generateRandomId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}