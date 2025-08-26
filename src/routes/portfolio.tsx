import { createFileRoute } from '@tanstack/react-router'
import { useAccount } from 'wagmi'
import { ConnectionStatusCard } from '@/components/ConnectionStatusCard'

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { isConnected } = useAccount()

  // Show connection status card if wallet is not connected
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <ConnectionStatusCard />
      </div>
    )
  }

  // Show portfolio content when wallet is connected
  return (
    <div className="space-y-6">
      <p className="text-slate-400">Your portfolio overview and activities.</p>
    </div>
  )
}
