import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { Button } from '../../components/ui/button'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
          >
            <path
              d="M7.49991 0.877075C3.84222 0.877075 0.877075 3.84222 0.877075 7.49991C0.877075 11.1576 3.84222 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1576 14.1227 7.49991C14.1227 3.84222 11.1576 0.877075 7.49991 0.877075ZM7.49991 1.82708C10.6329 1.82708 13.1727 4.36689 13.1727 7.49991C13.1727 10.6329 10.6329 13.1727 7.49991 13.1727C4.36689 13.1727 1.82708 10.6329 1.82708 7.49991C1.82708 4.36689 4.36689 1.82708 7.49991 1.82708Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
            <path
              d="M7.49991 4.49991C7.77605 4.49991 7.99991 4.72377 7.99991 4.99991V6.99991C7.99991 7.27605 7.77605 7.49991 7.49991 7.49991C7.22377 7.49991 6.99991 7.27605 6.99991 6.99991V4.99991C6.99991 4.72377 7.22377 4.49991 7.49991 4.49991Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
            <path
              d="M8.49991 9.99991C8.49991 10.2761 8.27605 10.4999 7.99991 10.4999C7.72377 10.4999 7.49991 10.2761 7.49991 9.99991C7.49991 9.72377 7.72377 9.49991 7.99991 9.49991C8.27605 9.49991 8.49991 9.72377 8.49991 9.99991Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Information about this feature</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Long tooltip</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>This is a longer tooltip with more detailed information that might wrap to multiple lines.</p>
      </TooltipContent>
    </Tooltip>
  ),
} 