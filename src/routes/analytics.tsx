import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <div className="p-2">
      <p>TO BE IMPLEMENTED</p>
    </div>
  )
} 