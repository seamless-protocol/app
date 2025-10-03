import { AlertTriangle, WifiOff, XCircle } from 'lucide-react'
import { classifyError, type LeverageTokenError } from './errors'

export interface ErrorDisplayConfig {
  icon: React.ReactNode
  title: string
  message: string
  showRetry: boolean
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
    classifiedError = classifyError({ message: error })
  } catch {
    classifiedError = { type: 'UNKNOWN', message: error }
  }

  switch (classifiedError.type) {
    case 'USER_REJECTED':
      return {
        icon: <XCircle className="h-8 w-8 text-amber-400" />,
        title: 'Transaction Cancelled',
        message: 'You cancelled the transaction in your wallet. No changes were made.',
        showRetry: true,
      }

    case 'CHAIN_MISMATCH':
      return {
        icon: <WifiOff className="h-8 w-8 text-blue-400" />,
        title: 'Wrong Network',
        message: 'Please switch to the correct network in your wallet and try again.',
        showRetry: true,
      }

    case 'INSUFFICIENT_BALANCE':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-red-400" />,
        title: 'Insufficient Balance',
        message: "You don't have enough tokens to complete this transaction.",
        showRetry: false,
      }

    case 'STALE_ORACLE':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-yellow-400" />,
        title: 'Price Data Outdated',
        message: 'The price data is temporarily outdated. Please try again in a few moments.',
        showRetry: true,
      }

    case 'REBALANCING_IN_PROGRESS':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-yellow-400" />,
        title: 'Rebalancing in Progress',
        message: 'The protocol is currently rebalancing. Please wait a few minutes and try again.',
        showRetry: true,
      }

    case 'INSUFFICIENT_LIQUIDITY':
      return {
        icon: <AlertTriangle className="h-8 w-8 text-red-400" />,
        title: 'Insufficient Liquidity',
        message:
          "There isn't enough liquidity to complete this transaction. Please try a smaller amount.",
        showRetry: true,
      }

    default:
      // For unknown errors, check if it's a user rejection by looking for common patterns
      if (
        error?.includes('User rejected') ||
        error?.includes('User denied') ||
        error?.includes('4001')
      ) {
        return {
          icon: <XCircle className="h-8 w-8 text-amber-400" />,
          title: 'Transaction Cancelled',
          message: 'You cancelled the transaction in your wallet. No changes were made.',
          showRetry: true,
        }
      }

      // Check for technical error messages that should be simplified
      if (
        error?.includes('Request Arguments') ||
        error?.includes('Contract Call') ||
        error?.includes('MetaMask Tx Signature')
      ) {
        return {
          icon: <XCircle className="h-8 w-8 text-amber-400" />,
          title: 'Transaction Cancelled',
          message: 'You cancelled the transaction in your wallet. No changes were made.',
          showRetry: true,
        }
      }

      return {
        icon: <AlertTriangle className="h-8 w-8 text-red-400" />,
        title: defaultTitle,
        message: error || 'Something went wrong with your transaction. Please try again.',
        showRetry: true,
      }
  }
}
