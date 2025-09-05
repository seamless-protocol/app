import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from '../../components/ui/skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Basics: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
      <div className="space-y-2">
        <div className="text-slate-300 text-sm">Text line</div>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2">
        <div className="text-slate-300 text-sm">Title</div>
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="space-y-2">
        <div className="text-slate-300 text-sm">Avatar</div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="text-slate-300 text-sm">Card block</div>
        <Skeleton className="h-24 w-80 rounded-md" />
      </div>
    </div>
  ),
}

export const ListPlaceholder: Story = {
  render: () => (
    <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg w-[420px] space-y-3">
      {['r1', 'r2', 'r3', 'r4', 'r5'].map((rowKey) => (
        <div key={rowKey} className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  ),
}
