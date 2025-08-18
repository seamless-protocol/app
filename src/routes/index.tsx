import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="p-2">
      <h3>Welcome to Seamless Protocol</h3>
      <p>DeFi leverage strategies wrapped into simple ERC-20 tokens.</p>
    </div>
  ),
})
