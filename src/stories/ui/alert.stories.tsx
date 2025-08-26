import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertCircle, AlertTriangle, Info as InfoIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'

const meta = {
  title: 'UI/Alert',
  component: Alert,
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
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert className="w-[400px]">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the cli.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[400px]">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
}

export const Info: Story = {
  render: () => (
    <Alert className="w-[400px] bg-blue-500/10 border-blue-500/30">
      <InfoIcon className="h-4 w-4 text-blue-400" />
      <AlertTitle className="text-blue-200">Information</AlertTitle>
      <AlertDescription className="text-blue-200">
        This is an informational alert with custom styling.
      </AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  render: () => (
    <Alert className="w-[400px] bg-yellow-500/10 border-yellow-500/30">
      <AlertTriangle className="h-4 w-4 text-yellow-400" />
      <AlertTitle className="text-yellow-200">Warning</AlertTitle>
      <AlertDescription className="text-yellow-200">
        Please review your settings before proceeding.
      </AlertDescription>
    </Alert>
  ),
}
