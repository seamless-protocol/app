import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens')({
  component: () => {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Outlet />
      </div>
    )
  },
})
