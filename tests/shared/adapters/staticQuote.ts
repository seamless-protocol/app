import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Address, Hex } from 'viem'
import { getAddress } from 'viem'
import type { QuoteFn } from '@/domain/shared/adapters/types'

export interface StaticQuoteSnapshot {
  inToken: Address
  outToken: Address
  amountIn: bigint
  amountOut: bigint
  minAmountOut?: bigint
  approvalTarget: Address
  callTarget: Address
  calldata: Hex
}

export interface CreateStaticQuoteAdapterOptions {
  snapshot: StaticQuoteSnapshot
  enforceAmountIn?: boolean
  enforceTokens?: boolean
  label?: string
}

export async function loadStaticQuoteSnapshot(options: {
  path: string
  baseDir?: string
  selector?: string
}): Promise<StaticQuoteSnapshot> {
  const absolutePath = resolve(options.baseDir ?? process.cwd(), options.path)
  const raw = await readFile(absolutePath, 'utf8')
  const json = JSON.parse(raw) as unknown
  const payload =
    options.selector && typeof json === 'object' && json !== null
      ? ((json as Record<string, unknown>)[options.selector] ?? json)
      : json
  return normalizeStaticQuotePayload(payload)
}

export function createStaticQuoteAdapter({
  snapshot,
  enforceAmountIn = true,
  enforceTokens = true,
  label,
}: CreateStaticQuoteAdapterOptions): QuoteFn {
  const normalized = normalizeSnapshot(snapshot)
  const description = label ? `[static-quote:${label}]` : '[static-quote]'

  if (normalized.callTarget !== normalized.approvalTarget) {
    console.warn(
      `${description} approval target ${normalized.approvalTarget} differs from call target ${normalized.callTarget}; ensure router calls are wired correctly`,
    )
  }

  return async ({ inToken, outToken, amountIn, intent }) => {
    if (intent && intent !== 'exactIn') {
      throw new Error(`${description} only supports exactIn quotes`)
    }

    if (enforceTokens) {
      const expectedIn = normalized.inToken
      const expectedOut = normalized.outToken
      if (getAddress(inToken) !== expectedIn) {
        throw new Error(
          `${description} requested inToken ${getAddress(inToken)} does not match recorded inToken ${expectedIn}`,
        )
      }
      if (getAddress(outToken) !== expectedOut) {
        throw new Error(
          `${description} requested outToken ${getAddress(outToken)} does not match recorded outToken ${expectedOut}`,
        )
      }
    }

    if (enforceAmountIn && amountIn !== normalized.amountIn) {
      throw new Error(
        `${description} amountIn ${amountIn.toString()} does not match recorded amountIn ${normalized.amountIn.toString()}`,
      )
    }

    return {
      out: normalized.amountOut,
      minOut: normalized.minAmountOut ?? normalized.amountOut,
      approvalTarget: normalized.approvalTarget,
      calldata: normalized.calldata,
    }
  }
}

function normalizeSnapshot(snapshot: StaticQuoteSnapshot): StaticQuoteSnapshot {
  const result: StaticQuoteSnapshot = {
    inToken: getAddress(snapshot.inToken),
    outToken: getAddress(snapshot.outToken),
    amountIn: snapshot.amountIn,
    amountOut: snapshot.amountOut,
    approvalTarget: getAddress(snapshot.approvalTarget),
    callTarget: getAddress(snapshot.callTarget),
    calldata: snapshot.calldata,
  }
  if (typeof snapshot.minAmountOut !== 'undefined') {
    result.minAmountOut = snapshot.minAmountOut
  }
  return result
}

function normalizeStaticQuotePayload(payload: unknown): StaticQuoteSnapshot {
  if (isStaticSnapshotShape(payload)) {
    const callTargetSource =
      typeof payload['callTarget'] === 'string' ? payload['callTarget'] : payload['approvalTarget']
    const result: StaticQuoteSnapshot = {
      inToken: getAddress(payload['inToken'] as string),
      outToken: getAddress(payload['outToken'] as string),
      amountIn: toBigInt(payload['amountIn'], 'amountIn'),
      amountOut: toBigInt(payload['amountOut'], 'amountOut'),
      approvalTarget: getAddress(payload['approvalTarget'] as string),
      callTarget: getAddress(callTargetSource as string),
      calldata: payload['calldata'] as Hex,
    }
    if (typeof payload['minAmountOut'] !== 'undefined') {
      result.minAmountOut = toBigInt(payload['minAmountOut'], 'minAmountOut')
    }
    return result
  }

  if (isLiFiQuotePayload(payload)) {
    const inToken = getAddress(payload['action']['fromToken']['address'])
    const outToken = getAddress(payload['action']['toToken']['address'])
    const amountIn = toBigInt(
      payload['action']['fromAmount'] ?? payload['estimate']?.['fromAmount'],
      'fromAmount',
    )
    const amountOut = toBigInt(payload['estimate']?.['toAmount'], 'toAmount')
    const minAmountOut = payload['estimate']?.['toAmountMin']
      ? toBigInt(payload['estimate']['toAmountMin'], 'toAmountMin')
      : undefined
    const approvalSource =
      payload['estimate']?.['approvalAddress'] ?? payload['transactionRequest']?.['to']
    if (!approvalSource) {
      throw new Error('Static LiFi quote missing approval target')
    }
    const approvalTarget = getAddress(approvalSource)
    const callTargetSource =
      payload['transactionRequest']?.['to'] ??
      payload['estimate']?.['approvalAddress'] ??
      approvalSource
    const callTarget = getAddress(callTargetSource)
    const calldata = payload['transactionRequest']?.['data']
    if (!calldata || typeof calldata !== 'string') {
      throw new Error('Static LiFi quote missing transactionRequest.data')
    }

    const result: StaticQuoteSnapshot = {
      inToken,
      outToken,
      amountIn,
      amountOut,
      approvalTarget,
      callTarget,
      calldata: calldata as Hex,
    }
    if (typeof minAmountOut !== 'undefined') {
      result.minAmountOut = minAmountOut
    }
    return result
  }

  throw new Error('Unsupported static quote payload format')
}

function toBigInt(value: unknown, field: string): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string' && value.trim() !== '') {
    return BigInt(value)
  }
  throw new Error(`Invalid ${field} value for static quote`)
}

function isStaticSnapshotShape(payload: unknown): payload is {
  inToken: string
  outToken: string
  amountIn: string | number | bigint
  amountOut: string | number | bigint
  minAmountOut?: string | number | bigint
  approvalTarget: string
  callTarget?: string
  calldata: string
} {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  return (
    typeof candidate['inToken'] === 'string' &&
    typeof candidate['outToken'] === 'string' &&
    typeof candidate['amountIn'] !== 'undefined' &&
    typeof candidate['amountOut'] !== 'undefined' &&
    typeof candidate['approvalTarget'] === 'string' &&
    typeof candidate['calldata'] === 'string'
  )
}

function isLiFiQuotePayload(payload: unknown): payload is {
  action: {
    fromToken: { address: string }
    toToken: { address: string }
    fromAmount?: string
  }
  estimate?: {
    fromAmount?: string
    toAmount?: string
    toAmountMin?: string
    approvalAddress?: string
  }
  transactionRequest?: {
    to?: string
    data?: string
  }
} {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  if (!candidate['action'] || typeof candidate['action'] !== 'object') return false
  const action = candidate['action'] as Record<string, unknown>
  if (!action['fromToken'] || typeof action['fromToken'] !== 'object') return false
  if (!action['toToken'] || typeof action['toToken'] !== 'object') return false
  const fromToken = action['fromToken'] as Record<string, unknown>
  const toToken = action['toToken'] as Record<string, unknown>
  if (typeof fromToken['address'] !== 'string') return false
  if (typeof toToken['address'] !== 'string') return false
  return true
}

export function normalizeStaticQuote(json: unknown): StaticQuoteSnapshot {
  return normalizeStaticQuotePayload(json)
}
