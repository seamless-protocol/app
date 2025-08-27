import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { KyberSwapWidget } from '../../components/KyberSwapWidget'
import { config } from '../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Components/KyberSwapWidget',
  component: KyberSwapWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'KyberSwap integration widget for swapping and bridging tokens. Shows different states based on wallet connection.',
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
  parameters: {
    docs: {
      description: {
        story:
          'The KyberSwap widget in its default state. When wallet is not connected, it shows a button that triggers a toast notification prompting users to connect their wallet first.',
      },
    },
  },
}
