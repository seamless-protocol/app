# Testing Backends Architecture (Draft)

> Status: draft / design doc – describes the intended mental model with Anvil as the default backend and Tenderly as an advanced option. The existing implementation is close to this but still has a few inconsistencies called out below.

## Goals

- Make it obvious which backend is used when running tests.
- Give new contributors a single, reliable “happy path” using a local Anvil fork.
- Keep Tenderly support as an advanced, opt‑in backend for teams that need it.
- Avoid scattering backend selection logic across many files.

## Backend Modes (Conceptual)

We treat backends as a small set of explicit modes:

- `anvil`
  - Local fork (Base or Mainnet) using Foundry Anvil.
  - Default backend for chain‑aware tests (integration + E2E).
  - Requires Anvil to be running on `http://127.0.0.1:8545` (or configured via `ANVIL_*` env).

- `tenderly-jit`
  - Just‑in‑time Tenderly VirtualNet (VNet) created per test run.
  - Uses Tenderly API (`scripts/tenderly-vnet.ts`) to create/delete a VNet.
  - Requires `TENDERLY_ACCOUNT`, `TENDERLY_PROJECT`, `TENDERLY_ACCESS_KEY` (and optional `TENDERLY_TOKEN`).
  - Intended as an **advanced** backend: no local node required, fully isolated per run.

- `tenderly-static`
  - Uses pre‑provisioned Tenderly VNets with fixed RPC URLs.
  - Static endpoints are configured in `tests/fixtures/addresses.ts` and wired via `tests/shared/backend.ts`.
  - Advanced backend for highly deterministic scenarios where the VNet is managed out‑of‑band.

Internally, there is also a “custom”/override path when `TEST_RPC_URL` is set, but we treat that purely as an expert escape hatch rather than a first‑class mode we design around.

## Happy Path vs Advanced Usage

### Happy Path (New Contributors)

These should be the only commands a new developer needs to learn:

- **Start Anvil fork (local)**  
  - `bun run anvil:base` (Base fork; uses `VITE_ALCHEMY_API_KEY` for the upstream Base RPC)  
  - `bun run anvil:mainnet` (Mainnet fork; also uses `VITE_ALCHEMY_API_KEY`)

- **Integration tests (Anvil default)**  
  - `bun run test:integration`
  - Uses `scripts/run-tests.ts integration` with `--backend=anvil`.

- **E2E tests (Anvil default)**  
  - `bun run test:e2e`
  - Uses `scripts/run-tests.ts e2e` with `--backend=anvil`.

The happy path assumes:

- Anvil is installed and running locally.
- `VITE_ALCHEMY_API_KEY` is configured once and used for both Base and Mainnet forks.

### Advanced Backends

Advanced flows are explicit and clearly labeled:

- **Tenderly JIT VNet**
  - `bun scripts/run-tests.ts integration --backend=tenderly [extra args...]`
  - `bun scripts/run-tests.ts e2e --backend=tenderly [extra args...]`
  - Uses `createVNet` / `deleteVNet` to manage ephemeral VNets per run.

- **Static Tenderly VNet**
  - Explicitly opt‑in to `tenderly-static` via environment (e.g. `TEST_MODE=tenderly-static`) or a dedicated script.
  - Uses static RPC URLs and contract overrides from `tests/fixtures/addresses.ts`.

- **Multi‑chain / scenarios (advanced)**
  - `bun scripts/run-tests.ts integration --chain base|mainnet|all --scenario leverage-mint|leverage-redeem [--backend ...]`
  - `bun scripts/run-tests.ts e2e --chain ... --scenario ...`

## Where Backend Logic Lives

### 1. `scripts/run-tests.ts`

Responsibilities:

- Parse CLI arguments:
  - `testType`: `integration` or `e2e`
  - `--backend`: `anvil` | `tenderly` | `auto`
  - `--chain`: `base` | `mainnet` | `all`
  - `--scenario`: `leverage-mint` | `leverage-redeem`
- Decide high‑level backend:
  - If `TEST_RPC_URL` is set → treat as a “custom” override and do not assume Anvil/Tenderly semantics.
  - Else if `--backend=anvil` (or no Tenderly config and `--backend` not forced) → use **Anvil**.
  - Else if `--backend=tenderly` (or `--backend=auto` and Tenderly config is present) → use **Tenderly JIT**.
- For multi‑chain runs (`--chain`), drive either JIT VNets or static endpoints per chain.
- Build an environment for the child test process via `withTestDefaults(...)`:
  - Set `TEST_CHAIN`, `TEST_MODE`, `TEST_SCENARIO`, `TEST_RPC_URL`, `VITE_BASE_RPC_URL`, `VITE_TEST_RPC_URL`.
  - For E2E, ensure `VITE_TEST_MODE=mock` and `VITE_E2E=1`.
  - Decide `E2E_TOKEN_SOURCE` and `VITE_INCLUDE_TEST_TOKENS` based on backend (Tenderly vs Anvil) unless they are explicitly set.

It **does not** know anything about specific contract addresses or leverage token definitions; those come from the shared fixtures and contract config.

### 2. `tests/shared/backend.ts`

Responsibilities:

- Given `{ chain, mode, scenario }`, resolve a `ResolvedBackend`:
  - `chainKey`: `base` | `mainnet`
  - `mode`: `anvil` | `tenderly-jit` | `tenderly-static`
  - `rpcUrl`, `adminRpcUrl`
  - `executionKind`: `'anvil' | 'tenderly'`
  - `scenario`: resolved scenario definition from `tests/shared/scenarios`.
  - `contractOverrides` for Tenderly VNets (e.g. deterministic address maps).
- Handle static Tenderly VNets via `STATIC_ENDPOINTS` and `tenderly-static` mode.
- Handle Anvil via local RPC (`TEST_RPC_URL` / `ANVIL_RPC_URL` fallbacks).
- **Default mode (target state):** `DEFAULT_MODE = 'anvil'`, so a bare call to `resolveBackend()` in tests uses Anvil unless env explicitly says otherwise.

### 3. `tests/shared/env.ts`

Responsibilities:

- Load test env from:
  - Project `.env.local` and `.env`.
  - `tests/integration/.env` for integration/E2E‑specific values.
- Parse core env (RPC URLs, `TEST_PRIVATE_KEY`, token addresses) via Zod.
- Call `resolveBackend()` to get the active backend and scenario.
- Export:
  - `BACKEND`, `CHAIN`, `CHAIN_ID`, `RPC`.
  - Scenario‑driven values: `TOKEN_SOURCE`, `LEVERAGE_TOKEN_KEY`, `ADDR`, etc.
- Normalize process env for downstream tools (Playwright, Vitest, app under test):
  - `TEST_CHAIN`, `TEST_MODE`, `TEST_SCENARIO`.
  - `TEST_RPC_URL`, `VITE_TEST_RPC_URL`, `VITE_BASE_RPC_URL`.
  - For Tenderly: `TENDERLY_VNET_PRIMARY_RPC`, `TENDERLY_VNET_ADMIN_RPC`, `VITE_CONTRACT_ADDRESS_OVERRIDES`.

In other words, `tests/shared/env.ts` is the **single source of truth** for “what backend are we on right now?” and “what chain config does that imply?” for tests.

### 4. Playwright (`playwright.config.ts`) and E2E global setup

- `playwright.config.ts` imports from `tests/shared/env.ts`:
  - `RPC` (primary/admin RPC URLs).
  - Leverage token addresses and labels.
  - Token source and chain id.
- It then:
  - Propagates those into `process.env` and `webServer.env`.
  - Sets `VITE_BASE_RPC_URL`, `VITE_TEST_RPC_URL`, `VITE_ANVIL_RPC_URL`.
  - Sets `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_THEGRAPH_API_KEY`, and contract override envs.
  - Enables `VITE_INCLUDE_TEST_TOKENS` based on `process.env['VITE_INCLUDE_TEST_TOKENS']` (set by `scripts/run-tests.ts`) or, if unset, falls back to a simple source-based heuristic.
- `tests/e2e/global-setup.ts`:
  - Logs which backend mode is used (`BACKEND.mode`).
  - If `executionKind === 'anvil'`, validates that the local RPC is reachable and has the expected chain id.

## Leverage Token Selection in Tests

From a tester’s point of view, the main concern is usually:

- “Which leverage token(s) am I exercising in this run?”
- “…and do I need tokens that are hidden from the normal UI (test‑only / Tenderly‑only)?”

### Sources and Keys

Test fixtures distinguish between:

- **Sources** (`LeverageTokenSource`):
  - `'prod'` – tokens that correspond to real production deployments.
  - `'tenderly'` – tokens and adapter configs that exist only on Tenderly VNets or are meant for test‑only flows.
- **Keys** (`LeverageTokenKey`):
  - Stable string identifiers like `weeth-weth-17x`, `wsteth-eth-25x`, `pt-rlp-4dec2025-usdc-2x`, etc.
  - Defined in `tests/fixtures/addresses.ts` for tests, and mirrored in the app’s leverage token config for prod tokens.

The combination `(source, key)` tells the harness which concrete deployment and routing policy to use.

### Current Single-Token Override

Today the harness supports overriding a single leverage token via env:

- `E2E_LEVERAGE_TOKEN_KEY`
  - If set: tests will exercise that token (subject to validation against the chosen `source`).
  - If not set: tests fall back to the default key for the active scenario (`DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY` / `DEFAULT_PROD_LEVERAGE_TOKEN_KEY`).

The **source** comes from:

- The scenario registry in `tests/shared/scenarios/index.ts` (per chain), and/or
- `E2E_TOKEN_SOURCE` when explicitly set.

This works for “I want to focus on the Pendle token” today by setting:

- `E2E_LEVERAGE_TOKEN_KEY=pt-rlp-4dec2025-usdc-2x`

but there are a couple of wrinkles:

- Some tokens are marked as “test‑only” or exist only on Tenderly VNets, so the UI hides them by default.
- E2E runs that need those tokens currently rely on `VITE_INCLUDE_TEST_TOKENS=true` to make them visible in the app, which leaks a UI concern into the testing mindset.

### Future Direction: Test-Only Tokens

For future work (separate PR), the design goal is:

- As a tester, I should be able to say:
  - “Run integration/E2E tests against this leverage token key,”
  - without having to know about `VITE_INCLUDE_TEST_TOKENS` or other UI flags.

Conceptually, that could look like:

- **Test-only tokens:**
  - The “test‑only” marker (e.g. `isTestOnly` in the app config) remains a UI visibility flag.
  - The test harness:
    - Treats any key present in `tests/fixtures/addresses.ts` as selectable regardless of UI visibility.
    - Would automatically enable `VITE_INCLUDE_TEST_TOKENS` for E2E runs when the requested key refers to any test‑only/tenderly‑only token.
  - From the tester’s perspective: you only think in terms of a single leverage token key and source; the harness arranges UI flags as needed.

This document intentionally stops short of specifying the exact implementation, but the **intent** is clear:

- Primary knobs for testers:
  - Backend profile (Anvil vs Tenderly).
  - A single leverage token key (`E2E_LEVERAGE_TOKEN_KEY`).
- Today, CI and `tests/integration/.env.example` explicitly set `VITE_INCLUDE_TEST_TOKENS=true` for chain‑aware tests; a future refinement is to move that behavior into the harness so the flag becomes an implementation detail instead of a manual toggle.

## Known Inconsistencies / Cleanup Opportunities

This doc describes the **target** mental model. The current repo is close, but there are a few gaps and duplicated concepts:

- **Backend default mismatch**
  - `tests/shared/backend.ts` still comments “Default to Tenderly JIT VNets for tests” and sets `DEFAULT_MODE = 'tenderly-jit'`, while scripts/docs increasingly assume Anvil‑first.
  - Action: flip `DEFAULT_MODE` to `'anvil'` and update comments so bare `resolveBackend()` matches the Anvil default story.

- **Docs disagree on default backend**
  - `AGENTS.md` still says “Tenderly is the default and preferred backend,” while `CLAUDE.md`, `tests/integration/README.md` and `package.json` scripts use Anvil by default.
  - `tests/TESTING_MINT_FLOW.md` also calls Tenderly the default.
  - Action: choose one canonical statement (Anvil‑first) and sync all docs, including `AGENTS.md` and `CLAUDE.md` as required by project rules.

- **Integration README vs actual layout/scripts**
  - `tests/integration/README.md` mentions `setup.ts`, `utils.ts`, and a `test:integration:anvil` script that may no longer exist or match the current structure.
  - Action: refresh the README to match:
    - The current directory layout under `tests/integration/`.
    - The actual scripts in `package.json` (`test:integration`, `test:integration:tenderly`, etc.).

- **Scattered `VITE_INCLUDE_TEST_TOKENS` logic**
  - `scripts/run-tests.ts` (`withTestDefaults`), `playwright.config.ts`, `tests/integration/.env.example`, and CI snippets all have slightly different rules for when test‑only tokens are included.
  - Action (in progress): treat `scripts/run-tests.ts` as the single source of truth for this flag:
    - For chain-aware tests (integration/E2E), `withTestDefaults` now defaults `VITE_INCLUDE_TEST_TOKENS` to `true` when it is not explicitly set.
    - `playwright.config.ts` prefers `process.env['VITE_INCLUDE_TEST_TOKENS']` and only falls back to its own heuristic when the env var is missing.
    - CI and `tests/integration/.env.example` still set the flag explicitly, but that now matches the script’s default behavior rather than fighting it.

- **Environment variable naming / docs**
  - `.env.example` marks `VITE_ALCHEMY_API_KEY` as optional, but `anvil:mainnet` requires a working Alchemy key.
  - `tests/integration/README.md` uses `ALCHEMY_API_KEY` in the CI snippet, which doesn’t match the app’s `VITE_*` naming convention.
  - Action: clearly document `VITE_ALCHEMY_API_KEY` as “required for Anvil mainnet/mainnet‑base forks” and unify the name in docs and CI examples.

- **Overlapping backend selection knobs**
  - Today backend can be influenced by `--backend`, `TEST_MODE`, `TEST_RPC_URL`, `TENDERLY_RPC_URL`, and `VITE_TEST_RPC_URL_MAP`.
  - Action: document the precedence order in one place (this doc or AGENTS/CLAUDE), and consider slimming it down in future refactors so that:
    - CLI `--backend` is primary.
    - `TEST_RPC_URL` is a low‑level escape hatch, not a primary configuration tool.

This document is meant as a living reference while we finish aligning code and documentation. Once the invariants above are enforced in code, the “Known inconsistencies” section can be shortened or removed.
