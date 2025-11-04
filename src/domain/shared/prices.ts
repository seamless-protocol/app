import { formatUnits, parseUnits } from 'viem'

export const USD_DECIMALS = 8

export function parseUsdPrice(value: number | string): bigint {
  return parseUnits(String(value ?? 0), USD_DECIMALS)
}

export function toScaledUsd(
  amountBase: bigint,
  tokenDecimals: number,
  priceScaledUsd: bigint,
): bigint {
  if (amountBase <= 0n || priceScaledUsd <= 0n) return 0n
  const scale = 10n ** BigInt(tokenDecimals)
  return (amountBase * priceScaledUsd) / scale
}

export function usdAdd(a: bigint, b: bigint): bigint {
  return a + b
}

export function usdDiffFloor(a: bigint, b: bigint): bigint {
  return a > b ? a - b : 0n
}

export function usdToString(usdScaled: bigint): string {
  return formatUnits(usdScaled, USD_DECIMALS)
}

export function usdToFixedString(usdScaled: bigint, fractionDigits = 2): string {
  const raw = formatUnits(usdScaled, USD_DECIMALS)
  const [intPartRaw, fracPartRaw] = raw.split('.')
  const intPart = intPartRaw ?? '0'
  const fracPart = fracPartRaw ?? ''
  if (fractionDigits <= 0) return intPart
  const padded = `${fracPart}0000000000`.slice(0, fractionDigits)
  return `${intPart}.${padded}`
}
