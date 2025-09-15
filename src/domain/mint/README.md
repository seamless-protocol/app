Mint Domain — Planner, Ports, Executor

Overview
- Purpose: Orchestrate leverage-token minting across router versions.
- Current scope: A v2 planner (collateral-only) plus v1/v2 executors. Approvals handled in UI/hooks.
- Key files: `planner/plan.v2.ts`, `exec/execute.v1.ts`, `exec/execute.v2.ts`, `ports/*`, `orchestrate.ts`, `adapters/lifi.ts`, `utils/allowance.ts`.

Version Selection
- `utils/detectVersion.ts` chooses v1 or v2 using `VITE_ROUTER_VERSION` or the presence of v2 env addresses (`VITE_ROUTER_V2_ADDRESS`, `VITE_MANAGER_V2_ADDRESS`).

Folder Structure
- `planner/`: Planning and math
  - `plan.v2.ts`: Build v2 plan (collateral-only for now)
  - `math.ts`: Slippage and math helpers
  - `types.ts`: Plan, Quote, RouterVersion types
- `ports/`: Chain read/write facades
  - `managerPort.ts`: Manager previews for v1/v2
  - `routerPort.v1.ts`: Router v1 preview + invoke
  - `routerPort.v2.ts`: Router v2 preview + invoke
  - `index.ts`: Re-exports
- `exec/`: Transaction senders
  - `execute.v1.ts`: V1 mint path (collateral-only)
  - `execute.v2.ts`: V2 deposit path (with calls)
- `adapters/`
  - `lifi.ts`: Exact-input quote builder
- `utils/`
  - `detectVersion.ts`: Router version detection
  - `swapContext.ts`: Swap context for v1
  - `constants.ts`: Defaults and BPS helpers
  - `allowance.ts`: Allowance utilities
  - `previewMint.ts`: Local preview helper for tests
- `orchestrate.ts`: Version switch + plan/execute
- `index.ts`: Public entry for domain exports

Planner (v2)
- File: `planner/plan.v2.ts`.
- Behavior: collateral-only initial scope. Reads assets, previews ideal, sizes debt with underfill scaling, re-previews to enforce repayability, computes `minShares`, and returns debt-leg `calls[]` (approve+swap) for the router.
- Not yet implemented: input→collateral conversion leg (v2). Throws if `inputAsset != collateralAsset`.

Executors
- v2: `exec/execute.v2.ts` simulates then writes `deposit(token, collateralFromSender, flashLoanAmount, minShares, calls)`.
- v1: `exec/execute.v1.ts` enforces collateral-only, previews, computes `minShares`, computes default `maxSwapCost` (2%), builds `swapContext` (Base + weETH special-case), simulates then writes `mint(...)`.

Ports
- Manager (v2): `createManagerPortV2` prefers `router.previewDeposit` for ideal and `manager.previewDeposit` for final.
- Manager (v1): `createManagerPortV1` uses `manager.previewMint` for ideal and approximates final with `previewMint` (executor simulation enforces feasibility).
- Router (v2): `createRouterPortV2` previews and invokes `deposit` with encoded calls.
- Router (v1): `createRouterPortV1` previews via manager and invokes `mint`.

Allowances
- UI handles approvals via hooks. Domain helper `ensureAllowance` exists (`utils/allowance.ts`) with `resetThenMax` support (approve(0) then approve(max)).

Quotes
- Adapter: `adapters/lifi.ts` builds exact-input quotes returning `{ out, approvalTarget, calldata }`.
- Note: We currently don’t enforce a `deadline` field on quotes; add if required by policy.

Orchestrator
- `orchestrate.ts` selects version, plans for v2, executes for selected router. Returns `{ routerVersion, hash, plan? }`.

Testing
- Unit: planner math/guards, ports, orchestrator, allowance helper.
- Integration: `tests/integration/leverage-tokens/mint/router.v2.mint.spec.ts` (Tenderly VNet happy path). Run `bun run test:integration` with Tenderly env, or use `TEST_RPC_URL` for local fallback.

Alignment with Planner Doc
- Intentional differences:
  - Single planner only for v2 (initial scope); v1 uses simple execute with simulate guard.
  - v2 user conversion (input≠collateral) is deferred; current planner is collateral-only.
  - Simulate guard for v1 lives in the executor, not in a manager-port `finalPreviewOrSimulate` method.
  - Quote `deadline` not enforced yet.

Roadmap (high-value next steps)
- Add v2 input→collateral conversion leg; set `collateralFromSender=0` when converting.
- Enforce quote `deadline` and recipient policies.
- Optional: introduce a common planner wrapper for v1 to unify return shape and telemetry.
- Emit telemetry (router version, scaled flag, reprice rate, excess debt).

Rationale
- Separate planning vs execution concerns; keep ABI-facing ports isolated; make adapters and small utils easily testable; simplify future expansion (conversion leg, shared planner).
