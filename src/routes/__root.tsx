import { Header } from '@/components/header'
import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-2">
      <h3>404 - Page Not Found</h3>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-500 underline">
        Go Home
      </Link>
    </div>
  ),
})
