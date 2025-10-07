# Mint Flow Testing Strategy

This document outlines the end-to-end testing approach for the new mint flow (domain logic, hooks, integration with Tenderly VNet, and E2E UI). It supersedes legacy router-based tests.

## Overview

- Goals: Validate mint planning/execution (V2), allowances, preview UX, and full user journeys.
- Default backend: Tenderly VNet JIT environments for integration and E2E (preferred). Anvil is only a local fallback.
- Scope: Unit (domain + hooks), Integration (on-chain), and E2E (Playwright).

## Commands

- Development: `bun dev`, `bun build`, `bun preview`
- Quality: `bun check:fix`, `bun check`, `bun format`, `bun typecheck`
- Tests: `bun run test`, `bun run test:ui`, `bun run test:coverage`, `bun run test:integration`, `bun run test:e2e`

## Backends

- Tenderly VNet (default):
  - Set `TENDERLY_ACCESS_KEY`, `TENDERLY_ACCOUNT`, `TENDERLY_PROJECT`.
  - Integration/E2E tests create and delete VNets just-in-time.
- Anvil fallback (local only):
  - Terminal 1: `ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base`
  - Terminal 2: `TEST_RPC_URL=http://127.0.0.1:8545 bun run test:integration`

### Tenderly VNet Caveat (Router V2 focus)

- Current V2 deployment exists only on a Tenderly VNet forked from Base.
- Use this RPC for testing V2 flows: `https://virtual.base.us-east.rpc.tenderly.co/a606fc5c-d9c5-4fdc-89d0-8cce505aaf81` (admin RPC enabled for funding via `tenderly_*` methods).
- Deployed addresses on this VNet (audit-fixes branch):
  - LeverageManager: `0x959c574EC9A40b64245A3cF89b150Dc278e9E55C`
  - LeverageRouter (V2): `0xfd46483b299197c616671b7df295ca5186c805c2`
  - LeverageToken (WEETH-WETH 17x): `0x17533ef332083aD03417DEe7BC058D10e18b22c5`
  - LeverageToken implementation: `0xfFEF572c179AC02F6285B0da7CB27176A725a8A1`
  - LeverageToken factory: `0xA6737ca46336A7714E311597c6C07A18A3aFdCB8`
  - LendingAdapter implementation: `0x561D3Fa598AFa651b4133Dc01874C8FfEbBD4817`
  - LendingAdapterFactory: `0x04f20d88254Dc375A7eF5D9bC6Cf4AAE65C18583`
  - LendingAdapter proxy: `0xbA63aC9B956EF23F8788dE4EdD4c264b5dF35fA0`
  - RebalanceAdapter: `0x85416Da07e256d7c058938aDb9D13d7F3d3eCAc3`
  - VeloraAdaptor: `0x1162c0c4491f143ab4142e4c3d349bcb8df77b96`
  - MulticallExecutor: `0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd`

Notes:
- Some contracts may be unverified yet; ABI coverage comes from our codegen.
- Integration/E2E harnesses now auto-detect the active RPC's chain id and use the canonical addresses from `src/lib/contracts/addresses.ts`, so no manual env overrides are required.
- Public VNet view: `https://dashboard.tenderly.co/explorer/vnet/3433d25e-64a4-4ea1-96c1-fbc9e6022e30/transactions`

## Test Categories

### 1) Unit — Domain Logic
- ensureAllowance
  - Enough allowance: returns `{ changed:false }` with no simulate/write.
  - Insufficient: simulates `approve(maxUint256)`, writes once, returns hash.
  - Uses injected `simulateContract` and `writeContract` when provided.
- math helpers (applySlippageFloor, mulDivFloor)
  - Boundary cases: zero, large values, rounding direction.
- planMintV2
  - Input == collateral: no input conversion calls; uses user equity directly.
  - Input != collateral without quote: throws “no converter”.
  - Debt swap sizing: re-quote path when initial `quote.out < neededFromDebtSwap`.
  - Reprice validation: throws when `previewedDebt < planned debtIn`.
  - Output structure: correct `minShares`, `expected*`, calls ordering (approve → swap per leg).
- executeMintV2
  - Defaults `maxSwapCost` from `expectedTotalCollateral` unless overridden.
  - simulate → write path uses generated actions; returns hash.
- orchestrateMint
  - V2 requires `quoteDebtToCollateral` or throws.
  - Returns `{ hash, plan }`.

Mocking policy: Unit tests mock `@/lib/contracts/generated` and do not use network.

### 2) Unit — Hooks

- useMintPreview
  - Debounce: with fake timers, one call after idle; none during rapid input.
  - Enabled: disabled for `undefined` and `0n`; enabled for positive bigint.
  - Query key: includes `chainId` when available, uses stringified amount for stability.
  - Status mapping: `isLoading` only when enabled; error/data pass-through.
- useMintWithRouter
  - Happy path: returns `{ hash }` via `orchestrateMint` mock; correct loading/success states.
  - Errors: bubbles domain errors (e.g., missing quote for V2) to hook `error`.
  - If approvals are coordinated by the hook, assert sequence (approve → mint).

Libraries: React Testing Library + @tanstack/react-query test utils. Mock orchestrator and generated actions.

### 3) Integration — Tenderly VNet

- Preview
  - `readLeverageManager.previewMint` with realistic equity returns positive `shares` and coherent fees.
- V2 Plan + Execute (single-tx)
  - Quote fns return `approvalTarget` + `calldata`; plan contains:
    - Input==collateral: only debt leg approve+swap.
    - Input!=collateral: input leg approve+swap first, then debt leg.
  - Default integration setup uses an on-chain Uniswap V2/Aerodrome quote for deterministic swaps; LiFi path can be re-enabled with `TEST_USE_LIFI=1` when comparing against live routing.
  - `executeMintV2` simulate succeeds; write returns hash.
  - Reprice guard: under-sized debt quote triggers “preview debt < planned” error.
- Allowances on-chain
  - Start with 0 allowance; ensureAllowance approves; assert allowance increases.

Use admin RPC (Tenderly) to set balances, snapshots, and revert between tests.

### 4) E2E — Playwright (Local Anvil by default)

- Config: `VITE_TEST_MODE=mock`, `VITE_BASE_RPC_URL=http://127.0.0.1:8545`, chainId 8453.
- Happy Path (must succeed)
  - Connect mock wallet; select token and input asset; type equity; preview renders.
  - Approve if required; then Mint; wait for tx; assert success state and updated balances.
- Slippage / Min Shares
  - Adjust slippage; assert computed `minShares` in UI and usage in tx.
  - Very tight slippage triggers revert; assert decoded error visibility.
- Chain alignment
  - Wrong chainId shows alignment error in UI.
- Funding errors
  - No pre-funding: UI shows insufficient balance and disables Mint until funded.
- Preview UX
  - Rapid input: preview stabilizes after debounce, not per keystroke.

### File Layout (current)

- Unit
  - `tests/unit/mint/math.unit.test.ts`
  - `tests/unit/mint/plan.v2.unit.test.ts`
  - `tests/unit/hooks/useMintPreview.spec.tsx`
- Integration (Tenderly VNet)
  - `tests/integration/leverage-tokens/mint/router.v2.mint.spec.ts`
- E2E (Playwright)
  - `tests/e2e/basic-app.spec.ts`

## Deprecations (to remove)

- `tests/integration/leverage-tokens/mint/router.test.ts`
- `tests/unit/mint/mintWithRouter.unit.test.ts`

## CI Guidance

- Unit: Fast lane on every PR (`bun test --run unit`).
- Integration: Run on PRs touching `src/domain/**`, `src/lib/contracts/**`, or `src/features/**/mint/**`.
- E2E: Nightly and on release branches; optional on-demand for PRs.

## Conventions

- Avoid duplicating contract addresses; import from `@/lib/contracts/addresses` or mock.
- Keep ABIs minimal; rely on `@/lib/contracts/generated` actions and mock them in unit tests.
- Always run `bun check:fix` after adding tests.
