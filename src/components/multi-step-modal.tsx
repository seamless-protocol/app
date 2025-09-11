'use client'

import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Progress } from './ui/progress'

export interface StepConfig {
  id: string
  label: string
  progress: number
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
  className = 'max-w-md bg-slate-900 border-slate-700',
}: MultiStepModalProps) {
  const getStepProgress = () => {
    const step = steps.find((s) => s.id === currentStep)
    return step?.progress || 0
  }

  const getStepNumber = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep)
    return stepIndex + 1
  }

  const getTotalSteps = () => {
    return steps.length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Progress value={getStepProgress()} className="h-1 bg-slate-800" />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>
              Step {getStepNumber()} of {getTotalSteps()}
            </span>
            <span className="capitalize">{currentStep}</span>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
