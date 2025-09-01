import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WagmiProvider } from 'wagmi'
import { Alert } from '../../../components/ui/alert'
import { Toaster } from '../../../components/ui/sonner'
import { LeverageTokenHoldingsCard } from '../../../features/leverage-tokens/components/LeverageTokenHoldingsCard'
import { config } from '../../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta: Meta<typeof LeverageTokenHoldingsCard> = {
  title: 'Features/Leverage Tokens/LeverageTokenHoldingsCard',
  component: LeverageTokenHoldingsCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onConnectWallet: { action: 'connect wallet clicked' },
    onMint: {
      action: 'mint clicked',
      description: 'Function called when mint button is clicked (when wallet is connected)',
    },
    onRedeem: {
      action: 'redeem clicked',
      description: 'Function called when redeem button is clicked (when wallet is connected)',
    },
    className: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Story />
            <Toaster />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userPosition: {
      hasPosition: true,
      balance: '1.25',
      balanceUSD: '$2,847.50',
      allTimePercentage: '+12.45',
      shareToken: 'WEETH-WETH-17x',
    },
    onMint: () => {
      toast.success('🎉 Mint Functionality', {
        description:
          'This demonstrates the onMint prop. In your app, you would implement your custom mint logic here.',
        duration: 4000,
      })
    },
    onRedeem: () => {
      toast.success('🎉 Redeem Functionality', {
        description:
          'This demonstrates the onRedeem prop. In your app, you would implement your custom redeem logic here.',
        duration: 4000,
      })
    },
  },
  render: (args) => (
    <div className="w-full max-w-md mx-auto space-y-4">
      <LeverageTokenHoldingsCard {...args} />
      <Alert
        type="info"
        title="💡 Interactive Demo"
        description="Connect your wallet to see the Mint/Redeem buttons in action. Click them to see toast notifications demonstrating the onMint and onRedeem props functionality."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The leverage token holdings card displays different states based on wallet connection. When connected, it shows actual holdings with balance and performance. When disconnected, it prompts to connect wallet. Mint and Redeem buttons can use custom handlers (demonstrated with toast notifications) or fall back to the KyberSwap widget.',
      },
    },
  },
}
