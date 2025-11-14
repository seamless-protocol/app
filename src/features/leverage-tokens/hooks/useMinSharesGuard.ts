import { useEffect, useState } from 'react'

interface UseMinSharesGuardParams {
  currentStep: string
  plan: { minShares: bigint } | undefined
  stepName?: string // The step name to track (default: 'confirm')
}

interface UseMinSharesGuardResult {
  ackMinShares: bigint | undefined
  needsReack: boolean
  errorMessage: string | undefined
  onUserAcknowledge: () => void
}

/**
 * Hook to guard against quote worsening after user has acknowledged a floor value.
 *
 * Flow:
 * 1. On first entry to confirm step, locks in the current minShares as acknowledged
 * 2. Watches for auto-refresh changes to the plan
 * 3. If minShares worsens below acknowledged floor, requires re-acknowledgment
 * 4. If minShares improves, silently updates the acknowledged floor
 *
 * @param currentStep - Current step in the flow
 * @param plan - The plan containing minShares to track
 * @param stepName - The step name to track (default: 'confirm')
 * @returns Guard state and acknowledgment handler
 */
export function useMinSharesGuard({
  currentStep,
  plan,
  stepName = 'confirm',
}: UseMinSharesGuardParams): UseMinSharesGuardResult {
  const [ackMinShares, setAckMinShares] = useState<bigint | undefined>(undefined)
  const [needsReack, setNeedsReack] = useState(false)

  // Reset state when leaving the tracked step
  useEffect(() => {
    if (currentStep !== stepName) {
      setAckMinShares(undefined)
      setNeedsReack(false)
    }
  }, [currentStep, stepName])

  // React to plan changes while on confirm step
  useEffect(() => {
    // Only act when on the tracked step
    if (currentStep !== stepName || !plan?.minShares) {
      return
    }

    const currentMinShares = plan.minShares

    // First time on confirm: lock in the floor
    if (ackMinShares === undefined) {
      setAckMinShares(currentMinShares)
      setNeedsReack(false)
      return
    }

    // Quote improved: silently update acknowledged floor
    if (currentMinShares > ackMinShares) {
      setAckMinShares(currentMinShares)
      setNeedsReack(false)
      return
    }

    // Quote worsened: require re-acknowledgment
    if (currentMinShares < ackMinShares) {
      setNeedsReack(true)
      return
    }

    // Quote stayed the same: no action needed
  }, [currentStep, stepName, plan?.minShares, ackMinShares])

  // Generate error message when re-acknowledgment is needed
  const errorMessage = needsReack
    ? 'Guaranteed output decreased — please review and confirm again.'
    : undefined

  // Handler for user re-acknowledgment
  const onUserAcknowledge = () => {
    if (!plan?.minShares) return
    setAckMinShares(plan.minShares)
    setNeedsReack(false)
  }

  return {
    ackMinShares,
    needsReack,
    errorMessage,
    onUserAcknowledge,
  }
}
