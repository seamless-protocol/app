import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from '../../components/ui/alert'

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
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <Alert type="info" description="You can add components to your app using the cli." />

      <Alert type="error" description="Your session has expired. Please log in again." />

      <Alert type="warning" description="Please review your settings before proceeding." />

      <Alert type="success" description="Your changes have been saved successfully." />
    </div>
  ),
}
