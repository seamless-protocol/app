Mint Domain — Planner, Ports, Executor

Overview
- Purpose: Orchestrate leverage-token minting across router versions.
- Current scope: A v2 planner (collateral-only) plus v1/v2 executors. Approvals handled in UI/hooks.
- Key files: `plan.v2.ts`, `execute.v1.ts`, `execute.v2.ts`, `ports/managerPort.ts`, `orchestrate.ts`, `adapters/lifi.ts`, `allowance.ts`.

Version Selection
- `detectVersion.ts` chooses v1 or v2 using `VITE_ROUTER_VERSION` or presence of v2 env addresses (`VITE_ROUTER_V2_ADDRESS`, `VITE_MANAGER_V2_ADDRESS`).

Planner (v2)
- File: `plan.v2.ts`.
- Behavior: collateral-only initial scope. Reads assets, previews ideal, sizes debt with underfill scaling, re-previews to enforce repayability, computes `minShares`, and returns debt-leg `calls[]` (approve+swap) for the router.
- Not yet implemented: input→collateral conversion leg (v2). Throws if `inputAsset != collateralAsset`.

Executors
- v2: `execute.v2.ts` simulates then writes `deposit(token, collateralFromSender, flashLoanAmount, minShares, calls)`.
- v1: `execute.v1.ts` enforces collateral-only, previews, computes `minShares`, computes default `maxSwapCost` (2%), builds `swapContext` (Base + weETH special-case), simulates then writes `mint(...)`.

Ports
- Manager (v2): `createManagerPortV2` prefers `router.previewDeposit` for ideal and `manager.previewDeposit` for final.
- Manager (v1): `createManagerPortV1` uses `manager.previewMint` for ideal and approximates final with `previewMint` (feasibility is enforced by executor simulation).

Allowances
- UI handles approvals via hooks. Domain helper `ensureAllowance` exists (`allowance.ts`) with `resetThenMax` support (approve(0) then approve(max)).

Quotes
- Adapter: `adapters/lifi.ts` builds exact-input quotes returning `{ out, approvalTarget, calldata }`.
- Note: We currently don’t enforce a `deadline` field on quotes; add if required by policy.

Orchestrator
- `orchestrate.ts` selects version, plans for v2, executes for selected router. Returns `{ routerVersion, hash, plan? }`.

Testing
- Unit: planner math/guards, ports, orchestrator, allowance helper.
- Integration: `tests/integration/leverage-tokens/mint/router.v2.mint.spec.ts` (Tenderly VNet happy path). Use `bun run test:integration` (JIT VNet by default with Tenderly env) or `test:integration:raw` with `TEST_RPC_URL`.

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

Proposed Folder Structure (future refactor)
- `src/domain/mint/`
  - `planner/`
    - `plan.v2.ts` (and future `plan.common.ts` if v1 added)
    - `math.ts` (slippage, mulDivFloor)
    - `types.ts` (Plan, Quote, RouterVersion)
  - `ports/`
    - `managerPort.ts`
    - `index.ts`
  - `exec/`
    - `execute.v1.ts`
    - `execute.v2.ts`
  - `adapters/`
    - `lifi.ts`
  - `utils/`
    - `detectVersion.ts`
    - `swapContext.ts`
    - `constants.ts`
    - `allowance.ts`
  - `orchestrate.ts`

Rationale
- Separate planning vs execution concerns; keep ABI-facing ports isolated; make adapters and small utils easily testable; simplify future expansion (conversion leg, shared planner).

