import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from '../../components/ui/separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Separator orientation',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const InCard: Story = {
  render: () => (
    <div className="bg-card border border-border rounded-lg p-4 w-64 text-foreground">
      <div className="text-sm mb-2">Section 1</div>
      <div className="text-xs text-secondary-foreground mb-4">Some content here</div>

      <Separator className="my-4" />

      <div className="text-sm mb-2">Section 2</div>
      <div className="text-xs text-secondary-foreground">More content here</div>
    </div>
  ),
}

export const VerticalInFlex: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-secondary-foreground">Item 1</div>
      <Separator orientation="vertical" className="h-6" />
      <div className="text-sm text-secondary-foreground">Item 2</div>
      <Separator orientation="vertical" className="h-6" />
      <div className="text-sm text-secondary-foreground">Item 3</div>
    </div>
  ),
}
