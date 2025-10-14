Mint Domain — Planner, Ports, Executor

Overview
- Purpose: Plan leverage-token minting (V2 only).
- Current scope: A v2 planner. Approvals handled in UI/hooks. Execution is performed directly via generated actions (simulate → write) in app hooks and tests.
- Key files: `planner/plan.v2.ts`, `ports/*`, `adapters/lifi.ts`, `utils/allowance.ts`.

Folder Structure
- `planner/`: Planning and math
  - `plan.v2.ts`: Build v2 plan
  - `math.ts`: Slippage and math helpers
  - `types.ts`: Plan, Quote types
- `ports/`: Chain read/write facades
  - `managerPort.ts`: Manager previews for v2
  - `routerPort.v2.ts`: Router v2 preview + invoke
  - `index.ts`: Re-exports
- (removed) `exec/`: Transaction senders. Execution is now done in-app via generated actions.
- `adapters/`
  - `lifi.ts`: Exact-input quote builder
- `utils/`
  - `constants.ts`: Defaults and BPS helpers
  - `allowance.ts`: Allowance utilities
  - `previewMint.ts`: Local preview helper for tests
- (removed) `orchestrate.ts`: In-app hooks call generated actions directly.
- `index.ts`: Public entry for domain exports

Planner (v2)
- File: `planner/plan.v2.ts`.
- Behavior: collateral-only initial scope. Reads assets, previews ideal, sizes debt with underfill scaling, re-previews to enforce repayability, computes `minShares`, and returns debt-leg `calls[]` (approve+swap) for the router.
- Not yet implemented: input→collateral conversion leg (v2). Throws if `inputAsset != collateralAsset`.

Execution
- In-app: `useMintWrite` hook performs network switch → simulate → write using generated actions.

Ports
- V2 previews use `router.previewDeposit(token, userCollateral)` exclusively (equity-only semantics).
- Router (v2): `createRouterPortV2` previews and invokes `deposit` with encoded calls.

Allowances
- UI handles approvals via hooks. Domain helper `ensureAllowance` exists (`utils/allowance.ts`) with `resetThenMax` support (approve(0) then approve(max)).

Quotes
- Adapter: `adapters/lifi.ts` builds exact-input quotes returning `{ out, approvalTarget, calldata }`.
- Note: We currently don’t enforce a `deadline` field on quotes; add if required by policy.

Orchestrator
- Removed. Use `planMintV2` + generated actions directly.

Testing
- Unit: planner math/guards, ports, allowance helper, hooks.
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

Flow & Invariants
- Goal: Turn your equity (collateral you bring) plus a temporary debt borrow into the exact total collateral needed to mint shares — all in one transaction.
- Steps:
  - Resolve assets: read `collateralAsset` and `debtAsset` from the manager.
  - Require collateral input: `inputAsset === collateralAsset` or throw.
  - Preview ideal: router preview tells us the target total collateral and an initial “ideal debt” for your equity.
  - Compute gap: `neededFromDebtSwap = targetCollateral - userCollateralOut` (must be > 0) — this is what the debt→collateral swap must produce.
  - Size the swap (guaranteed): get a debt→collateral quote with minOut. If `minOut < neededFromDebtSwap`, scale `amountIn` proportionally and re‑quote (few tries) until `minOut ≥ neededFromDebtSwap`.
  - Preview outcomes: manager preview at expected (`quote.out`) and worst‑case (`quote.minOut`) total collateral to read `requiredDebt` and `shares`.
  - Repayability floor: `repayableFloor = min(requiredDebt_expected, requiredDebt_worst)`.
- Choose flash size (explicit):
  - Coverage amount (swapFloor): smallest debt so the swap’s guaranteed `minOut` is ≥ the missing collateral.
  - Manager amount (repayableFloor): min of manager `requiredDebt` at expected and worst‑case totals.
  - Start with `effective = max(coverage amount, manager amount)` — this ensures both coverage and repayability.
  - If `manager amount` is lower than `effective`, try reducing to `manager amount` and re‑quote the swap. Keep the reduction only if the new quote still guarantees `minOut ≥ missing collateral`; otherwise keep the higher amount.
  - Example: if coverage=150 and manager=120, try 120; if its `minOut` still covers the gap, use 120. If not, keep 150.
  - Build calls: 
    - Native path (WETH debt): `withdraw(WETH)` then payable aggregator call (`value = debtIn`).
    - ERC‑20 path: `approve(debt)` for `approvalTarget`, then aggregator call (`value = 0`).
  - Slippage floor: compute `minShares = applySlippageFloor(expectedShares, slippageBps)` for the on‑chain call.
- Invariants/Safety:
  - Collateral‑only input: planner throws when `inputAsset !== collateralAsset`.
  - Coverage: final swap quote must guarantee `minOut ≥ neededFromDebtSwap`.
  - Repayable: final flash size is ≥ repayable floor; if reduced via clamp, it is re‑quoted and re‑previewed.
  - Quote validation: 
    - Native path: adapter must not signal `wantsNativeIn === false`.
    - ERC‑20 path: `approvalTarget` is required, not zero, and not equal to `debtAsset`.
  - Bounded loops: quote scaling attempts are capped (no unbounded iteration).
  - Min shares: on‑chain call uses a floor to protect against share slippage.
  - Scope: no input→collateral conversion leg yet — only collateral input is supported.
  - Telemetry/logs: planner can log under `VITE_MINT_PLAN_DEBUG`, `MINT_PLAN_DEBUG`, or test mode.

Pointers in Code
- Main flow: `planMintV2` (planner/plan.v2.ts).
- Swap sizing: `quoteDebtForMissingCollateral` (planner/plan.v2.ts).
- Repay‑safe selection: `chooseRepaySafeFlashAndQuote` (planner/plan.v2.ts).
- Math helpers: `math.ts` (ceil/floor mul‑div, min/max, slippage).
