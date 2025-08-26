"use client"

import { Alert, AlertDescription } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Network } from "./NetworkSelector"
import { 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  Zap
} from "lucide-react"

interface NetworkStatusProps {
  network: Network
  isConnected: boolean
}

export function NetworkStatus({ network, isConnected }: NetworkStatusProps) {
  const getNetworkInfo = (network: Network) => {
    switch (network.id) {
      case 'base':
        return {
          description: 'Optimized for DeFi with low fees and fast transactions',
          features: ['Low Gas Fees', 'Fast Finality', 'Ethereum Compatible'],
          status: 'optimal',
          warning: null
        }
      case 'ethereum':
        return {
          description: 'The original smart contract platform with highest security',
          features: ['Maximum Security', 'Largest Ecosystem', 'Battle Tested'],
          status: 'stable',
          warning: 'Higher gas fees may apply'
        }
      case 'polygon':
        return {
          description: 'Ethereum scaling solution with fast and cheap transactions',
          features: ['Ultra Low Fees', 'Fast Transactions', 'Ethereum Compatible'],
          status: 'optimal',
          warning: null
        }
      case 'arbitrum':
        return {
          description: 'Ethereum Layer 2 with reduced costs and faster speeds',
          features: ['Lower Fees', 'Faster Speeds', 'Ethereum Security'],
          status: 'optimal',
          warning: null
        }
      case 'optimism':
        return {
          description: 'Ethereum Layer 2 scaling solution with optimistic rollups',
          features: ['Reduced Costs', 'Fast Finality', 'EVM Compatible'],
          status: 'optimal',
          warning: null
        }
      default:
        return {
          description: 'Network information not available',
          features: [],
          status: 'unknown',
          warning: 'Limited support for this network'
        }
    }
  }

  const networkInfo = getNetworkInfo(network)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'stable':
        return <Zap className="h-4 w-4 text-blue-600" />
      case 'degraded':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-100 text-green-800'
      case 'stable':
        return 'bg-blue-100 text-blue-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isConnected) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Wallet not connected. Please connect your wallet to access network features.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: network.color.replace('bg-', '#') }}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Network Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${network.color}`} />
              <div>
                <h4 className="font-medium">{network.displayName}</h4>
                <p className="text-sm text-muted-foreground">Chain ID: {network.chainId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(networkInfo.status)}
              <Badge className={getStatusColor(networkInfo.status)}>
                {networkInfo.status.charAt(0).toUpperCase() + networkInfo.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {networkInfo.description}
          </p>

          {/* Features */}
          {networkInfo.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {networkInfo.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          )}

          {/* Warning */}
          {networkInfo.warning && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {networkInfo.warning}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}