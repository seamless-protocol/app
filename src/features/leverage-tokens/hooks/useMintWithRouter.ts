import { useMutation } from '@tanstack/react-query'
import type { Address } from 'viem'
import type {
  Addresses,
  Clients,
  IoOverrides,
  MintParams,
  MintResult,
} from '@/domain/mint-with-router'
import { mintWithRouter } from '@/domain/mint-with-router'

export interface UseMintWithRouterParams {
  clients: Clients
  addresses: Addresses
  account: Address
  params: MintParams
  io?: IoOverrides
}

/**
 * Thin hook wrapper around the domain-level mintWithRouter.
 * Note: Not wired into any UI in slice 1. Safe to export for future use.
 */
export function useMintWithRouter() {
  return useMutation<MintResult, Error, UseMintWithRouterParams>({
    mutationFn: ({ clients, addresses, account, params, io }) =>
      mintWithRouter(clients, addresses, account, params, io),
  })
}
