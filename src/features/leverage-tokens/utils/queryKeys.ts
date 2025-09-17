import type { Address } from 'viem'

/**
 * Hierarchical query keys for leverage tokens
 * Follows TanStack Query best practices for cache invalidation
 */
export const ltKeys = {
  all: ['leverage-tokens'] as const,
  // Chain scoping (optional; use when the same address can exist across chains)
  chain: (chainId: number) => [...ltKeys.all, 'chain', chainId] as const,
  factory: () => [...ltKeys.all, 'factory'] as const,
  tokens: () => [...ltKeys.all, 'tokens'] as const,
  token: (addr: Address) => [...ltKeys.tokens(), addr] as const,
  tokenOnChain: (chainId: number, addr: Address) =>
    [...ltKeys.chain(chainId), 'token', addr] as const,
  user: (addr: Address, owner: Address) => [...ltKeys.token(addr), 'user', owner] as const,
  supply: (addr: Address) => [...ltKeys.token(addr), 'supply'] as const,
  price: (addr: Address) => [...ltKeys.token(addr), 'price'] as const,
  // Live state and TVL keys
  state: (addr: Address) => [...ltKeys.token(addr), 'state'] as const,
  tvl: (addr: Address) => [...ltKeys.token(addr), 'tvl'] as const,
  protocolTvl: () => [...ltKeys.all, 'protocol-tvl'] as const,
  tableData: () => [...ltKeys.all, 'table-data'] as const,
  rebalancing: (addr: Address) => [...ltKeys.token(addr), 'rebalancing'] as const,
  metadata: (addr: Address) => [...ltKeys.token(addr), 'metadata'] as const,
  detailedMetrics: (addr: Address) => [...ltKeys.token(addr), 'detailed-metrics'] as const,
  apy: (addr: Address) => [...ltKeys.token(addr), 'apy'] as const,
  simulation: {
    mint: (addr: Address, amount: bigint) =>
      [...ltKeys.token(addr), 'simulate', 'mint', amount.toString()] as const,
    mintOnChain: (chainId: number, addr: Address, amount: bigint) =>
      [...ltKeys.tokenOnChain(chainId, addr), 'simulate', 'mint', amount.toString()] as const,
    mintKey: (params: { chainId: number | undefined; addr: Address; amount: bigint }) =>
      typeof params.chainId === 'number'
        ? ltKeys.simulation.mintOnChain(params.chainId, params.addr, params.amount)
        : ltKeys.simulation.mint(params.addr, params.amount),
    redeem: (addr: Address, amount: bigint) =>
      [...ltKeys.token(addr), 'simulate', 'redeem', amount.toString()] as const,
    redeemOnChain: (chainId: number, addr: Address, amount: bigint) =>
      [...ltKeys.tokenOnChain(chainId, addr), 'simulate', 'redeem', amount.toString()] as const,
    redeemKey: (params: { chainId: number | undefined; addr: Address; amount: bigint }) =>
      typeof params.chainId === 'number'
        ? ltKeys.simulation.redeemOnChain(params.chainId, params.addr, params.amount)
        : ltKeys.simulation.redeem(params.addr, params.amount),
  },
  // External data sources (shared across all tokens)
  external: {
    etherFiApr: () => [...ltKeys.all, 'external', 'etherfi-apr'] as const,
    borrowApy: (addr: Address) => [...ltKeys.all, 'external', 'borrow-apy', addr] as const,
    leverageRatios: (addr: Address) =>
      [...ltKeys.all, 'external', 'leverage-ratios', addr] as const,
    rewardsApr: (addr: Address) => [...ltKeys.all, 'external', 'rewards-apr', addr] as const,
  },
} as const
