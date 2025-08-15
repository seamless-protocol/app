import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens/$id')({
  component: () => {
    const { id } = Route.useParams()
    return (
      <div className="p-2">
        <h3>Token Details</h3>
        <p>Details for token: {id}</p>
      </div>
    )
  },
})
