import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { WalletConnectButton } from '../../components/WalletConnectButton'
import { config } from '../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Components/General/WalletConnectButton',
  component: WalletConnectButton,
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
} satisfies Meta<typeof WalletConnectButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
