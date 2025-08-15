import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <div className="p-2">
      <h3>Dashboard</h3>
      <p>Your portfolio overview and activities.</p>
    </div>
  ),
})
