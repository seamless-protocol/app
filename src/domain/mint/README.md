Mint Domain — Planner, Ports, Executor

Overview
- Purpose: Orchestrate leverage-token minting (V2 only).
- Current scope: A v2 planner and v2 executor. Approvals handled in UI/hooks.
- Key files: `planner/plan.v2.ts`, `exec/execute.v2.ts`, `ports/*`, `orchestrate.ts`, `adapters/lifi.ts`, `utils/allowance.ts`.

Version Selection
- V2 only. Version detection has been removed.

Folder Structure
- `planner/`: Planning and math
  - `plan.v2.ts`: Build v2 plan
  - `math.ts`: Slippage and math helpers
  - `types.ts`: Plan, Quote types
- `ports/`: Chain read/write facades
  - `managerPort.ts`: Manager previews for v2
  - `routerPort.v2.ts`: Router v2 preview + invoke
  - `index.ts`: Re-exports
- `exec/`: Transaction senders
  - `execute.v2.ts`: V2 deposit path (with calls)
- `adapters/`
  - `lifi.ts`: Exact-input quote builder
- `utils/`
  - `constants.ts`: Defaults and BPS helpers
  - `allowance.ts`: Allowance utilities
  - `previewMint.ts`: Local preview helper for tests
- `orchestrate.ts`: V2 plan and execute
- `index.ts`: Public entry for domain exports

Planner (v2)
- File: `planner/plan.v2.ts`.
- Behavior: collateral-only initial scope. Reads assets, previews ideal, sizes debt with underfill scaling, re-previews to enforce repayability, computes `minShares`, and returns debt-leg `calls[]` (approve+swap) for the router.
- Not yet implemented: input→collateral conversion leg (v2). Throws if `inputAsset != collateralAsset`.

Executors
- v2: `exec/execute.v2.ts` simulates then writes `deposit(token, collateralFromSender, flashLoanAmount, minShares, calls)`.

Ports
- Manager (v2): `createManagerPortV2` prefers `router.previewDeposit` for ideal and `manager.previewDeposit` for final.
- Router (v2): `createRouterPortV2` previews and invokes `deposit` with encoded calls.

Allowances
- UI handles approvals via hooks. Domain helper `ensureAllowance` exists (`utils/allowance.ts`) with `resetThenMax` support (approve(0) then approve(max)).

Quotes
- Adapter: `adapters/lifi.ts` builds exact-input quotes returning `{ out, approvalTarget, calldata }`.
- Note: We currently don’t enforce a `deadline` field on quotes; add if required by policy.

Orchestrator
- `orchestrate.ts` plans and executes v2. Returns `{ routerVersion: 'v2', hash, plan }`.

Testing
- Unit: planner math/guards, ports, orchestrator, allowance helper.
- Integration: `tests/integration/leverage-tokens/mint/router.v2.mint.spec.ts` (Tenderly VNet happy path). Run `bun run test:integration` with Tenderly env, or use `TEST_RPC_URL` for local fallback.

Alignment with Planner Doc
- Intentional differences:
  - Single planner for v2 (collateral-only scope).
  - v2 user conversion (input≠collateral) is deferred; current planner is collateral-only.
  - Quote `deadline` not enforced yet.

Roadmap (high-value next steps)
- Add v2 input→collateral conversion leg; set `collateralFromSender=0` when converting.
- Enforce quote `deadline` and recipient policies.
- Emit telemetry (scaled flag, reprice rate, excess debt).

Rationale
- Separate planning vs execution concerns; keep ABI-facing ports isolated; make adapters and small utils easily testable; simplify future expansion (conversion leg, shared planner).
