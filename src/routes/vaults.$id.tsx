import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vaults/$id')({
  component: () => {
    const { id } = Route.useParams()
    return (
      <div className="p-2">
        <h3>Vault Details</h3>
        <p>Details for vault: {id}</p>
      </div>
    )
  },
})
