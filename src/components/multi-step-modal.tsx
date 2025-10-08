import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Progress } from './ui/progress'

export interface StepConfig {
  id: string
  label: string
  progress: number
  isUserAction?: boolean // If true, this step counts toward step numbering
}

export interface MultiStepModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  currentStep: string
  steps: Array<StepConfig>
  children: ReactNode
  className?: string
}

export function MultiStepModal({
  isOpen,
  onClose,
  title,
  description,
  currentStep,
  steps,
  children,
  className = 'max-w-md border border-border bg-card text-foreground',
}: MultiStepModalProps) {
  const getStepProgress = () => {
    const step = steps.find((s) => s.id === currentStep)
    return step?.progress || 0
  }

  const getStepNumber = () => {
    // Only count steps that are user actions
    const userActionSteps = steps.filter((s) => s.isUserAction !== false)
    const currentStepIndex = userActionSteps.findIndex((s) => s.id === currentStep)
    return currentStepIndex + 1
  }

  const getTotalSteps = () => {
    // Only count steps that are user actions
    return steps.filter((s) => s.isUserAction !== false).length
  }

  const getCurrentStepLabel = () => {
    const step = steps.find((s) => s.id === currentStep)
    return step?.label || currentStep
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-secondary-foreground">{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Progress value={getStepProgress()} className="h-1" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span
              className={(() => {
                const currentStepConfig = steps.find((s) => s.id === currentStep)
                const isUserAction = currentStepConfig?.isUserAction !== false
                return isUserAction ? '' : 'invisible'
              })()}
            >
              {(() => {
                const currentStepConfig = steps.find((s) => s.id === currentStep)
                const isUserAction = currentStepConfig?.isUserAction !== false
                return isUserAction
                  ? `Step ${getStepNumber()} of ${getTotalSteps()}`
                  : getCurrentStepLabel()
              })()}
            </span>
            <span>{getCurrentStepLabel()}</span>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
