import type { Address } from 'viem'

/**
 * Core types for leverage tokens feature
 */

export interface LeverageToken {
  address: Address
  name: string
  symbol: string
  description: string
  decimals: number
  leverageRatio: number
  totalSupply: bigint
  chainId: number
  chainName: string
  chainLogo: React.ComponentType<React.SVGProps<SVGSVGElement>>
  collateralAsset: {
    symbol: string
    name: string
    address: Address
  }
  debtAsset: {
    symbol: string
    name: string
    address: Address
  }
}

export interface TokenMetadata {
  name: string
  symbol: string
  decimals: number
  leverageRatio: number
  underlying: {
    address: Address
    symbol: string
    decimals: number
  }
}

export interface TokenPrice {
  price: bigint
  timestamp: number
  isStale: boolean
}

export interface RebalancingStatus {
  lastRebalance: number
  nextRebalance?: number
  isRebalancing: boolean
  currentRatio: number
  targetRatio: number
  thresholdBreached: boolean
}

export interface UserPosition {
  token: Address
  balance: bigint
  value: bigint
  entryPrice?: bigint
  currentPrice: bigint
  pnl?: bigint
  pnlPercentage?: number
}

export interface MintSimulation {
  tokenAmount: bigint
  requiredCollateral: bigint
  estimatedFees: bigint
  priceImpact: number
  slippage: number
}

export interface RedeemSimulation {
  collateralAmount: bigint
  requiredTokens: bigint
  estimatedFees: bigint
  priceImpact: number
  slippage: number
}

export interface TransactionState {
  status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'error'
  hash?: Address
  error?: Error
  confirmations?: number
}
