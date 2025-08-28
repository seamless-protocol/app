import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { Alert } from '@/components/ui/alert'
import { ConnectionStatusCard } from '../../components/ConnectionStatusCard'
import { config } from '../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Components/General/ConnectionStatusCard',
  component: ConnectionStatusCard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Story />
            <div className="mx-10 my-4">
              <Alert
                type="info"
                title="💡 To see the full connection status card"
                description="Navigate to Components/General/WalletConnectButton story, disconnect your wallet, then return here to see the complete functionality!"
              />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
} satisfies Meta<typeof ConnectionStatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
