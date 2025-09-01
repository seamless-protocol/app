import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { Alert } from '../../../components/ui/alert'
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
    className: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <Story />
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
  },
  render: (args) => (
    <div className="w-full max-w-md mx-auto space-y-4">
      <LeverageTokenHoldingsCard {...args} />
      <Alert
        type="info"
        title="💡 To see different wallet states"
        description="Connect or disconnect your wallet using the WalletConnectButton story, then return here to see how the component adapts to different connection states."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The leverage token holdings card displays different states based on wallet connection. When connected, it shows actual holdings with balance and performance. When disconnected, it prompts to connect wallet. Mint and Redeem buttons open the KyberSwap widget.',
      },
    },
  },
}
