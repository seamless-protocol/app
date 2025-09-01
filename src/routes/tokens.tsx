import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens')({
  component: () => {
    return (
      <div className="mx-auto max-w-7xl px-2 xs:px-3 sm:px-4 lg:px-8">
        <Outlet />
      </div>
    )
  },
})
