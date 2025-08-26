import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { MainLayout } from '@/components/main-layout'

export const Route = createRootRoute({
  component: () => (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <TanStackRouterDevtools />
    </>
  ),
  beforeLoad: ({ location }) => {
    // Redirect from root to tokens page
    if (location.pathname === '/') {
      throw new Response('', {
        status: 302,
        headers: {
          Location: '/tokens',
        },
      })
    }
  },
  notFoundComponent: () => (
    <div className="p-2">
      <h3>404 - Page Not Found</h3>
      <p>The page you are looking for does not exist.</p>
      <Link to="/tokens" className="text-blue-500 underline">
        Go to Leverage Tokens
      </Link>
    </div>
  ),
})
