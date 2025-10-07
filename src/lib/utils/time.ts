/**
 * High-resolution current time in milliseconds, if available.
 * Falls back to Date.now() in environments without performance.now().
 */
export function getNowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

/**
 * Compute elapsed time in whole milliseconds since a given start time.
 * Assumes the start value was captured via getNowMs().
 */
export function elapsedMsSince(start: number): number {
  return Math.round(getNowMs() - start)
}
