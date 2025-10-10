import { AlertCircle, RefreshCw, Wallet, Wifi } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createLogger } from '@/lib/logger'

const logger = createLogger('web3-error-boundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorType: Web3ErrorType
}

type Web3ErrorType =
  | 'PROVIDER_NOT_FOUND'
  | 'CHAIN_MISMATCH'
  | 'USER_REJECTED'
  | 'RPC_ERROR'
  | 'INSUFFICIENT_FUNDS'
  | 'UNKNOWN'

export class Web3ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorType: 'UNKNOWN',
  }

  private parseWeb3Error(error: Error): Web3ErrorType {
    const message = error.message?.toLowerCase() || ''
    const code = (error as unknown as { code?: number })?.code

    if (code === 4902 || message.includes('unrecognized chain')) {
      return 'CHAIN_MISMATCH'
    }
    if (code === 4001 || message.includes('user rejected')) {
      return 'USER_REJECTED'
    }
    if (code === -32000 || code === -32603 || message.includes('rpc')) {
      return 'RPC_ERROR'
    }
    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
      return 'INSUFFICIENT_FUNDS'
    }
    if (
      message.includes('no provider') ||
      message.includes('wallet not found') ||
      message.includes('window.ethereum')
    ) {
      return 'PROVIDER_NOT_FOUND'
    }

    return 'UNKNOWN'
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = this.parseWeb3Error(error)
    this.setState({ errorType })

    logger.error('Web3ErrorBoundary caught an error', {
      error,
      errorInfo,
      errorType,
      errorCode: (error as { code?: number })?.code,
      errorBoundary: 'Web3ErrorBoundary',
      web3ErrorType: errorType,
      componentStack: errorInfo.componentStack,
      errorMessage: error.message,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorType: 'UNKNOWN' })
  }

  private getErrorContent() {
    const { errorType } = this.state

    switch (errorType) {
      case 'PROVIDER_NOT_FOUND':
        return {
          icon: Wallet,
          title: 'Wallet Not Found',
          description: 'Please install a Web3 wallet like MetaMask to continue.',
          actions: (
            <>
              <Button
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                variant="default"
              >
                Install MetaMask
              </Button>
              <Button onClick={this.handleReset} variant="outline">
                Try Again
              </Button>
            </>
          ),
        }

      case 'CHAIN_MISMATCH':
        return {
          icon: Wifi,
          title: 'Wrong Network',
          description: 'Please switch to the correct network in your wallet.',
          actions: (
            <>
              <Button onClick={this.handleReset} variant="default">
                I've Switched Networks
              </Button>
            </>
          ),
        }

      case 'USER_REJECTED':
        return {
          icon: AlertCircle,
          title: 'Transaction Rejected',
          description:
            'You rejected the transaction. Please try again and approve the transaction.',
          actions: (
            <>
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
            </>
          ),
        }

      case 'RPC_ERROR':
        return {
          icon: RefreshCw,
          title: 'Connection Error',
          description: 'Failed to connect to the blockchain. Please try again.',
          actions: (
            <>
              <Button onClick={this.handleReset} variant="default">
                Retry
              </Button>
            </>
          ),
        }

      case 'INSUFFICIENT_FUNDS':
        return {
          icon: Wallet,
          title: 'Insufficient Funds',
          description: "You don't have enough funds to complete this transaction.",
          actions: (
            <>
              <Button onClick={this.handleReset} variant="outline">
                Go Back
              </Button>
            </>
          ),
        }

      default:
        return {
          icon: AlertCircle,
          title: 'Web3 Error',
          description: 'An error occurred while interacting with the blockchain.',
          actions: (
            <>
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </>
          ),
        }
    }
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { icon: Icon, title, description, actions } = this.getErrorContent()

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-destructive" />
                <CardTitle>{title}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {this.state.error &&
                ((typeof import.meta !== 'undefined' &&
                  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
                    'MODE'
                  ] === 'development') ||
                  (typeof process !== 'undefined' &&
                    process.env &&
                    process.env['NODE_ENV'] === 'development')) && (
                  <details className="mb-4 rounded-lg bg-muted p-4">
                    <summary className="cursor-pointer text-sm font-medium">Error details</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              <div className="flex gap-2">{actions}</div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
