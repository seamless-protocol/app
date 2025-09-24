# Mint Flow PRD — Router v2 Implementation

## 0) Goals
- One brain: preview → quote → (maybe) scale → re-preview → guardrails → execute.
- Small surface: ABI branching only at the ports (router/manager), not in the planner.
- One-tx UX for router v2; initial scope is collateral-only (no user conversion). Future: optional user conversion only if the router can pull user input.
- Boring, well-typed, testable; easy to evolve across chains and router versions.

## 1) Constraints & Truths
- Quotes are off-chain (aggregator/DEX payloads). Contracts cannot fetch quotes on-chain.
- Router handles the full flash-loan lifecycle; the client only sizes it and supplies swap calls/context.
- Scale only on underfill; if amountIn changes, re-quote.
- Guardrails must hold before sending:
  - Repayability: `previewDebt ≥ flashLoan'` (prime = scaled loan when underfill).
  - Share floor: `minShares` = floor(previewShares × (1 − slippageBps/10_000)).
  - Swap safety: quotes embed `minOut + deadline` targeting the router as recipient.
  - Router v2 safety relies on quote minOut/deadline + minShares.
- Router v2: `deposit(token, collateralFromSender, flashLoanAmount, minShares, Call[])`.
  - Initial scope: collateral-only from user (keep it simple). Future: add optional input→collateral conversion via Call[] if/when the router supports pulling user input tokens before deposit.

## 2) Module Map (3 layers)
### A) Planner (pure TypeScript)
- Input: token, inputAsset, equityInInputAsset, slippageBps, managerPort, routerPort, quote fns.
- Output Plan: minShares, flashLoanAmount, userCollateralAfterConversion, expected totals, calls[], collateralFromSender.

### B) Ports (tiny, ABI-facing)
- RouterPort
  - preview via `router.previewDeposit`; invoke `deposit` with `Call[]`; `supportsUserConversion=false` in initial scope (set to true only if/when the router can pull user input tokens).
- ManagerPort
  - `idealPreview(token, userCollateral)` → { targetCollateral, idealDebt, idealShares }
  - `finalPreview(token, totalCollateral)` → { previewDebt, previewShares }
  - Impl preference:
    - ideal: `router.previewDeposit` (if available), else `manager.previewMint(token, equity=userCollateral)`.
    - final: `manager.previewDeposit(token, totalCollateral)` if available; else use `manager.previewMint(token, equity=totalCollateral)` as an approximation (no binary search in initial scope).

### C) Orchestrator
- Call planner once.
- Ensure allowance (collateral asset).
- Map plan → router invoke shape.

## 3) Core Types (sketch)
```ts
// Planner result
type Plan = {
  // Token's collateral ERC-20 address (from manager)
  collateralAsset: Address
  // Token's debt ERC-20 address (from manager)
  debtAsset: Address
  // Amount of collateral contributed by the user after any input->collateral conversion
  userCollateralAfterConversion: bigint
  // Total collateral used in deposit = userCollateralAfterConversion + debtSwapOut
  expectedTotalCollateral: bigint
  // Debt the manager will borrow given the total collateral (used to repay flash loan)
  expectedDebt: bigint
  // Shares expected to mint given the total collateral
  expectedShares: bigint
  // Flash-loan principal (debt asset) sized for the final quote (scaled if underfill)
  flashLoanAmount: bigint
  // User-protective floor on shares minted (slippageBps applied)
  minShares: bigint
  // Encoded calls (approve + swap) executed by router; excludes user conversion in initial scope
  calls?: Array<{ target: Address; data: Hex; value?: bigint }>
  // Collateral the router pulls from the user for deposit
  collateralFromSender: bigint
}

// Ports
interface ManagerPort {
  idealPreview(token: Address, userCollateral: bigint):
    Promise<{ targetCollateral: bigint; idealDebt: bigint; idealShares: bigint }>
  finalPreview(token: Address, totalCollateral: bigint):
    Promise<{ previewDebt: bigint; previewShares: bigint }>
}

interface RouterPort {
  supportsUserConversion: boolean
  previewDeposit(token: Address, userCollateral: bigint):
    Promise<{ debt: bigint; collateral: bigint; shares: bigint }>
  invokeMint(args: {
    token: Address
    collateralFromSender: bigint
    flashLoanAmount: bigint
    minShares: bigint
    calls: Array<{ target: Address; data: Hex; value?: bigint }>
  }): Promise<Hash>
}
```


## 4) Planner Algorithm
Inputs: `token, inputAsset, equityInInputAsset, slippageBps, managerPort, routerPort, quoteDebtToCollateral`
Note: `inputAsset` must equal `collateralAsset` in initial scope (no user conversion); `quoteInputToCollateral` is out-of-scope for now.

Steps:
1) User conversion
- Initial scope: not supported. Require `inputAsset === collateralAsset`; otherwise throw before planning.
- Set `userCollateralAfterConversion = equityInInputAsset` and `collateralFromSender = equityInInputAsset`.

2) Ideal targeting:
- `ideal = routerPort.previewDeposit(token, userCollateralAfterConversion)` → `idealDebt`, `targetCollateral`, `idealShares`.

3) Underfill check & scale (debt→collateral):
- `neededFromSwap = targetCollateral - userCollateralAfterConversion`.
- Quote `debt→collateral` with `amountIn = idealDebt` → `quotedOut`.
- If `quotedOut < neededFromSwap`:
  - `flashLoan' = floor(idealDebt * quotedOut / neededFromSwap)`.
  - Re-quote with `amountIn = flashLoan'` → `quotedOut'`.
- Else: `flashLoan' = idealDebt`, `quotedOut' = quotedOut`.

4) Final preview (repayability / shares):
- `totalCollateral = userCollateralAfterConversion + quotedOut'`.
- `final = managerPort.finalPreview(token, totalCollateral)`.
- Guard: `final.previewDebt ≥ flashLoan'`.
- `minShares = floor(final.previewShares * (1 − slippageBps/10_000))`.

5) Assemble outputs:
- `calls = [ approve(debt→agg), swap(debt→collateral) ]` (no user conversion yet); `collateralFromSender = userCollateralAfterConversion` (which equals the user's input if already collateral).

Return: `Plan`.

## 5) ManagerPort Implementation
- idealPreview:
  - Prefer `router.previewDeposit(token, userCollateral)` (v2), else `manager.previewMint(token, equity=userCollateral)`.
- finalPreview:
  - Prefer `manager.previewDeposit(token, totalCollateral)`.
  - Else use `manager.previewMint(token, equity=totalCollateral)` as an approximation (no binary search in initial scope).

## 6) Router Port
- Preview: `router.previewDeposit(token, userCollateral)`.
- Invoke: `router.deposit(token, collateralFromSender, flashLoanAmount, minShares, calls[])`.
- Initial scope: collateral-only from user; do not include input-conversion calls yet.

## 7) Orchestrator
- Ensure allowance: collateral asset to router (initial scope). No Permit2.
- Invoke the router port with mapped args from the Plan.

## 8) Quote Adapters (interfaces)
```ts
// Quote adapters may hit an aggregator (LiFi) or an on-chain router (e.g., Uniswap V2/Aerodrome).
// Implementations must always return minOut semantics and calldata executable by the router.
export type Quote = { out: bigint; minOut?: bigint; deadline?: bigint; approvalTarget: Address; calldata: Hex }
export type QuoteFn = (args: { inToken: Address; outToken: Address; amountIn: bigint }) => Promise<Quote>
```

## 9) Guards & Errors
- Repayability: throw before simulate if `final.previewDebt < flashLoan'`.
- Share floor: compute `minShares` with floor.
- Swap safety: reject quotes without `minOut + deadline` semantics.
- If `inputAsset !== collateralAsset` → fail early (collateral-only).

## 10) Telemetry
- `router_version: 'v2'`
- `quote_source: 'lifi' | 'uniswap_v2' | 'onchain'`
- `quote_latency_ms`, `min_out`, `deadline`
- `flash_loan_scaled: boolean`, `scale_ratio = flashLoan'/idealDebt`
- `excess_debt_returned`, `excess_debt_returned_bps`
- `preview_delta_shares`, `preview_delta_debt`
- `reprice_rate` (planner rejections), `mint_success_rate`

## 11) Tests
### Unit (planner)
- Underfill → scaled flash loan (floor) math.
- Exact/overfill → no scaling.
- call ordering: debt approve+swap only (no user conversion).
- Planner: throws if input ≠ collateral.
- Guard: throws if `previewDebt < flashLoan'`.
- Determinism: same inputs → same plan.

### Integration (fork/Tenderly)
- Router v2 (VNet), input=collateral: success; shares ≥ minShares; tiny excess debt returned. Default quote adapter uses on-chain Uniswap V2 pricing for determinism; LiFi path remains available via env override.
- Router v2 (VNet), input≠collateral: out-of-scope for initial delivery (to be added behind a flag once supported).

### E2E (Playwright)
- Happy path; “price moved → reprice” surface; chain switch on write; allowance prompting logic.

## 12) Tasks (T1–T9)
- T1 ManagerPort: idealPreview + finalPreview (approximation; no binary search).
- T2 RouterPort: preview + deposit (Call[]), no user conversion in initial scope.
- T3 Planner: implement steps 1–5; return Plan; quote interfaces.
- T4 Orchestrator: map Plan to invoke.
- T6 Allowance: robust `ensureAllowance` (supports optional approve(0) then max path).
- T7 Unit tests: planner math, guards, order.
- T8 Integration/E2E: fork + UI happy paths and reprice UX.
- T9 Telemetry: add logs/metrics (flash_loan_scaled, excess_debt, etc.).

## 13) Acceptance Criteria
- Router v2 (VNet): mint in one tx with collateral-only input; underfill scaling works; shares ≥ minShares; dust-level excess debt returned.
- Router v2 user-conversion: only if router supports pulling user input; otherwise excluded.
- Planner enforces guardrails and re-quotes when scaling amountIn.
- All swaps enforce `minOut + deadline`.
- Unit + fork tests green; E2E happy path green.

## 14) Risks & Mitigations
- Quote drift / inclusion risk → simulate exact calldata; reprice on drift; tight minOut/deadlines.
- ABI churn → ports isolate change; planner unchanged.
- Decimals/rounding → floor user-protective; tolerate +1 wei debt rounding.
- Arbitrary Call[] risk → consider router allow-listing targets/selectors (contract-side).

## 15) Configuration & Environments
- Router v2 (Tenderly VNet): provide router/manager addresses via env/config.
- Base mainnet: use addresses from `src/lib/contracts/addresses.ts`.

## 16) Open Items
- Future: add optional user conversion (e.g., WETH→weETH) via Call[] if router supports pulling user tokens.
- VNet addresses are provided below; keep the canonical address map updated so tests pick them up automatically.

## 17) Tenderly VNet Addresses
- LeverageToken implementation: `0xfFEF572c179AC02F6285B0da7CB27176A725a8A1`
- LeverageToken factory: `0xA6737ca46336A7714E311597c6C07A18A3aFdCB8`
- LeverageManager: `0x959c574EC9A40b64245A3cF89b150Dc278e9E55C`
- LendingAdapter implementation: `0x561D3Fa598AFa651b4133Dc01874C8FfEbBD4817`
- LendingAdapterFactory: `0x04f20d88254Dc375A7eF5D9bC6Cf4AAE65C18583`
- MulticallExecutor: `0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd`
- VeloraAdaptor: `0x1162c0c4491f143ab4142e4c3d349bcb8df77b96`
- LeverageRouter: `0xfd46483b299197c616671b7df295ca5186c805c2`
- RebalanceAdapter: `0x85416Da07e256d7c058938aDb9D13d7F3d3eCAc3`
- LendingAdapter proxy: `0xbA63aC9B956EF23F8788dE4EdD4c264b5dF35fA0`
- LeverageToken (WEETH-WETH 17x): `0x17533ef332083aD03417DEe7BC058D10e18b22c5`

Test harness auto-detects the active chain and consumes these addresses from `src/lib/contracts/addresses.ts`. Keep that map in sync with the latest VNet/Base deployments rather than relying on ad-hoc environment overrides.

## Implementation Notes (current state)
- Planner scope: Implemented for router v2 with collateral-only input (no input→collateral conversion yet). Underfill scaling, repayability via manager preview, and minShares guard are in place. Debt-leg calls (approve+swap) are encoded for the router.
- Allowances: UI hooks handle approvals; a domain helper `ensureAllowance` exists and supports approve(0)→approve(max) when needed.
- Quote constraints: The LiFi adapter returns out/minOut and calldata. Deadline validation is not currently enforced.
- Tests: Unit tests cover planner math/guards and ports. Integration tests validate router v2 happy path on Tenderly VNet.
