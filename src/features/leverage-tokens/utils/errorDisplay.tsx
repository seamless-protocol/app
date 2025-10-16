import { AlertTriangle, WifiOff, XCircle } from 'lucide-react'
import { classifyError, type LeverageTokenError } from './errors'

export type ErrorSeverity = 'info' | 'warning' | 'error'

export interface ErrorDisplayConfig {
  icon: React.ReactNode
  title: string
  message: string
  showRetry: boolean
  severity: ErrorSeverity
  technicalDetails?: string
}

/**
 * Shared utility for converting error messages into user-friendly display configurations
 * Used by both mint and redeem modal ErrorStep components
 */
export function getErrorDisplay(
  error: string,
  defaultTitle: string = 'Transaction Failed',
): ErrorDisplayConfig {
  // Try to classify the error first
  let classifiedError: LeverageTokenError
  try {
    classifiedError = classifyError(error)
  } catch {
    classifiedError = { type: 'UNKNOWN', message: error }
  }

  switch (classifiedError.type) {
    case 'USER_REJECTED':
      return {
        icon: <XCircle className="h-8 w-8 text-[var(--state-warning-text)]" />,
        title: 'Transaction Cancelled',
        message: 'You cancelled the transaction in your wallet. No changes were made.',
        showRetry: true,
        severity: 'warning',
      }

    case 'CHAIN_MISMATCH':
      return {
        icon: <WifiOff className="h-8 w-8 text-[var(--state-info-text)]" />,
        title: 'Wrong Network',
        message: 'Please switch to the correct network in your wallet and try again.',
        showRetry: true,
        severity: 'warning',
      }

    case 'INSUFFICIENT_BALANCE':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-[var(--state-error-text)]" />,
        title: 'Insufficient Balance',
        message: "You don't have enough tokens to complete this transaction.",
        showRetry: false,
        severity: 'error',
      }

    case 'STALE_ORACLE':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-[var(--state-warning-text)]" />,
        title: 'Price Data Outdated',
        message: 'The price data is temporarily outdated. Please try again in a few moments.',
        showRetry: true,
        severity: 'warning',
      }

    case 'REBALANCING_IN_PROGRESS':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-[var(--state-warning-text)]" />,
        title: 'Rebalancing in Progress',
        message: 'The protocol is currently rebalancing. Please wait a few minutes and try again.',
        showRetry: true,
        severity: 'warning',
      }

    case 'INSUFFICIENT_LIQUIDITY':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-[var(--state-error-text)]" />,
        title: 'Insufficient Liquidity',
        message:
          "There isn't enough liquidity to complete this transaction. Please try a smaller amount.",
        showRetry: true,
        severity: 'warning',
      }

    case 'SLIPPAGE_EXCEEDED':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-[var(--state-error-text)]" />,
        title: 'Slippage Tolerance Exceeded',
        message:
          'The price moved beyond your slippage tolerance. Try increasing your slippage tolerance or retry the transaction.',
        showRetry: true,
        severity: 'warning',
        technicalDetails: error,
      }

    default:
      // For unknown errors, check if it's a user rejection by looking for common patterns
      if (
        error?.includes('User rejected') ||
        error?.includes('User denied') ||
        error?.includes('4001')
      ) {
        return {
          icon: <XCircle className="h-8 w-8 text-[var(--state-warning-text)]" />,
          title: 'Transaction Cancelled',
          message: 'You cancelled the transaction in your wallet. No changes were made.',
          showRetry: true,
          severity: 'warning',
        }
      }

      // Common on-chain revert surfaces from viem or RPC
      if (
        error?.includes('ContractFunctionExecutionError') ||
        error?.includes('execution reverted') ||
        error?.includes('simulateContract')
      ) {
        return {
          icon: <AlertTriangle className="h-8 w-8 text-[var(--state-error-text)]" />,
          title: 'Transaction Reverted',
          message:
            'On-chain execution reverted. Try a smaller amount, increase slippage slightly, or retry shortly.',
          showRetry: true,
          severity: 'error',
          technicalDetails: error,
        }
      }

      return {
        icon: <AlertTriangle className="h-8 w-8 text-[var(--state-error-text)]" />,
        title: defaultTitle,
        message:
          error ||
          'The transaction could not be completed. Try increasing your slippage tolerance or retry the transaction.',
        showRetry: true,
        severity: 'warning',
        technicalDetails: error,
      }
  }
}
