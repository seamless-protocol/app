import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { MainLayout } from '@/components/main-layout'

export const Route = createRootRoute({
  component: () => (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      {import.meta.env.MODE === 'development' && <TanStackRouterDevtools />}
    </>
  ),
  notFoundComponent: () => (
    <div className="p-2">
      <h3>404 - Page Not Found</h3>
      <p>The page you are looking for does not exist.</p>
      <Link
        to="/leverage-tokens"
        className="underline text-[var(--link-normal)] hover:text-[var(--link-hover)]"
      >
        Go to Leverage Tokens
      </Link>
    </div>
  ),
})
