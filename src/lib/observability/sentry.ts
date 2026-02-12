import * as Sentry from '@sentry/react'
import type { Quote } from '@/domain/shared/adapters/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('observability')

function getCurrentRoute(): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined
    // Hash routing preferred; fallback to pathname
    const hash = window.location?.hash
    if (hash?.startsWith('#')) return hash.slice(1) || '/'
    return window.location?.pathname
  } catch {
    return undefined
  }
}

function getEndpointPath(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url).pathname
  } catch {
    return undefined
  }
}

export function captureApiError(params: {
  provider: string
  method: string
  url: string
  status?: number
  durationMs?: number
  attempt?: number
  feature?: string
  chainId?: number
  token?: string
  responseSnippet?: string
  requestId?: string
  error?: unknown
  route?: string
}) {
  const {
    provider,
    method,
    url,
    status,
    durationMs,
    attempt,
    feature,
    chainId,
    token,
    responseSnippet,
    requestId,
    error,
    route,
  } = params

  const endpointPath = getEndpointPath(url)
  const routeTag = route ?? getCurrentRoute()

  Sentry.addBreadcrumb({
    category: 'api',
    level: 'error',
    message: `${provider} ${method} ${endpointPath ?? url} ${String(status ?? 0)} in ${
      durationMs ?? 0
    }ms`,
    data: {
      provider,
      method,
      endpointPath,
      status: status ?? 0,
      durationMs,
      attempt,
      requestId,
    },
  })

  logger.error('External API error', {
    error,
    provider,
    method,
    url,
    endpointPath,
    status: status ?? 0,
    durationMs,
    attempt,
    ...(routeTag ? { route: routeTag } : {}),
    ...(feature ? { feature } : {}),
    ...(typeof chainId === 'number' ? { chainId } : {}),
    ...(token ? { token } : {}),
    ...(requestId ? { requestId } : {}),
    ...(responseSnippet ? { responseSnippet: String(responseSnippet).slice(0, 500) } : {}),
  })
}

export function captureTxError(params: {
  flow: 'mint' | 'redeem'
  chainId: number
  connectedChainId?: number
  token: string
  inputAsset?: string
  outputAsset?: string
  collateralSlippageBps?: number
  shareSlippageBps?: number
  swapSlippageBps?: number
  flashLoanAdjustmentBps?: number
  amountIn?: string
  expectedOut?: string
  provider?: string
  txHash?: string
  error?: unknown
  decodedName?: string
  route?: string
}) {
  const {
    flow,
    chainId,
    connectedChainId,
    token,
    inputAsset,
    outputAsset,
    collateralSlippageBps,
    shareSlippageBps,
    swapSlippageBps,
    flashLoanAdjustmentBps,
    amountIn,
    expectedOut,
    provider,
    txHash,
    error,
    decodedName,
    route,
  } = params

  const status = txHash ? 'tx-reverted' : 'submit-failed'
  const routeTag = route ?? getCurrentRoute()

  Sentry.addBreadcrumb({
    category: 'tx',
    level: 'error',
    message: `${flow} ${status}${decodedName ? ` ${decodedName}` : ''}`,
    data: {
      flow,
      chainId,
      connectedChainId,
      token,
      inputAsset,
      outputAsset,
      collateralSlippageBps,
      shareSlippageBps,
      swapSlippageBps,
      flashLoanAdjustmentBps,
      amountIn,
      expectedOut,
      provider,
      txHash,
      status,
      decodedName,
    },
  })

  logger.error('On-chain transaction error', {
    error,
    flow,
    chainId,
    ...(typeof connectedChainId === 'number' ? { connectedChainId } : {}),
    token,
    ...(inputAsset ? { inputAsset } : {}),
    ...(outputAsset ? { outputAsset } : {}),
    ...(typeof collateralSlippageBps === 'number' ? { collateralSlippageBps } : {}),
    ...(typeof shareSlippageBps === 'number' ? { shareSlippageBps } : {}),
    ...(typeof flashLoanAdjustmentBps === 'number' ? { flashLoanAdjustmentBps } : {}),
    ...(typeof swapSlippageBps === 'number' ? { swapSlippageBps } : {}),
    ...(amountIn ? { amountIn } : {}),
    ...(expectedOut ? { expectedOut } : {}),
    ...(provider ? { provider } : {}),
    ...(txHash ? { txHash } : {}),
    ...(decodedName ? { decodedName } : {}),
    ...(routeTag ? { route: routeTag } : {}),
    status,
  })
}

export function captureMintPlanError(params: {
  errorString: string
  shareSlippageBps: number
  swapSlippageBps: number
  flashLoanAdjustmentBps: number
  routerPreview: {
    shares: bigint
    debt: bigint
  }
  debtToCollateralQuote: Quote
  managerPreview?: {
    debt: bigint
  }
  managerMin?: {
    debt: bigint
    shares: bigint
  }
  flashLoanAmount: bigint
}) {
  const {
    errorString,
    shareSlippageBps,
    swapSlippageBps,
    flashLoanAdjustmentBps,
    routerPreview,
    debtToCollateralQuote,
    managerPreview,
    managerMin,
    flashLoanAmount,
  } = params

  Sentry.addBreadcrumb({
    category: 'mint_plan',
    level: 'error',
    message: errorString,
    data: {
      shareSlippageBps,
      swapSlippageBps,
      flashLoanAdjustmentBps,
      routerPreview,
      debtToCollateralQuote,
      managerPreview,
      managerMin,
      flashLoanAmount,
    },
  })

  logger.error('Mint plan error', {
    errorString,
    shareSlippageBps,
    swapSlippageBps,
    flashLoanAdjustmentBps,
    routerPreview,
    debtToCollateralQuote,
    managerPreview,
    managerMin,
    flashLoanAmount,
  })
}

export function captureRedeemPlanError(params: {
  errorString: string
  collateralSlippageBps: number
  swapSlippageBps: number
  collateralSwapAdjustmentBps: number
  previewRedeem: {
    collateral: bigint
    debt: bigint
    shares: bigint
    treasuryFee: bigint
    tokenFee: bigint
  }
  previewEquity: bigint
  minCollateralForSender?: bigint
  collateralToSpend?: bigint
  collateralToDebtQuote?: Quote
}) {
  const {
    errorString,
    collateralSlippageBps,
    swapSlippageBps,
    collateralSwapAdjustmentBps,
    previewRedeem,
    previewEquity,
    minCollateralForSender,
    collateralToDebtQuote,
    collateralToSpend,
  } = params

  Sentry.addBreadcrumb({
    category: 'redeem_plan',
    level: 'error',
    message: errorString,
    data: {
      collateralSlippageBps,
      swapSlippageBps,
      collateralSwapAdjustmentBps,
      previewRedeem,
      previewEquity,
      minCollateralForSender,
      collateralToSpend,
      collateralToDebtQuote,
    },
  })

  logger.error('Redeem plan error', {
    errorString,
    collateralSlippageBps,
    swapSlippageBps,
    collateralSwapAdjustmentBps,
    previewRedeem,
    previewEquity,
    minCollateralForSender,
    collateralToSpend,
    collateralToDebtQuote,
  })
}
