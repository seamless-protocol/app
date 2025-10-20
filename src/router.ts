import type { QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter } from '@tanstack/react-router'
import { queryClient } from '@/lib/config/query.config'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a hash history for IPFS compatibility
const hashHistory = createHashHistory()

// Create a new router instance
export const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { queryClient },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
    context: {
      queryClient: QueryClient
    }
  }
}
