import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId, useState } from 'react'
import { Switch } from '../../components/ui/switch'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

// Basic Switch Story
export const Basic: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <div className="p-6 bg-white rounded-lg">
        <Switch id="basic" checked={checked} onCheckedChange={setChecked} />
      </div>
    )
  },
}

// Switch with Text Story
export const WithText: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <div className="p-6 bg-white rounded-lg">
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" checked={checked} onCheckedChange={setChecked} />
          <span className="text-sm text-gray-900">Airplane mode</span>
        </div>
      </div>
    )
  },
}

// Multiple Switches Story
export const MultipleSwitches: Story = {
  render: () => {
    const [emailChecked, setEmailChecked] = useState(false)
    const [smsChecked, setSmsChecked] = useState(true)
    const [pushChecked, setPushChecked] = useState(false)

    return (
      <div className="p-6 bg-white rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="email" checked={emailChecked} onCheckedChange={setEmailChecked} />
            <span className="text-sm text-gray-900">Email notifications</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="sms" checked={smsChecked} onCheckedChange={setSmsChecked} />
            <span className="text-sm text-gray-900">SMS notifications</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="push" checked={pushChecked} onCheckedChange={setPushChecked} />
            <span className="text-sm text-gray-900">Push notifications</span>
          </div>
        </div>
      </div>
    )
  },
}
