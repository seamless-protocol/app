import type { Meta, StoryObj } from '@storybook/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toast notifications using Sonner with custom styling that matches the app design system.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Positions: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium mb-2">Toast Positions</h3>
        <p className="text-sm text-muted-foreground">
          Test different positioning options for toast notifications
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() =>
            toast('Top Center Toast', {
              description: 'This appears at the top center of the screen',
              position: 'top-center',
            })
          }
        >
          Top Center
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            toast('Bottom Right Toast', {
              description: 'This appears at the bottom right corner',
              position: 'bottom-right',
            })
          }
        >
          Bottom Right
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            toast('Top Right Toast', {
              description: 'This appears at the top right corner',
              position: 'top-right',
            })
          }
        >
          Top Right
        </Button>
      </div>

      <Toaster />
    </div>
  ),
}

export const Types: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium mb-2">Toast Types</h3>
        <p className="text-sm text-muted-foreground">
          Different notification types with consistent styling
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() =>
            toast.error('Please connect your wallet first', {
              description: 'You need to connect a wallet to use swap and bridge features',
            })
          }
        >
          Error
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            toast.success('Transaction completed!', {
              description: 'Your tokens have been swapped successfully',
            })
          }
        >
          Success
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            toast.warning('Network congestion detected', {
              description: 'Transaction may take longer than usual',
            })
          }
        >
          Warning
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            toast.info('New feature available', {
              description: 'Check out the new leverage token functionality',
            })
          }
        >
          Info
        </Button>
      </div>

      <Toaster position="top-center" />
    </div>
  ),
}
