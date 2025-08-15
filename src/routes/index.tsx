import { ConnectButton } from '@rainbow-me/rainbowkit'
import { createFileRoute } from '@tanstack/react-router'
import { WalletInfo } from '../components/WalletInfo'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="p-2">
      <div className="flex justify-between items-center mb-8">
        <h3>Welcome to Seamless Protocol</h3>
        <ConnectButton />
      </div>
      <p className="mb-8">DeFi leverage strategies wrapped into simple ERC-20 tokens.</p>
      <WalletInfo />
    </div>
  ),
})
