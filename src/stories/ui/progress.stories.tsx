import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from '../../components/ui/progress'

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value (0-100)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 50,
    className: 'w-64 bg-gray-200',
  },
}

export const CustomStyling: Story = {
  args: {
    value: 60,
    className: 'w-64 h-3 bg-slate-200',
  },
}
