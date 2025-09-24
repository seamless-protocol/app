# Phase 3 Launch Readiness Checklist

This checklist tracks the work required to ship a Phase 1–3 production bundle by the planned 10/3 soft launch. It reflects the canonical phase guidelines (technical foundation, leverage tokens, and dashboard/holdings) and narrows scope to mint/redeem actions with Sentry as the sole production telemetry tool. Reward-claiming flows and broader event analytics (e.g., GA) are intentionally deferred until after the soft launch.

## Phase Guidance Reference
- **Phase 1 – Foundation & Infrastructure:** React + Wagmi/Viem stack, IPFS-ready bundle, CI + testing harnesses, and architectural guardrails (hash routing, config management, error handling).
- **Phase 2 – Leverage Tokens:** Table + detail routes for whitelisted tokens, live metrics, LiFi-backed mint/redeem flows, extensible config metadata.
- **Phase 3 – User Dashboard & Holdings:** Portfolio overview with subgraph-backed performance, reward surfacing, and mint/redeem entry points (other actions deferred for launch).

## Phase 1 Readiness
- [x] React/Vite/Wagmi app scaffolded with hash-routing for IPFS (`src/router.ts`).
- [x] Contract configuration centralized in `src/lib/contracts` with override support.
- [x] CI pipeline executing lint/type/unit/integration/E2E jobs (`.github/workflows/ci.yml`).
- [x] Sentry wiring ready in `src/lib/config/sentry.config.ts`; awaiting prod DSN.
- [ ] Confirm production secrets inventory (WalletConnect, Base/Eth RPC, TheGraph, Sentry) and owners.

## Phase 2 Readiness
- [x] Leverage token table/detail pages live (TanStack Router routes + hooks).
- [x] Mint/redeem modals implemented with V2 router support.
- [ ] Inject quote adapters into router V2 mint orchestrator (`useMintExecution`) using token `swaps.debtToCollateral` config.
- [ ] Verify redeem modal resolves `swaps.collateralToDebt` and reacts to final router/manager addresses without code changes.
- [ ] Document final contract addresses (manager/router v2, multicall executor) once provided.

## Phase 3 Readiness
- [x] Portfolio overview powered by subgraph + pricing hooks (`usePortfolioWithTotalValue`).
- [ ] Move the hard-coded test wallet in `usePortfolioDataFetcher` behind `VITE_TEST_MODE=mock`; default to connected accounts and document a funding script for dev/test convenience.
- [ ] Ensure mint/redeem triggers from dashboard stay functional post-hook cleanup.
- [ ] Wire reward display to production Merkl data and confirm Sentry logging covers errors.
- [ ] Ensure non-mint/redeem actions (staking/claim) stay hidden behind feature flags for launch, including keeping reward-claim buttons disabled until the post-launch phase.

## Deployment & QA Checklist
- [ ] Draft IPFS deployment runbook (build → pin → verify hash, rollback steps).
- [ ] Confirm QA cadence: focus on `bun run test:integration` (Tenderly) pre-launch; defer Playwright flow tests until post soft launch when prod contracts are stable.
- [ ] Capture soft-launch feature flag defaults (Phase 1–3 on, later phases off).
- [ ] Validate Sentry initialization with production DSN/environment/release naming.
- [ ] Document trusted-user access steps for the soft-launch hash.

## Open Questions for Wes & Team
- [ ] Ownership of production secrets and escalation path for updates.

## Status Maintenance
Update this document as items close or new blockers emerge so the launch plan remains accurate leading into the bi-weekly syncs.
