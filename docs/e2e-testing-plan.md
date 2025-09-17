# Playwright E2E Testing Plan

This document captures the state of the end-to-end (E2E) test harness, the gaps we’ve observed, and the plan for making it reliable locally while keeping room to re-enable CI runs later.

## 1. Current State Snapshot

### Harness & Startup
- Playwright is configured via `playwright.config.ts` to run everything under `tests/e2e/`.
- The dev server is started automatically (`bunx --bun vite` with `VITE_TEST_MODE=mock`).
- Backend selection is driven by `TEST_RPC_URL`. If unset, Playwright falls back to `http://127.0.0.1:8545`.
- `tests/e2e/global-setup.ts` validates the backend: it assumes Tenderly when `TEST_RPC_URL` is absent, otherwise checks for a reachable RPC (or a local Anvil instance).
- Only a smoke suite (`basic-app.spec.ts`) is currently in place. It ensures the app bootstraps and that hash routing works.

### Shared Test Environment
- `tests/shared/env.ts` loads env vars (`.env.local`, `.env`, `tests/integration/.env`) and determines the target chain.
- It resolves contract/token addresses via `src/lib/contracts/addresses.ts` plus `tests/fixtures/addresses.ts`.
- `ADDR.leverageToken` currently points to the Tenderly VNet deployment (`0x1753…`). This is intentional for integration tests but is not yet surfaced in the UI.

### `scripts/run-tests.ts`
- Wraps both integration and E2E runs.
- Backend ladder: explicit `TEST_RPC_URL` → Tenderly JIT VNet (if credentials) → local Anvil fallback.
- Injects contract address overrides (`VITE_CONTRACT_ADDRESS_OVERRIDES`) using `tests/shared/tenderly-addresses.json`.
- E2E runs inherit the same ladder and overrides even though they don’t currently exercise on-chain flows.

### Pain Points
- Playwright rarely runs in CI; Tenderly VNets introduce latency and have occasionally timed out or throttled.
- Locally, E2E requires the same environment as integration tests but offers less guidance.
- The frontend previously pointed at the Tenderly token, which caused real UI data to break; we now have dedicated flags to keep Tenderly tokens out of production views.
- E2E has no notion of which leverage token to target once we expand beyond smoke tests.
- When `scripts/run-tests.ts` falls back to Anvil it still sets `TEST_RPC_URL=http://127.0.0.1:8545`, which makes `tests/shared/env.ts` classify the run as `mode='tenderly'`; funding helpers then call Tenderly-only RPC methods and fail against Anvil.

## 2. Goals

1. **Reliable local E2E runs** — Devs should be able to run the suite with a single command, whether they’re using Tenderly credentials or a local Anvil fork.
2. **Explicit token selection** — E2E needs a way to choose between canonical Base tokens and Tenderly-only tokens without affecting production bundles.
3. **Incremental scenario coverage** — Move beyond bootstrap smoke tests: add mint/redeem happy paths and key error states.
4. **Clear documentation** — Provide a reference for required env vars, backend choices, and troubleshooting.
5. **Future CI readiness** — Keep the path open for re-enabling E2E in CI once reliability improves (possibly as a nightly or optional job).

## 3. Proposed Approach

### 3.1 Shared Backend Ladder (Keep)
- Continue using the same backend-selection logic for integration and E2E (explicit RPC → Tenderly VNet → Anvil).
- Reuse the existing `tests/shared/env.ts` detection and `scripts/run-tests.ts` orchestration so there’s a single source of truth.
- Add logging in `global-setup.ts` to print which backend was selected and any action taken (e.g., “Using Tenderly VNet”, “Checking local Anvil…”).
- Fix the Anvil fallback so localhost URLs are treated as `mode='anvil'` (either by adjusting env parsing or by skipping `TEST_RPC_URL` entirely) and fail fast when neither Tenderly nor Anvil is reachable; otherwise mint/redeem specs will keep invoking Tenderly-only RPC helpers against Anvil.

### 3.2 Token Targeting
- Introduce an env knob (`E2E_TOKEN_SOURCE` or similar) that can be `prod` or `tenderly`.
- Update `tests/shared/env.ts` (or a new helper) to expose both token configs:
  - `WEETH_WETH_17X_BASE` for the canonical Base deployment.
  - `WEETH_WETH_17X_TENDERLY` for the VNet deployment (already available via fixtures).
- Expose the selected token address (and any ancillary metadata) to Playwright tests via a shared helper or environment injection.
- Ensure the frontend receives matching overrides when Tenderly is selected (`VITE_CONTRACT_ADDRESS_OVERRIDES`).

### 3.3 Scenario Rollout
1. **Mint happy path (mock wallet)**
   - Use the mock wallet configuration already built into the app (`VITE_TEST_MODE=mock`).
   - Drive the UI through the mint flow using Playwright: select the leverage token, input equity, approve if needed, mint, and verify success state and updated balances.
   - Reuse funding helpers where possible.

2. **Redeem happy path**
   - Ensure the mock wallet holds enough shares (e.g., by running the mint step in a `beforeAll` or using a test-specific script to pre-fund shares).

3. **Error-state coverage**
   - Insufficient collateral.
   - Slippage guard.
   - Wrong network (if the app surfaces it with the mock wallet).

4. **Guarded execution**
   - Run heavier specs serially (set project-specific `workers: 1`) until stability is proven.
   - Keep the smoke spec (`basic-app`) enabled by default for CI; gate mint/redeem specs behind an env flag like `E2E_ENABLE_FLOW_TESTS=1`.

### 3.4 Reliability Enhancements
- Reuse integration’s deterministic funding: call the same `topUpNative`, `topUpErc20`, `withFork`, etc., but adapt them to run in a Playwright context (likely via `page.evaluate` or REST calls to the admin RPC).
- Take and restore snapshots around each heavy test where possible to avoid cross-test contamination.
- Add targeted logging around LiFi/Uniswap quote fetches and `orchestrateMint` invocations to simplify failure triage.
- Consider a custom Playwright fixture to centralize funding and cleanup.

### 3.5 Documentation Tasks
- Add a dedicated doc (this plan plus actionable setup section) under `docs/`:
  - Prerequisites (Tenderly credentials vs local Anvil; required env vars).
  - Commands to run E2E locally (`bun scripts/run-tests.ts e2e`, or manual `playwright test`).
  - Backend selection descriptions and expected outcomes.
  - Token-selection controls (`E2E_TOKEN_SOURCE`).
  - Troubleshooting tips (Tenderly rate limits, wallet config warnings, Webpack externalized modules).
- Update `AGENTS.md` / `CLAUDE.md` with a concise summary referencing the doc.

### 3.6 CI Strategy (Iterative)
- Keep CI limited to the smoke spec for now (or skip E2E entirely).
- Once local flow tests prove stable, consider:
  - Running them in CI against Anvil (deterministic, offline).
  - Adding a nightly Tenderly run for higher fidelity (with clear quotas and timeouts).
- Document the chosen CI strategy in the new doc.

## 4. Next Steps Checklist

1. Correct Anvil fallback handling so shared env/helpers run in `mode='anvil'` and emit a clear error when neither Tenderly nor Anvil is available.
2. Add token-selection env knob and expose both token configs via shared helper.
3. Log backend choice in Playwright global setup; ensure failure messages are actionable.
4. Implement mint happy-path spec guarded by feature flag (`E2E_ENABLE_FLOW_TESTS`).
5. Introduce funding/snapshot helpers for E2E (leveraging existing shared utilities).
6. Add documentation under `docs/` and summarize in `AGENTS.md`/`CLAUDE.md`.
7. Evaluate results locally and iterate before expanding coverage or re-enabling CI.

---

By treating Tenderly-specific deployments as test-only configs and using explicit env selectors, we prevent production regressions while keeping integration and E2E paths aligned. The shared backend ladder avoids duplicating setup logic, and the documentation provides a central reference for onboarding new contributors or debugging local runs.

## 5. Task Breakdown (Detailed)

### Task 1: Token Selection Controls
- **1.1** Add `E2E_TOKEN_SOURCE` (default `tenderly`) to shared env parsing (`tests/shared/env.ts`).
- **1.2** Expose both canonical and Tenderly leverage-token configs via a helper so tests/app can read the selected one.
- **1.3** When Tenderly is chosen, ensure `scripts/run-tests.ts`/Playwright inject matching `VITE_CONTRACT_ADDRESS_OVERRIDES`.
- **1.4** Update fixtures/tests that currently assume a single address to read through the helper instead.

### Task 2: Backend Visibility & Guardrails
- **2.1** Update `tests/shared/env.ts` and/or `scripts/run-tests.ts` so localhost RPCs are treated as Anvil without setting `mode='tenderly'`, and ensure shared helpers pick the correct funding strategy.
- **2.2** Enhance `tests/e2e/global-setup.ts` logging to announce the chosen backend and required actions.
- **2.3** Fail fast with actionable messages when Tenderly credentials are missing or Anvil isn’t reachable.
- **2.4** Mirror the logging pattern in integration tests (if not already present) for consistent experience.

### Task 3: Mint Flow E2E Spec
- **3.1** Build a Playwright fixture to provision funding using existing helpers (`topUpNative`, `topUpErc20`).
- **3.2** Automate the mint modal (open → input → approve → mint → confirm success toast/state).
- **3.3** Capture post-mint assertions (share balance, USD value, transaction summary) and log intermediate states for debugging.
- **3.4** Gate the spec behind an env flag so CI can opt-out initially (`E2E_ENABLE_FLOW_TESTS`).

### Task 4: Redeem Flow & Error Coverage
- **4.1** Extend the fixture to ensure the wallet has shares before running redeem tests (reuse mint or dedicated setup).
- **4.2** Automate the redeem modal flow and validate success state.
- **4.3** Add focused error specs (insufficient collateral, slippage, wrong network) with clear expectations.

### Task 5: Reliability Enhancements
- **5.1** Integrate snapshot capture/restoration around heavy specs (Tenderly only; skip when unsupported).
- **5.2** Add targeted logging for quote providers and orchestrate steps to simplify flake investigation.
- **5.3** Introduce serial execution (per-spec `workers: 1`) until stability is confirmed; document how to toggle back.

### Task 6: Documentation & Adoption
- **6.1** Expand this doc with setup instructions and quick-start commands once tasks land.
- **6.2** Update `AGENTS.md` and `CLAUDE.md` with a concise summary and links.
- **6.3** Optional: record a short internal guide or README snippet showing the “Tenderly vs Anvil” workflow.

### Task 7: CI Evaluation (Deferred)
- **7.1** After local stability, pilot an Anvil-backed E2E run in CI (perhaps as an opt-in job).
- **7.2** If viable, add a Tenderly nightly job with timeouts/quotas configured.
- **7.3** Monitor flake rate and adjust retries/timeouts accordingly.
