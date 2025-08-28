import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { KyberSwapWidget } from '../../components/KyberSwapWidget'
import { Alert } from '../../components/ui/alert'
import { Toaster } from '../../components/ui/sonner'
import { config } from '../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Components/General/KyberSwapWidget',
  component: KyberSwapWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'KyberSwap integration widget for swapping and bridging tokens. Shows different states based on wallet connection.\n\n**To see the full widget functionality:** Navigate to the WalletConnectButton story first and connect your wallet, then return to this story to see the complete swap interface.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <div className="p-4">
              <Story />
              <Toaster position="top-center" />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
} satisfies Meta<typeof KyberSwapWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="space-y-6">
      <KyberSwapWidget />
      <Alert
        type="info"
        title="💡 To see the full swap widget"
        description="Navigate to Components/General/WalletConnectButton story, connect your wallet, then return here to see the complete functionality!"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The KyberSwap widget with helpful instructions. When wallet is not connected, it shows a button that triggers a toast notification. To see the full swap widget, navigate to Components/General/WalletConnectButton story, connect your wallet, then return here.',
      },
    },
  },
}
