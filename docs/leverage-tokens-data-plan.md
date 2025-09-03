# Leverage Tokens – Data Integration Plan

## Overview

We currently render the leverage token pages using mock data (`src/features/leverage-tokens/data/mockData.ts`). The goal is to replace mock data with live data from on-chain contracts and off-chain services (pricing, history), while keeping the UI responsive and robust.

This document scopes the required data, proposes an optimal representation, explains why separate hooks per data slice make sense, and outlines a pragmatic integration plan that fits the existing code structure (`ltKeys`, `STALE_TIME`, `wagmi/react-query`).

## Current State

- Detail page (`src/routes/tokens.$id.tsx`) consumes a composed `leverageTokenPageData` from mock data.
- Existing hooks:
  - `useTokenMetadata` (multicall name/symbol/decimals/totalSupply) – not currently wired into the page.
  - `useMintViaRouter` – production-style, contract-aware write flow.
- Query infra present: `ltKeys` (hierarchical keys) and `STALE_TIME` per data category.

## Why Separate Hooks

Separate hooks per data slice on a complex page are beneficial because they:

- Parallelize fetch: Independent queries resolve concurrently for faster first paint.
- Cache correctly: Each slice gets its own cache key and `staleTime` (e.g., price 10s vs. metadata 5m).
- Degrade gracefully: Individual sections can show skeletons/errors without blocking the whole page.
- Compose cleanly: Hooks have single responsibility and are easy to test/memoize.
- Optimize refetch: User-only data (balances/allowances) refetch on wallet changes; global data does not.
- Enable targeted invalidation: Writes (mint/redeem) invalidate only affected keys (e.g., `supply`, `user`).

This matches the prior “first version” approach and aligns with TanStack Query best practices already scaffolded in the repo.

## Data Model (first principles)

Domain objects we need to render and interact:

- TokenCore: address, chainId, name, symbol, decimals, leverageRatio, collateralAsset, debtAsset.
- MarketData: price, change24h, change7d, marketCap, volume24h.
- Supply: totalSupply, supplyCap, utilizationRate, isNearCapacity.
- APY: total, baseYield, borrowRate, rewardMultiplier, pointsPerDay.
- Risk: liquidationThreshold, healthFactor, maxLeverage, rebalanceThreshold.
- Rebalancing: lastRebalance, nextRebalance, isRebalancing, currentRatio, targetRatio, thresholdBreached.
- UserPosition: balance (shares), value, entryPrice, currentPrice, pnl, pnlPercentage.
- PriceHistory: array of { date ISO, price, weethPrice?, leverageTokenPrice }.
- Resources/FAQ: static or CMS-sourced auxiliary content.

Notes

- On-chain sources: ERC20 (name/symbol/decimals/totalSupply/balanceOf), `LeverageManager` (collateralAsset, debtAsset, previewMint, rebalancing params if exposed), possibly `LeverageToken`/`Factory` for config (target leverage, caps) — we may need to extend included ABIs.
- Off-chain sources: price spot + history, TVL, APY breakdown inputs (staking yields, borrow rates, rewards). Options include subgraph/indexer or an internal API that aggregates sources.

## Hook Design (granular)

Each hook below should use `ltKeys` for caching and `STALE_TIME` for freshness. They can be composed by a higher-level aggregator hook used by the page.

- useLeverageTokenCore(token)
  - Source: ERC20 + LeverageManager (+ Factory if needed).
  - Returns: TokenCore.
  - Cache: `ltKeys.metadata(token)`, stale 5m.

- useLeverageTokenMarket(token)
  - Source: price service (token and underlying), compute changes.
  - Returns: MarketData.
  - Cache: `ltKeys.price(token)`, stale 10s.

- useLeverageTokenSupply(token)
  - Source: ERC20 totalSupply; supplyCap via Manager/Factory/config; utilization derived.
  - Returns: Supply.
  - Cache: `ltKeys.supply(token)`, stale 30s.

- useLeverageTokenApy(token)
  - Source: off-chain yields/borrow rates/rewards or on-chain approximations.
  - Returns: APY.
  - Cache: `ltKeys.token(token)+['apy']`, stale 60s–5m depending on source.

- useLeverageTokenRisk(token)
  - Source: Manager/Token config; extend ABI as needed.
  - Returns: Risk.
  - Cache: `ltKeys.token(token)+['risk']`, stale 1m.

- useRebalancingStatus(token)
  - Source: Manager (status or event-derived), extend ABI as needed.
  - Returns: Rebalancing.
  - Cache: `ltKeys.rebalancing(token)`, stale 1m.

- useUserPosition(token, owner)
  - Source: ERC20 balanceOf + pricing to value shares; entry price if tracked off-chain.
  - Returns: UserPosition.
  - Cache: `ltKeys.user(token, owner)`, stale 30s, enabled only when connected.

- usePriceHistory(token, timeframe)
  - Source: off-chain price history API.
  - Returns: PriceHistory[].
  - Cache: `ltKeys.price(token)+['history', timeframe]`, stale 30s–5m by granularity.

Optional utilities

- Multicall batches for ERC20/Manager reads for efficiency.
- Derived selectors/helpers to compute metrics (utilization, APY total).

## Aggregation Pattern

Expose a single page-level composer that the route consumes, which internally calls the slice hooks, but preserves independent loading/error states so sections render progressively.

Example shape:

```ts
function useLeverageTokenPageData(token: Address) {
  const core = useLeverageTokenCore(token)
  const market = useLeverageTokenMarket(token)
  const supply = useLeverageTokenSupply(token)
  const apy = useLeverageTokenApy(token)
  const risk = useLeverageTokenRisk(token)
  const rebalance = useRebalancingStatus(token)
  const { address } = useAccount()
  const user = useUserPosition(token, address as Address)
  const history = usePriceHistory(token, timeframe)

  return { core, market, supply, apy, risk, rebalance, user, history }
}
```

The route/component then maps these to the current UI props (StatCardList, PriceLineChart, DetailedMetrics, etc.).

## Integration Plan (phased)

Phase 1 – Foundations

- Add aggregator `useLeverageTokenPageData` and wire it behind a feature flag, while keeping mock data as fallback.
- Implement `useLeverageTokenCore` (already partially covered by `useTokenMetadata`), and `useLeverageTokenSupply` using existing ABIs.
- Prefetch on list→detail navigation for perceived speed.

Phase 2 – Market & User

- Add `useLeverageTokenMarket` with a stubbed adapter interface that can swap out providers (internal API, subgraph, RedStone, etc.).
- Implement `useUserPosition` (balanceOf + pricing) and replace holdings card mock props.

Phase 3 – Risk & Rebalancing

- Extend ABIs if needed to read risk parameters and rebalancing status; implement `useLeverageTokenRisk` and `useRebalancingStatus`.
- Replace Detailed Metrics mock with live values, keeping tooltips consistent.

Phase 4 – History & APY

- Integrate `usePriceHistory` from an off-chain source with timeframe support and local downsampling.
- Implement `useLeverageTokenApy` by combining base yield (staking), borrow cost, and rewards; expose inputs and computed total.

Phase 5 – Hardening

- Add targeted invalidations on mint/redeem to `supply`, `user`, `price` keys (already aligned with `useMintViaRouter`).
- Add error boundaries per section; loading skeletons per card (already supported by independent hooks).
- Add analytics to measure fetch latencies and cache hit rates.

## External Integrations

- Pricing/History: choose a provider (own indexer API recommended). Define an adapter interface and keep the page decoupled from the concrete provider.
- APY inputs: Morpho/underlying protocol APIs for borrow/lend rates; staking provider yields; rewards controller for multipliers.
- Consider a small backend to cache/normalize volatile data and reduce RPC/HTTP fan-out from the client.

## Representation Guidance

- Keep domain models normalized (TokenCore, MarketData, Supply, etc.).
- Map domain → view models at the route layer to match the current UI props without pushing formatting into hooks.
- Use BigInt for on-chain values; convert and format at render time with existing formatters.
- Respect `STALE_TIME` per category; avoid overfetching and keep queries enabled conditionally (e.g., only fetch user data when connected).

## Gaps & Next Steps

- Extend ABIs if we need: target leverage, supply cap, risk params, rebalance status beyond current slices.
- Decide on price/history provider, and whether we introduce a thin backend layer.
- Implement the first two hooks (Core, Supply) and swap the page from mock → live behind a flag.

