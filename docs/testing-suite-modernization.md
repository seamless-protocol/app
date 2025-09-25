# Testing Suite Modernization Plan

This document lays out a first-principles plan for simplifying and strengthening Seamless Protocol's web testing stack. It is designed so multiple engineers can iterate in parallel. Please add comments inline with `[TODO @name]` tags when picking up items.

## Objectives
- **High-signal failures**: Surface what broke, why, and the failing layer within one console glance.
- **Coverage where it counts**: Guarantee that leverage token mint/redeem, critical governance surfaces, and risk toggles stay green.
- **Environment parity**: Default to curated Tenderly RPC + admin URLs for Base/Mainnet VNets, with JIT forks as the next rung and Anvil as a last resort.
- **Minimal overhead for prod verification**: Make prod-contract smoke checks turnkey so we can validate LiFi and cross-chain routing without rebuilding the harness each time.
- **Short feedback loops**: Keep fast tests fast (< 30s) and reserve slow paths for intentional runs.

## Guiding Principles
1. **One source of truth per concern**: Centralize test configuration (chains, tokens, environments) in `tests/shared` and reuse it from unit → E2E.
2. **Layered confidence**: Each test layer exercises a distinct scope; no duplicated coverage across layers.
3. **Observable by default**: Structured logging + artifacts (screenshots, RPC traces) ship with every failure.
4. **Deterministic state**: Every spec creates or selects an isolated fork snapshot so reruns act identically.
5. **Configuration as data**: Declare test scenarios (leverage tokens, bridge routes, governance actions) as JSON/TS config consumed across suites and docs.
6. **Minimal env juggling**: Prefer typed config and CLI flags over ad-hoc environment variables wherever possible.

## Proposed Architecture

### 1. Fast Feedback Layer (Unit + Component)
- Vitest + React Testing Library.
- Focus: pure calculations, hooks, presentational logic.
- Requires zero RPC config; mock wagmi/viem interactions with fixtures.
- Artefacts: console diff, coverage map for domain-critical utilities.

### 2. Deterministic Integration Layer (Tenderly static by default)
- Harness: existing `tests/integration` with `withFork()` wrapper.
- Resolves to hard-coded Tenderly RPC/admin endpoints first; falls back to JIT VNets per spec when static endpoints are unavailable.
- Targets canonical leverage-token workflows (mint, redeem, rebalance triggers) with pruned ABIs.
- Fallback: JIT VNet on demand, then Anvil fork only when `--mode anvil` is passed; config objects handle RPC parity.
- Tenderly static forks default to the Tenderly leverage-token catalog (VNet-only deployments for Base + Mainnet). Scenarios that require production contracts must opt-in explicitly.
- Swap execution follows the deterministic on-chain routes defined per leverage token (e.g., Uniswap pools). LiFi-specific assertions only light up when a prod scenario is selected. Prod JIT/snapshot forks inherit live LiFi routing because they mirror the production contracts.

### 3. Journey Layer (Playwright E2E)
- Runs against the same backend ladder as integration (static Tenderly → JIT Tenderly → Anvil).
- Adds wallet + LiFi quote assertions alongside UI flows.
- Records trace + HAR for every failure; stores in `tests/e2e/.artifacts` with run timestamp.

### 4. Production Contract Smoke Layer (New)
- Thin Vitest harness that runs on **production** addresses, flagged via `tests/shared/scenarios/prod/*.ts`.
- Uses the hard-coded Tenderly production endpoints when available, otherwise JIT VNets seeded from production state or scheduled `tenderly_forkNetwork` jobs.
- Validates LiFi routing and contract invariants without deploying new forks manually.

## Scenario Catalog & CLI Surface
- Scenarios live in `tests/shared/scenarios/<chain>/<name>.ts` and export typed metadata (token source, token keys, swap profile, LiFi flags, required balances, setup hooks).
- `resolveBackend({chain, mode, scenario})` loads the scenario file, merges it with the backend selection, and emits a single config consumed by integration/E2E harnesses.
- CLI commands accept `--chain`, `--mode`, and `--scenario` flags; defaults map to the most common flow per chain (e.g., `leverage-mint`).
- Add `docs/testing-scenarios.md` (Phase 3) summarizing available scenarios, owners, and last validation date; update whenever new leverage tokens or governance flows land.

## Environment Matrix
| Chain | Mode | Use Case | Notes |
| --- | --- | --- | --- |
| Base | `tenderly-static` | Default dev + CI | Hard-coded RPC/admin URLs maintained in repo secrets.
| Base | `tenderly-jit` | Overflow + debugging | Creates/tears down per command via API.
| Base | `prod-snapshot` | LiFi smoke, regression | Seeds from live block height nightly.
| Base | `local-anvil` | Offline dev / debugging | Opt-in; limited feature parity; requires LiFi mocking for bridge coverage.
| Mainnet | `tenderly-static` | Upcoming leverage deployments | Hard-coded RPC/admin URLs for mainnet VNets.
| Mainnet | `tenderly-jit` | Overflow + debugging | Same pipeline as Base.
| Mainnet | `prod-snapshot` | Governance + ETH routing | Mirrors Base smoke approach.

We intentionally omit a `local-anvil` row for mainnet: keeping a local fork in sync with production liquidity, LI.FI routing tables, and governance actors would require heavy manual funding and impersonation maintenance. Static and JIT Tenderly forks give us that fidelity with less overhead, so mainnet debugging should flow through those paths.

Backends resolve through a single `resolveBackend({chain, mode, scenario})` helper that produces: RPC URLs, admin RPC, contract overrides, default token source/key, and fixture overrides. Static Tenderly URLs live in configuration and are selected unless a mode override is provided or health checks fail. Scenario is chain-scoped (`leverage-mint`, `liquidity-stress`, `governance-smoke`, etc.), so multiple flows per chain can run without changing the backend plumbing.

## Execution Phases

### Phase 1 – Foundation (Weeks 1-2)
- [ ] Audit existing scripts and elevate backend resolution into `tests/shared/backend.ts` with typed return values.
- [ ] Codify static Tenderly RPC/admin URL constants (Base + Mainnet), plus health checks that fall back to JIT when needed.
- [ ] Add structured logging (logger helper) to report selected backend, token, snapshot ID for each run.
- [ ] Normalize test commands:
  - `bun test:unit`
  - `bun test:integration --chain base --mode tenderly-static`
  - `bun test:integration --chain base --mode tenderly-jit`
  - `bun test:e2e --scenario leverage-mint`
  - Leverage-token integration specs now fail fast when Tenderly isn’t selected (`mode !== 'tenderly'`) or when no Tenderly leverage tokens are configured, ensuring CI flags backend misconfigurations immediately.
- [ ] Establish artifacts directory conventions (`tests/.artifacts/<timestamp>/...`).
- [ ] Collapse redundant env vars into the backend resolver (e.g., `TEST_RPC_URL`, `VITE_TEST_RPC_URL`, `TENDERLY_ADMIN_RPC_URL`). (In progress: integration runner now calls `resolveBackend`; Playwright/global env still pending.)
- [ ] Introduce scenario registry scaffolding (`tests/shared/scenarios/index.ts`) with a Base `leverage-mint` entry and CLI flag wiring.
- [ ] Document which leverage token source each scenario should use (Tenderly VNet vs prod) and align defaults accordingly.
- [ ] Ensure integration mint specs pass for every Tenderly leverage token on Base and Mainnet (`tenderly-static` mode).
- [ ] Ensure integration redeem spec passes for the Base `weETH/WETH` leverage token (`tenderly-static` mode).

### Phase 2 – Coverage Realignment (Weeks 2-4)
- [ ] Define scenario config objects for leverage tokens (`tests/shared/scenarios/leverageTokens.ts`).
- [ ] Expand scenario catalog: `leverage-weeth-redeem` (Base), `leverage-cbbtc-redeem` (Mainnet), `leverage-weeth-mint-prod` (Base prod LiFi), `governance-guardian-smoke` (pending contracts).
- [ ] Port existing integration specs to consume scenario configs + new backend helper.
- [ ] Expand integration coverage to include:
  - Mint success + revert paths (Tenderly)
  - Redeem success
  - LiFi routing fallback detection
- [ ] Add minimal component / unit tests for risk-critical UI toggles (slippage, approval states).

### Phase 3 – Production Parity (Weeks 4-6)
- [ ] Build `scripts/run-prod-smoke.ts` to fetch Tenderly fork of production deployments and run smoke specs nightly.
- [ ] Wire CI jobs:
  - `daily-prod-smoke` on Tenderly JIT snapshot
  - `pull-request-fast` (unit + deterministic integration subset)
- [ ] Add Playwright flow for mint/redeem that leverages scenario configs and stores traces automatically.
- [ ] Document runbooks for debugging prod smoke failures.
- [ ] Publish `docs/testing-scenarios.md` and keep scenario catalog/owners updated with each new deployment.

## Workstreams & Ownership Slots
- **Backend & Tooling** – Owns `resolveBackend`, logging, artifact strategy. _[unassigned]_
- **Integration Specs** – Ports and expands leverage token coverage. _[unassigned]_
- **E2E Journeys** – Builds Playwright traces + flow specs. _[unassigned]_
- **Prod Smoke Ops** – Maintains nightly jobs and incident response. _[unassigned]_

Engineers should claim a workstream by editing this section and linking to their tracking issue or Linear ticket.

## Deliverables & Checkpoints
- Single command README snippet demonstrating how to run each layer.
- Decision record on when to use Tenderly vs Anvil and how to elevate new chains.
- Dashboard (could be Notion or README table) showing per-layer status: last run, owner, blockers.

## Open Questions
- Do we want to snapshot Tenderly VNets at a fixed block height for reproducibility, or follow head with caching?
- What quota/allocation do we have for LiFi API calls in CI-style runs?
- Should prod smoke specs gate production deploys or run as async monitors?
- How do we unify secrets distribution (Tenderly keys, LiFi keys) across local dev and CI?

## Next Steps
1. Align with protocol team on required prod smoke assertions (LiFi, governance timelocks).
2. Convert this plan into Linear tasks and assign owners.
3. Begin Phase 1 with backend helper extraction and command normalization.
