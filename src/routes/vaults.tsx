import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vaults')({
  component: () => (
    <div className="p-2">
      <h3>Vaults</h3>
      <p>Browse and manage Morpho vaults.</p>
    </div>
  ),
})
