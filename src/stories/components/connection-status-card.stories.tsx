import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ConnectionStatusCard } from '../../components/ConnectionStatusCard'
import { config } from '../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Components/ConnectionStatusCard',
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
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
} satisfies Meta<typeof ConnectionStatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
