import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

const meta = {
  title: 'UI/Card',
  component: Card,
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
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area where you can put any content.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithGradient: Story = {
  render: () => (
    <Card className="w-[350px]" variant="gradient">
      <CardHeader>
        <CardTitle>Gradient Card</CardTitle>
        <CardDescription>A card with gradient styling to match the design system.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card uses the dark theme styling with slate colors and backdrop blur.</p>
      </CardContent>
      <CardFooter>
        <Button variant="gradient" className="w-full">
          Get Started
        </Button>
      </CardFooter>
    </Card>
  ),
}
