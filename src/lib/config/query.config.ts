import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - recommended by Wagmi docs
      // Let Wagmi handle staleTime per query type (default is 0)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          // Don't retry on user rejections or expected errors
          if (error.message.includes('User rejected')) return false
          if (error.message.includes('Chain mismatch')) return false
          if (error.message.includes('Connector not found')) return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
