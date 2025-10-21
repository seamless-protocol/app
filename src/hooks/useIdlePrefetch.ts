import { useEffect } from 'react'

/**
 * Prefetch a dynamic import when the browser is idle (or after a short delay fallback).
 * Useful to keep initial bundles small while making heavy UI feel instant.
 */
export function useIdlePrefetch(importer: () => Promise<unknown>, delayMs = 300): void {
  useEffect(() => {
    const prefetch = () => {
      importer().catch(() => {})
    }

    type IdleAPI = {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }

    const w: IdleAPI | null = typeof window !== 'undefined' ? (window as unknown as IdleAPI) : null

    if (w?.requestIdleCallback) {
      const id = w.requestIdleCallback(prefetch)
      return () => {
        if (w.cancelIdleCallback) w.cancelIdleCallback(id)
      }
    }

    const t = setTimeout(prefetch, delayMs)
    return () => clearTimeout(t)
  }, [importer, delayMs])
}
