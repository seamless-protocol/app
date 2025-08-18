# Seamless Protocol Front‑end v2 — System Prop
*(SPA, Multi‑Chain, IPFS, Tenderly, Test‑First — **Leverage Tokens**, not lending markets)*

> **Context / constraints**  
> • **SPA** (Vite + React) with **TanStack Router** in **hash mode**, fully **client‑only**, deployed to **IPFS**.  
> • **Multi‑chain by default** (Base primary; Ethereum next). **Switch on write** (EIP‑3326/3085).  
> • Reads via **viem** public clients (**batch.multicall** + **fallback** transports).  
> • **Wallet:** wagmi v2 + RainbowKit already configured.  
> • **Runtime:** Bun. **CI** uses `bun` scripts.  
> • **Product scope:** Leverage tokens (ERC‑20) — **mint** (deposit collateral → receive LT), **redeem** (burn LT → receive collateral), **monitor rebalancing**.  
> • **Deployed contracts on Base:**  
>   - **LeverageTokenFactory:** `0xE0b2e40EDeb53B96C923381509a25a615c1Abe57`  
>   - **LeverageManager:** `0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8`

---

## North Star
**Build the simplest multi‑chain leverage‑token app we’ll still love in a decade.**  
Make the hot paths—connect → browse leverage tokens → mint/redeem → view portfolio—**fast, obvious, and reliable**. Code is a liability—prefer boring, well‑typed solutions.

## Recency & Sourcing
Always check official docs/release notes (wagmi/viem/TanStack/WalletConnect/Base). When a decision matters, summarize trade‑offs and **pin versions**.

---

## System‑Design Doctrine (SPA + IPFS)
- **Monolith‑first SPA.** Vite + React + **TanStack Router**; **no SSR/RSC**. **Hash routing** for gateway compatibility.  
- **Minimize state.** Treat on‑chain/indexer data as **server‑state in the client** via **TanStack Query v5**; keep UI state local/colocated; avoid global stores unless needed for transient UI.  
- **Schema-/types‑first.** ABIs drive types through **viem**; strict TS; validate all inputs; explicit query keys.  
- **Let the platform work.** viem with `batch.multicall: true` and **fallback transports** (multiple RPCs). Prefer polling over WS unless a provider is proven stable.  
- **Fast vs. slow paths.** Hot paths target **≤200–300 ms p50** perceived latency (skeletons + optimistic updates). Heavy/aggregate reads in parallel; background refresh on focus/reconnect.  
- **Cache last (but explicit).** Start with Query defaults, then set `staleTime` for slow‑moving metadata; **explicit invalidation** on writes.  
- **Events sparingly.** Prefer direct reads/polling. Only add an internal event bus if multiple distant consumers truly need it.  
- **Observability day one.** Track p50/95/99 route timings, RPC error rate, wallet connect failures, write success/latency, and business events (mints/redeems) **per chain**.  
- **Plan for failure.** Idempotent UI flows; retries/backoff where safe; **circuit breakers** for flaky providers; **fail‑closed** for money‑moving actions; **read‑only fallback** on degradation.

---

## Product Focus & Phases
- **Phase II:** Leverage tokens — discovery, details, **mint/redeem** flows, portfolio basics, rebalancing visibility.  
- **Phase III:** Morpho vaults integration + dashboard (aggregated P&L, risk).  
- Later phases: staking, governance, token creation (factory UI).

---

## Multi‑Chain UX Policy
- **Reads:** cross‑chain browsing allowed; badges show chain; aggregate only where semantics match.  
- **Writes:** **prompt chain switch at action time**; on error **4902** add via **EIP‑3085** then switch; on user decline **4001**, keep UI disabled with a clear reason and recovery.  
- **Resilience:** per‑chain **RPC fallback**. If a chain is degraded, **gray out writes** while keeping reads where possible.

---

## Data Sources
- **On‑chain (current state):** viem public clients → LeverageTokenFactory, LeverageManager, token contracts.  
- **Historical/analytics:** public **subgraph** (URL via `VITE_SEAMLESS_SUBGRAPH_URL`) for supply, rebalances, historical P&L, and user mint/redeem events.  
- **Price oracles:** integrate Chainlink/other where needed for valuations; guard with stale‑price checks and UI warnings.

**Base mainnet specifics**
```
Block time ~2s
Multicall3: 0xcA11bde05977b3631167028862bE2a173976CA11
Gas: L2 cost awareness; prefer batching & calldata minimization
```

---

## Reference Contract Hooks (must exist under `src/features/leverage-tokens/hooks/`)
> All hooks typed via viem ABIs and implemented with TanStack Query + wagmi `useReadContract`/`useReadContracts`/`useSimulateContract`. Provide JSDoc and explicit query keys.

- `useLeverageTokenFactory()` — discover all LT addresses (and metadata where available).  
- `useLeverageTokenMetadata(token)` — name, symbol, decimals, leverage ratio.  
- `useTokenTotalSupply(token)` — current supply.  
- `useTokenPrice(token)` — oracle price integration (with “last updated” + staleness guard).  
- `useRebalancingStatus(token)` — time since last rebalance + thresholds.  
- `useUserTokenBalance(token, address)` — wallet balance & allowances.  
- `useMintSimulation(token, amount)` — sim results incl. fee/slippage.  
- `useRedeemSimulation(token, amount)` — sim results incl. fee/slippage.

**ABI locations (existing/expected)**
```
src/lib/contracts/abis/leverageToken.ts
src/lib/contracts/abis/leverageTokenFactory.ts
```

**Query‑key convention**
```ts
export const ltKeys = {
  all: ['lt'] as const,
  factory: () => [...ltKeys.all, 'factory'] as const,
  token: (addr: `0x${string}`) => [...ltKeys.all, 'token', addr] as const,
  supply: (addr: `0x${string}`) => [...ltKeys.all, 'supply', addr] as const,
  price: (addr: `0x${string}`) => [...ltKeys.all, 'price', addr] as const,
  user: (addr: `0x${string}`, owner: `0x${string}`) => [...ltKeys.all, 'user', addr, owner] as const,
  rebal: (addr: `0x${string}`) => [...ltKeys.all, 'rebal', addr] as const,
}
```

**Invalidation rules**
- On **mint** success: invalidate `ltKeys.user(token, owner)`, `ltKeys.supply(token)`, and portfolio aggregates.  
- On **redeem** success: same as above.  
- On **approval** success: invalidate allowance key (under user).

**Optimistic updates**
- Optimistically update `ltKeys.user(token, owner)` balances on tx submit; roll back on failure; reconcile on confirmation.

**Cross‑chain aggregation**
- Keep per‑chain caches separate by including chainId in keys; aggregate in selectors at view-time.

---

## Subgraph Integration — required historical queries
- Token creation events (for discovery + dates).  
- Rebalancing history per token (timestamp, ratio, tx hash).  
- User mint/redeem events (amounts, cost basis).  
- Price/performance over time (for charts & P&L).

---

## UI Components (ShadCN / primitives to use)
- `Card` for token cards & detail sections.  
- `Button` for actions; `DropdownMenu` for sorting/filters.  
- `Badge` for leverage multiple; `Progress` for rebalancing proximity; `Alert` for stale price/rebalance in‑progress.  
- Toasts/snackbars for tx states (submitted/confirmed/failed).

---

## Error Handling Patterns (show clear recovery)
- Factory returns no tokens → “No tokens found” + refresh link.  
- Token ABI mismatch/not verified → disable writes; show support link and contract address.  
- Oracle price stale/unavailable → warn & disable risky writes until fresh; show last‑updated time.  
- Rebalancing in progress → disable mints/redeems if unsafe; explain why.  
- Wallet errors: 4001 (user rejected), 4902 (add network), 4100 (unauthorized) → tailored messages.

---

## Performance Benchmarks / SLOs
- **Token list load:** < **2s** (p95) with skeletons; perceived **p50 200–300ms**.  
- **Price updates:** < **500ms** for cached/prefetched paths; background refresh on focus.  
- **Mint/redeem simulation:** < **3s** (p95).  
- **Transaction confirmation:** < **30s** (p95) with progress feedback.  
- **Write success rate:** ≥ **98%** excluding user cancellations.

---

## Feature Flags
```ts
// src/lib/config/features.ts
export const features = {
  tokenCreation: import.meta.env['VITE_ENABLE_LEVERAGE_TOKEN_CREATION'] === 'true',
  advancedFilters: import.meta.env['VITE_ENABLE_ADVANCED_FILTERS'] === 'true',
  portfolioPnl: import.meta.env['VITE_ENABLE_PORTFOLIO_PNL'] === 'true',
} as const
```
Access only via `import.meta.env['VITE_*']` and guard undefined.

---

## Testing Doctrine (priority)
1. **Unit (business logic):** leverage ratio & HF math, rebalancing thresholds, fee/PNL formatting, guards, query keys.  
2. **Integration (contracts on Tenderly):** factory discovery, token metadata, **mint**, **redeem**, manager hooks, multi‑chain config; reset via `evm_snapshot/revert`.  
3. **E2E (UI with MockConnector):** connect, **switch‑on‑write**, mint/redeem happy paths, and negative cases (4001/4902, stale oracle).

**Bun scripts**
- `bun test` (unit & MSW integration)  
- `bun test:e2e` (Playwright)  
- `bun check:fix` (Biome + typecheck)

---

## CI / Tooling Alignment (Bun + IPFS)
- PR‑blocking: `bun install` → `bun check:fix` → `bun build` (IPFS‑safe: `base: './'`) → `bun test` → `bun test:e2e`.  
- Nightly: Tenderly chain matrix + negative cases; upload traces.

---

## Environment Variables
```
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_BASE_RPC_URL=...
VITE_SEAMLESS_SUBGRAPH_URL=...
VITE_SENTRY_DSN=...
# Addresses (Base):
VITE_FACTORY_ADDRESS=0xE0b2e40EDeb53B96C923381509a25a615c1Abe57
VITE_MANAGER_ADDRESS=0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8
# Optional flags:
VITE_ENABLE_*             # Feature flags per slice
```
**Rule:** read via `import.meta.env['VITE_*']` and guard undefined with compile‑time types.

---

## Definition of Done (DoD)
- ✅ Works against deployed Base contracts (addresses above).  
- ✅ Passes `bun check:fix` (Biome + TypeScript).  
- ✅ Bundle size acceptable for IPFS; no server‑side features.  
- ✅ Feature‑flagged if experimental.  
- ✅ Handles wallet connect/disconnect & chain switching gracefully.  
- ✅ Has Unit + Integration (Tenderly) + E2E (MockConnector) tests and telemetry.
