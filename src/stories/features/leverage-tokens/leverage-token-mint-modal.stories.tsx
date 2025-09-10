import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { Button } from '../../../components/ui/button'
import { LeverageTokenMintModal } from '../../../features/leverage-tokens/components/LeverageTokenMintModal'
import { Toaster } from '../../../components/ui/sonner'
import {
  leverageTokenConfigs,
  LeverageTokenKey,
} from '../../../features/leverage-tokens/leverageTokens.config'
import { config } from '../../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Features/Leverage Tokens/LeverageTokenMintModal',
  component: LeverageTokenMintModal,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
    docs: {
      description: {
        component:
          'A multi-step modal for minting leverage tokens with approval, confirmation, and transaction processing states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <div className="flex items-center justify-center min-h-screen p-4">
              <Story />
              <Toaster />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'modal-closed',
      description: 'Callback when modal is closed',
    },
    leverageTokenAddress: {
      control: 'text',
      description: 'Address of the leverage token',
    },
  },
} satisfies Meta<typeof LeverageTokenMintModal>

export default meta
type Story = StoryObj<typeof meta>

// Default interactive story
export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress: leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]!.address,
    apy: 18.67, // Example with APY
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)} variant="gradient">
          Open Mint Modal
        </Button>
        <LeverageTokenMintModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    )
  },
}

// Story for testing different states
export const AllStates: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress: leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]!.address,
    apy: 18.67,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsOpen(true)} variant="gradient">
            Test All States
          </Button>
        </div>

        <div className="text-sm text-slate-400 max-w-md">
          <p>This story allows you to test all the different states of the modal:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Input step with amount selection</li>
            <li>Approval step with loading</li>
            <li>Confirmation step with summary</li>
            <li>Pending step with processing</li>
            <li>Success step with completion</li>
            <li>Error step with retry option</li>
          </ul>
        </div>

        <LeverageTokenMintModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    )
  },
}

// Story with different strategy IDs
export const DifferentStrategies: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress: leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]!.address,
    apy: 18.67,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)
    const [strategyId, setStrategyId] = useState(LeverageTokenKey.WEETH_WETH_17X)

    const strategies = [
      { id: LeverageTokenKey.WEETH_WETH_17X, name: 'weETH/WETH 17x' },
      // Add more strategies here as they become available
      // { id: 'eth-usdc-10x', name: 'ETH/USDC 10x' },
      // { id: 'btc-eth-5x', name: 'BTC/ETH 5x' },
    ]

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {strategies.map((strategy) => (
            <Button
              key={strategy.id}
              onClick={() => {
                setStrategyId(strategy.id)
                setIsOpen(true)
              }}
              variant="outline"
            >
              {strategy.name}
            </Button>
          ))}
        </div>

        <LeverageTokenMintModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          leverageTokenAddress={leverageTokenConfigs[strategyId]!.address}
        />
      </div>
    )
  },
}

// Story without APY to show default behavior
export const WithoutAPY: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress: leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]!.address,
    // No APY prop - will default to 0%
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Mint Modal (No APY)</Button>
        <LeverageTokenMintModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <Toaster />
      </div>
    )
  },
}
