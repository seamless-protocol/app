// This component has been removed to avoid external dependency issues
// The app now uses a custom wallet connection system
import { Button } from './ui/button'
import { Wallet } from 'lucide-react'

interface ConnectButtonProps {
  onClick: () => void
  isConnected: boolean
  address?: string
}

export function ConnectButton({ onClick, isConnected, address }: ConnectButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 h-9 px-3 sm:h-10 sm:px-4"
      size="sm"
    >
      <Wallet className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">
        {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
      </span>
    </Button>
  )
}