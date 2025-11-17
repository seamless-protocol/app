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

## Environment Variables Overview

To reduce cognitive load, it helps to think of env vars in a few small groups.

### Core Testing Vars

| Variable                | Required For                  | Set By / Used In                     | Notes                                                     |
|-------------------------|------------------------------|--------------------------------------|-----------------------------------------------------------|
| `VITE_ALCHEMY_API_KEY`  | Integration/E2E (Anvil forks)| `.env(.local)`, CI, `anvil:*` scripts| Single Alchemy key for Base/Mainnet forks                 |
| `VITE_INCLUDE_TEST_TOKENS` | Integration/E2E (optional override) | CI, `.env`, `scripts/run-tests.ts` | When unset, `scripts/run-tests.ts` defaults it to `true` for chain‑aware suites |
| `TEST_CHAIN`            | Advanced (multi‑chain runs)  | `scripts/run-tests.ts`, tests        | Logical chain slug: `base` or `mainnet`                  |
| `TEST_MODE`             | Backend mode (internal)      | `scripts/run-tests.ts`, `backend.ts` | Values like `anvil`, `tenderly-jit`, `tenderly-static`   |
| `TEST_SCENARIO`         | Scenario selection (mint/redeem)| `scripts/run-tests.ts`, `env.ts`  | Keys like `leverage-mint` or `leverage-redeem`           |
| `TEST_RPC_URL`          | Node URL for tests           | `scripts/run-tests.ts`, `backend.ts` | Underlying RPC the tests hit (Anvil, Tenderly, etc.)     |
| `VITE_TEST_RPC_URL`     | Node URL for frontend        | `env.ts`, Playwright                 | Same as `TEST_RPC_URL` but exposed to the app via Vite   |

### Tenderly Configuration (Advanced)

| Variable             | Required For      | Used By             | Notes                            |
|----------------------|-------------------|---------------------|----------------------------------|
| `TENDERLY_ACCOUNT`   | Tenderly JIT/CI   | `scripts/run-tests.ts`, `tenderly-vnet.ts` | Account slug                   |
| `TENDERLY_PROJECT`   | Tenderly JIT/CI   | same                | Project slug                     |
| `TENDERLY_ACCESS_KEY`| Tenderly JIT/CI   | same                | API access key                   |
| `TENDERLY_TOKEN`     | Optional Tenderly | same                | Alternative auth (Bearer token)  |

### Leverage Token Selection

| Variable                    | Role                            | Notes                                             |
|-----------------------------|---------------------------------|---------------------------------------------------|
| `E2E_LEVERAGE_TOKEN_KEY`    | Primary knob for testers        | Which leverage token definition to exercise       |
| `E2E_TOKEN_SOURCE`          | Advanced override               | Force `'prod'` vs `'tenderly'`; usually inferred  |

For day‑to‑day work:

- Most contributors only need to set:
  - `VITE_ALCHEMY_API_KEY` (for Anvil forks used in integration/E2E).
  - The usual app envs in `.env.local` (WalletConnect, TheGraph, etc.).
- Testers occasionally set:
  - `E2E_LEVERAGE_TOKEN_KEY` to focus on a specific token (e.g. a new Pendle token).
- Everything else (`TEST_*`, `VITE_TEST_RPC_URL`, `E2E_TOKEN_SOURCE`) is typically managed by `scripts/run-tests.ts` and `tests/shared/env.ts`.

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

This doc describes the **target** mental model. The current repo is now close to this, but a few areas still deserve attention:

- **Mint-flow documentation drift**
  - `tests/TESTING_MINT_FLOW.md` still leans Tenderly‑first in its narrative.
  - Follow‑up: refresh this doc to match the Anvil‑default story while still documenting Tenderly‑based flows where needed.

- **Overlapping backend selection knobs**
  - Backend can still be influenced by `--backend`, `TEST_MODE`, `TEST_RPC_URL`, `TENDERLY_RPC_URL`, and `VITE_TEST_RPC_URL_MAP`.
  - Follow‑up: continue to treat CLI `--backend` as primary, keep `TEST_RPC_URL` as an expert override, and consider trimming unused env knobs in future refactors.

This document is meant as a living reference while we finish aligning code and documentation. As the remaining cleanups land, this section can be simplified further.
