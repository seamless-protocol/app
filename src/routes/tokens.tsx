import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens')({
  component: () => {
    return <Outlet />
  },
})
