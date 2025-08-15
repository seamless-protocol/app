import { createHashHistory, createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a hash history for IPFS compatibility
const hashHistory = createHashHistory()

// Create a new router instance
export const router = createRouter({
  routeTree,
  history: hashHistory,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
