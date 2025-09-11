import type { Meta, StoryObj } from '@storybook/react'
import { AlertTriangle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { MultiStepModal, type StepConfig } from '../../components/multi-step-modal'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

const meta: Meta<typeof MultiStepModal> = {
  title: 'Components/MultiStepModal',
  component: MultiStepModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    description: {
      control: 'text',
      description: 'Modal description',
    },
    currentStep: {
      control: 'select',
      options: ['input', 'confirm', 'pending', 'success', 'error'],
      description: 'Current step ID',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Example step configurations
const mintSteps: Array<StepConfig> = [
  { id: 'input', label: 'Input', progress: 25 },
  { id: 'confirm', label: 'Confirm', progress: 50 },
  { id: 'pending', label: 'Pending', progress: 75 },
  { id: 'success', label: 'Success', progress: 100 },
  { id: 'error', label: 'Error', progress: 50 },
]

const redeemSteps: Array<StepConfig> = [
  { id: 'input', label: 'Input', progress: 33 },
  { id: 'confirm', label: 'Confirm', progress: 66 },
  { id: 'pending', label: 'Pending', progress: 90 },
  { id: 'success', label: 'Success', progress: 100 },
  { id: 'error', label: 'Error', progress: 50 },
]

const simpleSteps: Array<StepConfig> = [
  { id: 'step1', label: 'Step 1', progress: 33 },
  { id: 'step2', label: 'Step 2', progress: 66 },
  { id: 'step3', label: 'Step 3', progress: 100 },
]

// Interactive story with step navigation
export const Interactive: Story = {
  args: {
    isOpen: false,
    title: 'Multi-Step Process',
    description: 'Complete the steps to finish the process',
    currentStep: 'input',
    steps: mintSteps,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState('input')

    const nextStep = () => {
      const currentIndex = mintSteps.findIndex((step) => step.id === currentStep)
      if (currentIndex < mintSteps.length - 1) {
        const nextStep = mintSteps[currentIndex + 1]
        if (nextStep) {
          setCurrentStep(nextStep.id)
        }
      }
    }

    const prevStep = () => {
      const currentIndex = mintSteps.findIndex((step) => step.id === currentStep)
      if (currentIndex > 0) {
        const prevStep = mintSteps[currentIndex - 1]
        if (prevStep) {
          setCurrentStep(prevStep.id)
        }
      }
    }

    const resetSteps = () => {
      setCurrentStep('input')
    }

    const renderStepContent = () => {
      switch (currentStep) {
        case 'input':
          return (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-white mb-2 block">Enter Amount</div>
                <Input placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="flex space-x-2">
                <Button onClick={nextStep} className="flex-1">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )

        case 'confirm':
          return (
            <div className="space-y-4">
              <Card variant="gradient" className="p-4">
                <h4 className="text-sm font-medium text-white mb-3">Transaction Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white">1.5 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-white">0.001 ETH</span>
                  </div>
                </div>
              </Card>
              <div className="flex space-x-2">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Confirm
                </Button>
              </div>
            </div>
          )

        case 'pending':
          return (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Processing Transaction</h3>
                <p className="text-slate-400 text-center max-w-sm">
                  Please wait while we process your transaction. This may take a few moments.
                </p>
              </div>
              <Button onClick={nextStep} className="w-full">
                Simulate Success
              </Button>
            </div>
          )

        case 'success':
          return (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Transaction Complete!</h3>
                <p className="text-slate-400 text-center max-w-sm">
                  Your transaction has been successfully processed.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={resetSteps}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Start Over
                </Button>
                <Button onClick={() => setIsOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )

        case 'error':
          return (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Transaction Failed</h3>
                <p className="text-slate-400 text-center max-w-sm">
                  Something went wrong. Please try again.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={resetSteps}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Try Again
                </Button>
                <Button onClick={() => setIsOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)} className="border-2 border-slate-600">
          Open Multi-Step Modal
        </Button>
        <MultiStepModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          currentStep={currentStep}
        >
          {renderStepContent()}
        </MultiStepModal>
      </div>
    )
  },
}

// Static examples for different steps
export const InputStep: Story = {
  args: {
    isOpen: true,
    title: 'Mint Leverage Token',
    description: 'Enter the amount you want to mint',
    currentStep: 'input',
    steps: mintSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-white mb-2 block">Enter Amount</div>
          <Input placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <Button className="w-full">
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </MultiStepModal>
  ),
}

export const ConfirmStep: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Transaction',
    description: 'Review your transaction details',
    currentStep: 'confirm',
    steps: mintSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-4">
        <Card variant="gradient" className="p-4">
          <h4 className="text-sm font-medium text-white mb-3">Transaction Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Amount</span>
              <span className="text-white">1.5 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fee</span>
              <span className="text-white">0.001 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total</span>
              <span className="text-white font-medium">1.501 ETH</span>
            </div>
          </div>
        </Card>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Back
          </Button>
          <Button className="flex-1">Confirm</Button>
        </div>
      </div>
    </MultiStepModal>
  ),
}

export const PendingStep: Story = {
  args: {
    isOpen: true,
    title: 'Processing Transaction',
    description: 'Please wait while we process your transaction',
    currentStep: 'pending',
    steps: mintSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Processing Transaction</h3>
          <p className="text-slate-400 text-center max-w-sm">
            Please wait while we process your transaction. This may take a few moments.
          </p>
        </div>
      </div>
    </MultiStepModal>
  ),
}

export const SuccessStep: Story = {
  args: {
    isOpen: true,
    title: 'Transaction Complete',
    description: 'Your transaction has been successfully processed',
    currentStep: 'success',
    steps: mintSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Transaction Complete!</h3>
          <p className="text-slate-400 text-center max-w-sm">
            Your leverage tokens have been successfully minted and are now earning yield.
          </p>
        </div>
        <Button className="w-full">Close</Button>
      </div>
    </MultiStepModal>
  ),
}

export const ErrorStep: Story = {
  args: {
    isOpen: true,
    title: 'Transaction Failed',
    description: 'Something went wrong with your transaction',
    currentStep: 'error',
    steps: mintSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Transaction Failed</h3>
          <p className="text-slate-400 text-center max-w-sm">
            Something went wrong. Please try again or contact support if the problem persists.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Try Again
          </Button>
          <Button className="flex-1">Close</Button>
        </div>
      </div>
    </MultiStepModal>
  ),
}

// Different step configurations
export const RedeemSteps: Story = {
  args: {
    isOpen: true,
    title: 'Redeem Leverage Token',
    description: 'Redeem your leverage tokens',
    currentStep: 'input',
    steps: redeemSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-white mb-2 block">Enter Amount to Redeem</div>
          <Input placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <Button className="w-full">
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </MultiStepModal>
  ),
}

export const SimpleSteps: Story = {
  args: {
    isOpen: true,
    title: 'Simple Process',
    description: 'A simple 3-step process',
    currentStep: 'step2',
    steps: simpleSteps,
  },
  render: (args) => (
    <MultiStepModal {...args}>
      <div className="space-y-4">
        <Card variant="gradient" className="p-4">
          <h4 className="text-sm font-medium text-white mb-3">Step 2 Content</h4>
          <p className="text-slate-400 text-sm">
            This is the content for step 2 of a simple 3-step process.
          </p>
        </Card>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Previous
          </Button>
          <Button className="flex-1">Next</Button>
        </div>
      </div>
    </MultiStepModal>
  ),
}
