import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens')({
  component: () => (
    <div className="p-2">
      <h3>Leverage Tokens</h3>
      <p>Browse and manage leverage tokens.</p>
    </div>
  ),
})
