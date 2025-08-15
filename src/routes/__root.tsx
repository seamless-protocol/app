import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ModeToggle } from '@/components/mode-toggle'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex items-center justify-between">
        <div className="flex gap-2">
          <Link to="/" className="[&.active]:font-bold">
            Home
          </Link>{' '}
          <Link to="/dashboard" className="[&.active]:font-bold">
            Dashboard
          </Link>{' '}
          <Link to="/tokens" className="[&.active]:font-bold">
            Tokens
          </Link>{' '}
          <Link to="/vaults" className="[&.active]:font-bold">
            Vaults
          </Link>
        </div>
        <ModeToggle />
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
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
