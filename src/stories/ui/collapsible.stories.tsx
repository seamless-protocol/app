import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible'

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper component for stories that need state
const CollapsibleWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {children}
    </Collapsible>
  )
}

export const Default: Story = {
  render: () => (
    <CollapsibleWrapper>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Click to expand
          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=closed]:rotate-[-90deg]" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            This is the collapsible content. It can contain any elements you want to show or hide.
          </p>
        </div>
      </CollapsibleContent>
    </CollapsibleWrapper>
  ),
}

export const WithContent: Story = {
  render: () => (
    <CollapsibleWrapper>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Strategy Details
          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=closed]:rotate-[-90deg]" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-md border p-4 space-y-3">
          <h4 className="font-medium">Yield Farming Strategy</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">APY:</span> 12.5%
            </div>
            <div>
              <span className="font-medium">TVL:</span> $2.4M
            </div>
            <div>
              <span className="font-medium">Risk Level:</span> Medium
            </div>
            <div>
              <span className="font-medium">Min Deposit:</span> $100
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </CollapsibleWrapper>
  ),
}
