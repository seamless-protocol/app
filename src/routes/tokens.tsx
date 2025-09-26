import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens')({
  component: () => {
    return (
      <div className="mx-auto max-w-7xl">
        <Outlet />
      </div>
    )
  },
})
