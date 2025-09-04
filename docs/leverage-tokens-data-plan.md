# Leverage Tokens: Live TVL & Table Data Plan

This document describes how leverage token data (TVL, supply, and related metrics) is fetched, cached, and rendered across the app. It reflects the current implementation and outlines the next phases.

## Goals

- Surface live TVL and current supply in the Leverage Tokens table.
- Keep a single source of truth per data shape; avoid duplicate reads and per-row hooks.
- Provide a protocol-wide TVL derived from the aggregated data.
- Add USD pricing later with minimal surface changes.

## Key Definitions

- TVL (token): Uses Manager-reported equity (in debt-asset units) as the token’s TVL base.
  - Rationale: TVL = pricePerShare × totalSupply = equity; using equity directly avoids rounding.
- Share price (debt units): equity / totalSupply.
- Phase 1 USD: Placeholder multiplier = 1 (i.e., display numeric equity; USD wiring deferred to Phase 2).

## Data Sources (On-Chain and GraphQL)

- On-chain (Base):
  - `LeverageManager.getLeverageTokenState(token)` → `{ collateralInDebtAsset, debt, equity, collateralRatio }`
  - `LeverageToken.totalSupply()`
- GraphQL (historical / comparison):
  - Charts and comparisons use existing subgraph queries (not part of table TVL path).

## Query Keys (TanStack Query)

File: `src/features/leverage-tokens/utils/queryKeys.ts`

- `ltKeys.state(addr)` → live on-chain state (manager + token)
- `ltKeys.tvl(addr)` → per-token TVL (derived from state; not a separate fetch)
- `ltKeys.tableData()` → aggregated per-token table data (all tokens)
- `ltKeys.protocolTvl()` → protocol-wide TVL (derived from `tableData`)

## Hooks

1) `useLeverageTokensTableData`
- File: `src/features/leverage-tokens/hooks/useLeverageTokensTableData.ts`
- Purpose: Aggregated read for all configured tokens using a single multicall: `[getLeverageTokenState, totalSupply]` per token.
- Returns array shaped for `LeverageTokenTable` with live `tvl` (equity) and `currentSupply` (scaled decimals).
- Refresh: `staleTime = STALE_TIME.supply` (30s), `refetchInterval = 30_000`.
- Supply cap: still mock/config (no on-chain field yet).

2) `useLeverageTokenState`
- File: `src/features/leverage-tokens/hooks/useLeverageTokenState.ts`
- Purpose: Per-token read for detail views; uses `useReadContracts` with `[getLeverageTokenState, totalSupply]`.
- Returns `{ totalSupply, collateralInDebtAsset, debt, equity, collateralRatio }`.
- Not used in table rows (to avoid N-per-row hooks).

3) `useProtocolTVL`
- File: `src/features/leverage-tokens/hooks/useProtocolTVL.ts`
- Purpose: Derives protocol TVL by summing token `tvl` from `useLeverageTokensTableData`.
- Avoids extra RPC calls; consumers can render total at nav/analytics.

Planned (Phase 2):

4) `useDebtAssetUsdPrice(chainId)`
- Chainlink WETH/USD feed on Base (or subgraph-provided price).
- Replace placeholder multiplier (1) with live USD.

5) `useLeverageTokenPrice(token)`
- Computes price per share (debt units) from `equity / totalSupply`; multiplies by USD price for display.

## Data Flow & UI Wiring

- Page: `src/routes/tokens.index.tsx`
  - Uses `useLeverageTokensTableData()` → renders `LeverageTokenTable` and `FeaturedLeverageTokens`.
  - Loading/Error states handled at page level.
  - Row click routes to `/tokens/$id`.

- Detail Page: existing hooks for adapters/metrics and GraphQL are separate; `useLeverageTokenState` is available if we need per-token equity/supply on that page.

## Caching & Refresh Strategy

- Query cache keys are hierarchical (see `ltKeys`).
- Supply/state data: `staleTime` and `refetchInterval` both at ~30s for consistent refresh frequency.
- Invalidation: mint/redeem flows should invalidate `ltKeys.tableData()` and `ltKeys.state(token)` precisely.

## Error & Loading

- Table: displays loading placeholder and a minimal error message on failure.
- Per-token failures in aggregated results are tolerated (rows default to zero/placeholder), though the query currently fails only on catastrophic errors.

## Performance

- Multicall batching via `useReadContracts` for all tokens.
- Avoid per-row hooks; use a single aggregated call on the tokens page.
- Optional: prefetch table data on route enter; prefetch per-token state on navigation to detail.

## Phases

Phase 1 (implemented):
- Aggregated hook for live TVL and supply; table wiring; protocol TVL derived from table data.

Phase 2 (planned):
- USD pricing with Chainlink WETH/USD; `useDebtAssetUsdPrice` and `useLeverageTokenPrice`.
- Replace placeholder USD multiplier in table and protocol totals.

Phase 3 (planned):
- Supply cap from Manager/Factory or subgraph.
- Background prefetch and event-based invalidation (mint/burn transfers).
- Optional historical TVL aggregation.

## Success Criteria

- Table shows live equity-derived TVL and current supply.
- Protocol TVL aggregates across all configured tokens.
- Data refreshes every 30 seconds without hook rule violations.
- Clear loading/error states.

## Testing & Verification

- Typecheck (`bun run check`), lint/format (`bun run check:fix`).
- Visual: table values change after external mint/burn (when connected to a fork or live RPC).
- Unit-level: hook mapping/normalization functions are pure and can be tested with dummy results.

## Files Touched

- `src/features/leverage-tokens/utils/queryKeys.ts` (added `state`, `tvl`, `tableData`, `protocolTvl`)
- `src/features/leverage-tokens/hooks/useLeverageTokensTableData.ts` (new)
- `src/features/leverage-tokens/hooks/useLeverageTokenState.ts` (new)
- `src/features/leverage-tokens/hooks/useProtocolTVL.ts` (new)
- `src/routes/tokens.index.tsx` (wired to aggregated hook; loading/error)

## Open Questions / TODOs

- Confirm Manager/Factory exposure of supply caps; otherwise move supply caps to config or subgraph.
- Finalize USD pricing source (Chainlink vs subgraph) and add environment/config addresses.
- Decide on event watching strategy (mint/burn Transfer events) for instant UI refresh.

