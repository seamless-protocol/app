Mint Domain — Planner

Overview
- Purpose: Plan leverage-token minting.
- Current scope: A planner. Approvals handled in UI/hooks. Execution is performed directly via generated actions (simulate → write) in app hooks and tests.
- Key files: `planner/plan.ts`, `utils/createDebtToCollateralQuote.ts`, `utils/allowance.ts`.

Folder Structure
- `planner/`: Planning and math
  - `plan.ts`: Build plan
  - `math.ts`: Slippage and math helpers
  - `types.ts`: Plan, Quote types
- `utils/`: Utilities and helpers
  - `constants.ts`: Defaults and BPS helpers
  - `allowance.ts`: Allowance utilities
  - `createDebtToCollateralQuote.ts`: Quote adapter factory for debt→collateral swaps
- `index.ts`: Public entry for domain exports

Note: Adapters are located in `domain/shared/adapters/` (shared across mint and redeem).

Planner
- File: `planner/plan.ts`.
- Behavior: collateral-only initial scope. Reads assets, previews ideal, sizes debt with underfill scaling, re-previews to enforce repayability, computes `minShares`, and returns debt-leg `calls[]` (approve+swap) for the router.
- Not yet implemented: input→collateral conversion leg. Throws if `inputAsset != collateralAsset`.

Execution
- In-app: `useMintWrite` hook performs network switch → simulate → write using generated actions.

Contract Interactions
- Previews use `readLeverageRouterV2PreviewDeposit` from generated actions.
- Router calls use `simulateLeverageRouterV2Deposit` and `writeLeverageRouterV2Deposit` from generated actions.

Allowances
- UI handles approvals via hooks. Domain helper `ensureAllowance` exists (`utils/allowance.ts`) with `resetThenMax` support (approve(0) then approve(max)).

Quotes
- Adapters: Located in `domain/shared/adapters/` (lifi, uniswapV2, uniswapV3, velora).
- Factory: `utils/createDebtToCollateralQuote.ts` creates quote adapters based on token configuration.
- Quote adapters return `{ out, approvalTarget, calls }`.
- Note: We currently don't enforce a `deadline` field on quotes; add if required by policy.

Orchestrator
- Use `planMint` + generated actions directly.

Testing
- Unit: planner math/guards, allowance helper, hooks.
- Integration: `tests/integration/leverage-tokens/mint/router.v2.mint.spec.ts` (Tenderly VNet happy path). Run `bun run test:integration` with Tenderly env, or use `TEST_RPC_URL` for local fallback.

Alignment with Planner Doc
- Intentional differences:
  - Single planner (collateral-only scope).
  - User conversion (input≠collateral) is deferred; current planner is collateral-only.
  - Quote `deadline` not enforced yet.

Roadmap (high-value next steps)
- Add input→collateral conversion leg; set `collateralFromSender=0` when converting.
- Enforce quote `deadline` and recipient policies.
- Emit telemetry (scaled flag, reprice rate, excess debt).

Rationale
- Separate planning vs execution concerns; use generated actions directly for contract interactions; make adapters and small utils easily testable; simplify future expansion (conversion leg, shared planner).
