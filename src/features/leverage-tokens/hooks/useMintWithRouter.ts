import { useMutation } from '@tanstack/react-query'
import type { MintContext, MintParams, MintResult } from '@/domain/mint-with-router'
import { mintWithRouter } from '@/domain/mint-with-router'

/**
 * Thin hook wrapper around the domain-level mintWithRouter.
 * Note: Not wired into any UI in slice 1. Safe to export for future use.
 */
export function useMintWithRouter() {
  return useMutation<MintResult, Error, { ctx: MintContext; params: MintParams }>({
    mutationFn: ({ ctx, params }) => mintWithRouter(ctx, params),
  })
}
