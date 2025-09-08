# Leverage Tokens: Data, Caching, and UI Wiring

This document describes how leverage token data (TVL/equity, supply, pricing, and related metrics) is fetched, cached, and rendered across the app. It reflects the current implementation as of the latest PR.

## Goals

- Surface live TVL (equity) and current supply in the Leverage Tokens table.
- Keep a single source of truth per data shape; avoid duplicate reads and per-row hooks.
- Provide a protocol-wide TVL derived from the aggregated data.
- Add USD pricing via a small, batched provider (CoinGecko) without a heavy pricing module.

## Key Definitions

- TVL (token): Uses Manager-reported equity (in debt-asset units) as the token’s TVL base.
  - Rationale: TVL = pricePerShare × totalSupply = equity (in debt units); using equity directly avoids rounding.
- Share price (debt units): equity / totalSupply.
- USD display: Use CoinGecko spot prices for debt assets; treat USD as a convenience layer over native units.
  - Token page shows TVL stat in debt units plus USD.
  - Collateral is a separate stat (not equal to TVL) and is displayed in collateral units plus USD.

## Data Sources (On-Chain and GraphQL)

- On-chain (multi-chain, per token config):
  - `LeverageManager.getLeverageTokenState(token)` → `{ collateralInDebtAsset, debt, equity, collateralRatio }`
  - `LeverageToken.totalSupply()`
- GraphQL (historical / comparison):
  - Charts and comparisons use existing subgraph queries (not part of table TVL path).

- Pricing (CoinGecko, batched):
  - `GET /api/v3/simple/token_price/{platform}?contract_addresses=...&vs_currencies=usd`.
  - Platform mapping: `1 → ethereum`, `8453 → base` (extendable).
  - Returned map (lowercased address → usd) drives simple conversions for table and cards.

## Configuration

- CoinGecko endpoint is configurable via environment (no code changes required). Refer to your local `.env.local`.
- Contract addresses come from `leverageTokens.config.ts`; for each token we also specify `chainId` and `supplyCap`.

## Query Keys (TanStack Query)

File: `src/features/leverage-tokens/utils/queryKeys.ts`

- `ltKeys.state(addr)` → live on-chain state (manager + token)
- `ltKeys.tvl(addr)` → per-token TVL (derived from state; not a separate fetch)
- `ltKeys.tableData()` → aggregated per-token table data (all tokens)
- `ltKeys.protocolTvl()` → protocol-wide TVL (derived from `tableData`)

## Hooks

1) `useLeverageTokensTableData`
- File: `src/features/leverage-tokens/hooks/useLeverageTokensTableData.ts`
- Purpose: Aggregated read for all configured tokens using a single batched call set: `[getLeverageTokenConfig (for adapters), getLeverageTokenState, totalSupply]` per token’s chain.
- Per‑token chain: Each call passes `chainId: cfg.chainId` and resolves `LeverageManager` via `getLeverageManagerAddress(cfg.chainId)` (no dependency on the wallet’s chain).
- Returns array shaped for `LeverageTokenTable` with live `tvl` (equity in debt units), optional `tvlUsd` (if price available), and `currentSupply` (scaled decimals).
- Supply cap: sourced from config (`leverageTokens.config.ts → supplyCap`, token units). No subgraph.
- Refresh: `staleTime = STALE_TIME.supply` (30s), `refetchInterval = 30_000`.
- UI changes: The “Total Collateral” column was removed from the table to reduce on-chain calls and simplify the view.

2) `useLeverageTokenState`
- File: `src/features/leverage-tokens/hooks/useLeverageTokenState.ts`
- Purpose: Per-token read for detail views; uses `useReadContracts` with `[getLeverageTokenState, totalSupply]` and accepts a chain override.
- Returns `{ totalSupply, collateralInDebtAsset, debt, equity, collateralRatio }`.
- Not used in table rows (to avoid N-per-row hooks).

3) `useProtocolTVL`
- File: `src/features/leverage-tokens/hooks/useProtocolTVL.ts`
- Purpose: Derives protocol TVL by summing token `tvl` from `useLeverageTokensTableData`.
- Avoids extra RPC calls; consumers can render total at nav/analytics.

3) `useUsdPrices`
- File: `src/lib/prices/useUsdPrices.ts`
- Purpose: Batched CoinGecko USD prices for a set of addresses on a chain.
- Returns `{ [addressLower]: usd }` with `staleTime = 15s`, `refetchInterval = 15s`.
- Used by `useLeverageTokensTableData` to compute `tvlUsd`.

4) `useLeverageTokenCollateral`
- File: `src/features/leverage-tokens/hooks/useLeverageTokenCollateral.ts`
- Purpose: Resolve `lendingAdapter` from manager config (per token/chain), then read `getCollateral()` in collateral units for the token details page.
- Refresh: `staleTime = 30s`, `refetchInterval = 30_000`.

Previously planned (revised):

• Potential future extensions
- Subgraph-backed price source as an alternative provider, behind the same hook interface.
- `useLeverageTokenPrice(token)`: price per share (debt units) × USD price for detail views.

## Data Flow & UI Wiring

- Page: `src/routes/tokens.index.tsx`
  - Uses `useLeverageTokensTableData()` → renders `LeverageTokenTable` and `FeaturedLeverageTokens`.
  - Loading/Error states handled at page level.
  - Row click routes to `/tokens/$id`.

- Detail Page: `src/routes/tokens.$chainId.$id.tsx`
  - Shows TVL (equity in debt units + USD). Uses `useLeverageTokenState` and `useUsdPrices`.
  - Shows “Total Collateral” (collateral units + USD). Uses `useLeverageTokenCollateral` and `useUsdPrices`.
  - Risk/parameters panel uses `useLeverageTokenDetailedMetrics` (5m stale time).
  - Uses `Skeleton` placeholders while TVL/collateral/prices load.

## Caching & Refresh Strategy

- Query cache keys are hierarchical (see `ltKeys`).
- Supply/state/collateral data: `staleTime` and `refetchInterval` at ~30s for consistent refresh frequency.
- USD prices (CoinGecko): `staleTime` and `refetchInterval` at ~15s; batched per chain to avoid rate limits.
- Invalidation: mint/redeem flows should invalidate `ltKeys.tableData()` and `ltKeys.state(token)` precisely.

## Error & Loading

- Table: displays loading placeholder and a minimal error message on failure.
- Per-token failures in aggregated results are tolerated (rows default to zero/placeholder), though the query currently fails only on catastrophic errors.
- Token page stat cards: use `Skeleton` for TVL/collateral and their USD captions when respective queries are loading.

## Performance

- Multicall batching via `useReadContracts` for all tokens.
- Avoid per-row hooks; use a single aggregated call on the tokens page.
- Price fetch is batched (one call per chain per interval) and cached by key.
- Optional: prefetch table data on route enter; prefetch per-token state on navigation to detail.
- Partial data badge: table shows a small badge when a chain’s manager address is not available in config; rows still render with placeholders.

## Phases

Phase 1 (implemented):
- Aggregated hook for live TVL (equity) and supply across tokens and chains; table wiring; protocol TVL derived from table data.
- USD pricing via CoinGecko for debt assets with 15s cadence; table displays native units and an approximate USD line.
- Token details page shows TVL (equity) and Total Collateral, each with USD and proper skeleton loading.
- Supply cap read from config (per token) and rendered in table.
- Removed Total Collateral column from the table.

Phase 2 (planned):
- Background prefetch and event-based invalidation (mint/burn transfers).
- Optional historical TVL aggregation and price provider fallback.

## Success Criteria

- Table shows live equity-derived TVL and current supply.
- Protocol TVL aggregates across all configured tokens.
- Data refreshes every 30 seconds (state) and 15 seconds (USD prices) without hook rule violations.
- Clear loading/error states.
 - Table uses per-token chain; no dependency on connected wallet chain.

## Testing & Verification

- Typecheck (`bun run check`), lint/format (`bun run check:fix`).
- Visual: table values change after external mint/burn (when connected to a fork or live RPC).
- Unit-level: hook mapping/normalization functions are pure and can be tested with dummy results.

## Files Touched

- `src/features/leverage-tokens/utils/queryKeys.ts` (keys)
- `src/features/leverage-tokens/hooks/useLeverageTokensTableData.ts` (multi-chain aggregated reads; supply cap from config)
- `src/features/leverage-tokens/hooks/useLeverageTokenState.ts` (per-token detail reads)
- `src/features/leverage-tokens/hooks/useLeverageTokenCollateral.ts` (per-token collateral read)
- `src/lib/prices/coingecko.ts` (CoinGecko USD pricing fetcher with platform mapping)
- `src/lib/prices/useUsdPrices.ts` (React Query hook for batched USD prices)
- `src/routes/tokens.index.tsx` (wired to aggregated hook; loading/error)
- `src/routes/tokens.$chainId.$id.tsx` (detail page stat cards and skeletons)
- `src/features/leverage-tokens/components/LeverageTokenTable.tsx` (table display, removed collateral column)
- `src/components/ui/skeleton.tsx` + Storybook stories

## Open Questions / TODOs

- Confirm Manager/Factory exposure of supply caps; otherwise move supply caps to config or subgraph.
- Confirm environments: Base (8453) in production; Ethereum mainnet (1) mapping is ready if/when deployed.
- Optional secondary provider (subgraph) behind the same interface for redundancy.
- Decide on event watching strategy (mint/burn Transfer events) for instant UI refresh.
