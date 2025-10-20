# Portfolio Graph: Warm Prefetch + Correct Historical Valuation

Owner: Portfolio
Status: Planning
Related PR/Issue: https://github.com/seamless-protocol/app/pull/371, https://github.com/seamless-protocol/app/issues/380

## Goals
- Open `/portfolio` with warm cache immediately after wallet connect and on Portfolio-nav hover.
- Render performance chart in ~200ms on cache hit with correct historical USD valuation and balances.
- Correct timeframe windows and baseline handling; scale to 50–100 collaterals without UI jank.

## Current Issues
- Timeframe window drift (e.g., 90D only shows early Oct → now), missing explicit baseline at `from`.
- If minted before `from` and no changes within window, `_getBalanceAtTimestamp` returns 0 ⇒ flatline at 0.
- Decimals handling defaults to 18 in valuation, ignores collateral decimals.
- Historical valuation uses spot USD instead of historical USD at each timestamp.
- Naming ambiguity: balance history `amount` looks like a delta; it is the final/absolute balance at that event.

## Acceptance Criteria
- Navigating to `/portfolio` post-connect uses cache: no extra calls for portfolio data, balance history, or USD history.
- Chart uses historical USD series with correct baseline at `timestamp_lt: from`.
- Renders within ~200ms on cache hit; scales to 50–100 collaterals without jank.

## Scope
- Prefetch on connect and Portfolio-nav hover/focus for:
  - `portfolioKeys.data(address)` (positions + state history)
  - Balance history for default timeframe + baseline event
  - Historical USD series for all collateral tokens in `[from, now]` per chain (CoinGecko range)
- Fallback prefetch in route loader if not warmed.

## Design Overview

### Timeframes
- Supported: `7D | 30D | 90D | 1Y`.
- Default prefetch timeframe: `30D` with a ~48h lookback buffer when computing the baseline (`timestamp_lt: from`) to avoid edge off-by-one gaps from microsecond granularity.

### Baseline Event
- For each leverage token held, fetch the last balance change before `from` and prepend this baseline to the in-window history so `_getBalanceAtTimestamp` can return a non-zero balance at window start.
- Query shape: `first: 1, orderBy: timestamp, orderDirection: desc, where: { position_: { user }, leverageToken_in: [addresses], timestamp_lt: from }`.
- Implementation: new GraphQL query + fetcher, merged at call site that already fetches `[from, now]` history.

### Historical USD Prices
- Source: CoinGecko `coins/{platform}/contract/{address}/market_chart/range`.
- Fetch per-chain per-asset USD series for `[from, now]` and cache as `['usd-history', byChain, from, to]`.
- Expose `getUsdPriceAt(address, ts)` that returns the nearest-prior price for any timestamp (including baseline).
- Respect `VITE_COINGECKO_API_URL` and pass `x-cg-pro-api-key` header if `VITE_COINGECKO_API_KEY` is set.
- Concurrency cap (e.g., 4–6 concurrent requests) and batching by chain to scale to 50–100 assets.

### Execution Model (No Per‑Point Fetches)
- Network
  - 1 CoinGecko range request per unique `(chainId, collateralAddress)` for the selected `[from, to]` window.
  - Requests are grouped by chain and limited with small concurrency (default 5) to avoid rate limits.
- Lookup
  - During chart generation, every price lookup uses `getUsdPriceAt(chainId, address, ts)` which performs an in‑memory nearest‑prior binary search over the cached series. No network calls at this stage.
- Fallback
  - If a specific historical price is missing, fall back to the spot USD map for that asset only (graceful degradation).

### Decimals Handling
- Use actual collateral decimals for all historical valuations:
  - Build a map `{ leverageTokenAddress → collateralDecimals }` from `getAllLeverageTokenConfigs()` and use it in calculations.

### Prefetch Triggers
- On wallet connect in `MainLayout`.
- On Portfolio nav hover/focus in `VerticalNavbar`.
- Route loader fallback in `src/routes/portfolio.tsx` if cache is cold.

## Implementation Plan

### 1) GraphQL: Baseline Before Window
- Add query to `src/lib/graphql/queries/portfolio.ts` for `timestamp_lt: $from` baseline.
- Add fetcher `fetchUserBalanceBaselineBeforeWindow(userAddress, tokenAddresses, fromTimestamp)` in `src/lib/graphql/fetchers/portfolio.ts` that:
  - Executes per-chain, per-token (or batched list with `leverageToken_in`) with `first: 1`, `orderDirection: desc`.
  - Returns at most one event per token per chain.
- Merge baseline with in-window `fetchUserBalanceHistory` results in `usePortfolioPerformance()` callsite at:
  - `src/features/portfolio/hooks/usePortfolioDataFetcher.ts:539` (the balance history block).
  - Prepend baseline event(s) to the list returned to `generatePortfolioPerformanceData`.

### 2) Historical USD API + Hook
- Add `fetchCoingeckoTokenUsdPricesRange(chainId, address, from, to)` to `src/lib/prices/coingecko.ts`.
  - Use `getApiEndpoint('coingecko')` like spot pricing; include `x-cg-pro-api-key` when `VITE_COINGECKO_API_KEY` exists.
  - Normalize base API variants (with/without `/api/v3`).
- Add `useHistoricalUsdPricesMultiChain({ byChain, from, to, concurrency? })` in `src/lib/prices/useUsdPricesHistory.ts`:
  - Returns `{ [chainId]: { [addressLower]: Array<[tsSec, usd]> } }` plus helpers.
  - Cache key: `['usd-history', byChain, from, to]`.
  - Provide `getUsdPriceAt(address, ts)` nearest-prior lookup via binary search.
  - Uses a small concurrency helper (`mapWithConcurrency`) to cap simultaneous CoinGecko requests (default 5). Preserves input order and rejects on first failure. This avoids hammering CoinGecko while keeping fetches snappy for 50–100 assets.

### 3) Portfolio Calculations
- Update `generatePortfolioPerformanceData` in `src/features/portfolio/utils/portfolio-calculations.ts:228`:
  - Replace `usdPrices: Record<string, number>` param with `getUsdPriceAt: (address: string, ts: number) => number | undefined`.
  - Use `getUsdPriceAt(collateralAssetAddress, timestamp)` for every point, including baseline.
  - Accept `collateralDecimalsByLeverageToken: Record<string, number>` and use correct decimals when converting equity-per-token values.
- Fix `_calculatePortfolioValueAtTimestamp` to:
  - Use decimals map instead of fallback 18 for `formatUnits`.
  - Call `getUsdPriceAt` instead of spot USD map.
- Consider generating a time grid for the chart window (e.g., daily for 90D, weekly for 1Y) to ensure the whole window is represented even if state timestamps are sparse; fill using nearest-prior balances and prices.

### 4) Hook Wiring
- `usePortfolioPerformance()` in `src/features/portfolio/hooks/usePortfolioDataFetcher.ts:520`:
  - Build `addressesByChain` from user positions (already implemented at `usePortfolioWithTotalValue()`); reuse similar logic.
  - Fetch balance history for `[from, now]` and merge-in baseline event(s).
  - Call `useHistoricalUsdPricesMultiChain` to warm price ranges.
  - Thread `getUsdPriceAt` and `collateralDecimalsByLeverageToken` into `generatePortfolioPerformanceData`.

### 5) Prefetching
- `src/components/main-layout.tsx`:
  - On wallet connect: get `address` + `queryClient`; prefetch:
    - `queryClient.ensureQueryData({ queryKey: portfolioKeys.data(address) })`.
    - `queryClient.prefetchQuery([...portfolioKeys.performance('30D', address), 'balance-history'])` with 48h lookback included when computing baseline.
    - `queryClient.prefetchQuery(['usd-history', byChain, from, to])` (via helper) for historical series.
- `src/components/VerticalNavbar.tsx`:
  - In `NavigationItem` hover handler, if `item.id === 'portfolio'` and not already prefetched, prime the same three queries using the above helpers.
- `src/routes/portfolio.tsx`:
  - Add loader fallback to ensure the three queries are ensured in the cache if entering directly via URL.

## File Changes Summary
- Add: `src/lib/prices/useUsdPricesHistory.ts` (new hook + getUsdPriceAt).
- Add: `fetchCoingeckoTokenUsdPricesRange` in `src/lib/prices/coingecko.ts`.
- Add: GraphQL query for baseline and a fetcher `fetchUserBalanceBaselineBeforeWindow`.
- Update: `src/features/portfolio/hooks/usePortfolioDataFetcher.ts:539` to merge baseline and use historical prices.
- Update: `src/features/portfolio/utils/portfolio-calculations.ts:228` signature and valuation to use decimals map + `getUsdPriceAt`.
- Update: `src/components/main-layout.tsx` to prefetch on wallet connect.
- Update: `src/components/VerticalNavbar.tsx` to prefetch on nav hover/focus (Portfolio).
- Optional: Add a route loader in `src/routes/portfolio.tsx` as a fallback ensure.

## Decimals Map
- Build once per render from `getAllLeverageTokenConfigs()`.
- Shape: `{ [leverageTokenAddressLower]: collateralDecimals }`.
- Pass to valuation functions and format using `formatUnits(value, decimals)`.

## Balance Semantics
- Clarify that `BalanceChange.amount` is the absolute balance at that event (not delta). Update inline docs and link to subgraph schema line in `src/lib/graphql/queries/portfolio.ts` once finalized.
- Callers must use “latest at or before ts” for balance at timestamp.

## Caching Keys
- Portfolio data: `portfolioKeys.data(address)` (already exists).
- Balance window: `[...portfolioKeys.performance(timeframe, address), 'balance-history']` (already exists at `src/features/portfolio/hooks/usePortfolioDataFetcher.ts:541`).
- Historical USD: `['usd-history', byChain, from, to]`.

## Concurrency + Perf
- Cap concurrent CoinGecko range calls (e.g., p-limit with 4–6).
- Avoid recomputation by memoizing `addressesByChain` and decimals map.
- Use binary search for nearest-prior series lookup; sort once per asset.
- Ensure flattened price map remains optional for legacy consumers; prefer range accessor for performance data.

## Testing & Validation
- Unit: `_getBalanceAtTimestamp` with baseline present/absent; decimals correctness; nearest-prior price lookup.
- Integration (Tenderly VNet default):
  - Prefetch triggers on wallet connect and Portfolio hover; cache hit path renders without network.
  - Balance baseline correctness for “minted before window, unchanged within window”.
  - 90D window includes baseline at `from` and points up to `now`.
- E2E (Playwright): “Happy Path” renders chart with non-zero start when minted before window and unchanged.

## Rollout & Fallbacks
- If historical price fetch fails, fallback to spot USD for that asset only (gracefully degrade) and log a warning; do not block chart if other assets are priced.
- Keep existing spot-price path for table summaries; migrate gradually to range where useful.

## Open Questions
- Chart resolution per timeframe (daily for ≤90D, weekly for 1Y) — finalize sampling for performance.
- Schema link for balance-change semantics — add final URL once confirmed.

## References (Clickable)
- Data fetcher balance history window: `src/features/portfolio/hooks/usePortfolioDataFetcher.ts:539`
- Performance generator entrypoint: `src/features/portfolio/utils/portfolio-calculations.ts:228`
- Main layout (prefetch insertion): `src/components/main-layout.tsx:1`
- Vertical navbar (hover prefetch insertion): `src/components/VerticalNavbar.tsx:1`
- CoinGecko client: `src/lib/prices/coingecko.ts:1`
- Spot USD multi-chain hook: `src/lib/prices/useUsdPricesMulti.ts:1`
- Portfolio route: `src/routes/portfolio.tsx:1`
