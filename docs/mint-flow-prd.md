# Mint Flow PRD — Single Planner with v1/v2 Router Ports

## 0) Goals
- One brain: preview → quote → (maybe) scale → re-preview → guardrails → execute.
- Small surface: ABI branching only at the ports (router/manager), not in the planner.
- One-tx UX for v2; initial scope is collateral-only for both v1 and v2 (no user conversion). Future: optional user conversion only if the router can pull user input.
- Boring, well-typed, testable; easy to evolve across chains and router versions.

## 1) Constraints & Truths
- Quotes are off-chain (aggregator/DEX payloads). Contracts cannot fetch quotes on-chain.
- Router handles the full flash-loan lifecycle; the client only sizes it and supplies swap calls/context.
- Scale only on underfill; if amountIn changes, re-quote.
- Guardrails must hold before sending:
  - Repayability: `previewDebt ≥ flashLoan'` (prime = scaled loan when underfill).
  - Share floor: `minShares` = floor(previewShares × (1 − slippageBps/10_000)).
  - Swap safety: quotes embed `minOut + deadline` targeting the router as recipient.
  - Cost cap (v1-only): `maxSwapCostInCollateral` (default 2% of user collateral contribution; user-overridable). Not passed to v2; v2 safety relies on quote minOut/deadline + minShares.
- Router v1: `mint(token, equityInCollateralAsset, minShares, maxSwapCost, SwapContext)`; no user conversion.
- Router v2: `deposit(token, collateralFromSender, flashLoanAmount, minShares, Call[])`.
  - Initial scope: collateral-only from user on v2 as well (keep it simple). Future: add optional input→collateral conversion via Call[] if/when the router supports pulling user input tokens before deposit.

## 2) Module Map (3 layers)
### A) Planner (pure TypeScript)
- Input: token, inputAsset, equityInInputAsset, slippageBps, managerPort, routerPort, quote fns.
- Output Plan: minShares, flashLoanAmount, userCollateralAfterConversion, expected totals, calls[] (v2), swapContext (v1), collateralFromSender.

### B) Ports (tiny, ABI-facing)
- RouterPort
  - v1: invoke `mint` with `SwapContext`; `supportsUserConversion=false`.
  - v2: preview via `router.previewDeposit`; invoke `deposit` with `Call[]`; `supportsUserConversion=false` in initial scope (set to true only if/when the router can pull user input tokens).
- ManagerPort
  - `idealPreview(token, userCollateral)` → { targetCollateral, idealDebt, idealShares }
  - `finalPreview(token, totalCollateral)` → { previewDebt, previewShares }
  - Impl preference:
    - ideal: `router.previewDeposit` (if available), else `manager.previewMint(token, equity=userCollateral)`.
    - final: `manager.previewDeposit(token, totalCollateral)` if available; else use `manager.previewMint(token, equity=totalCollateral)` as an approximation (no binary search in initial scope).

### C) Orchestrator
- Detect router version (env override or runtime probe).
- Call planner once.
- Ensure allowance (v2: input asset if conversion supported; v1: collateral asset).
- Map plan → router-specific invoke shape.

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
  // v2
  // Encoded calls (approve + swap) executed by router; excludes user conversion in initial scope
  calls?: Array<{ target: Address; data: Hex; value?: bigint }>
  // Collateral the router pulls from the user for deposit (v2 deposit arg)
  collateralFromSender: bigint // for v2 deposit()
  // v1
  // Adapter-specific context for the v1 router swap leg
  swapContext?: unknown
}

// Ports
interface ManagerPort {
  idealPreview(token: Address, userCollateral: bigint):
    Promise<{ targetCollateral: bigint; idealDebt: bigint; idealShares: bigint }>
  finalPreview(token: Address, totalCollateral: bigint):
    Promise<{ previewDebt: bigint; previewShares: bigint }>
}

interface RouterPort {
  mode: 'v1'|'v2'
  supportsUserConversion: boolean
  previewDeposit(token: Address, userCollateral: bigint):
    Promise<{ debt: bigint; collateral: bigint; shares: bigint }>
  invokeMint(args:
    | { mode:'v2'; token: Address; collateralFromSender: bigint; flashLoanAmount: bigint; minShares: bigint; calls: Array<{ target: Address; data: Hex; value?: bigint }> }
    | { mode:'v1'; token: Address; equityInCollateralAsset: bigint; minShares: bigint; swapContext: unknown; maxSwapCost: bigint }
  ): Promise<Hash>
}
```

Typed v1 SwapContext
```ts
// Prefer using the generated or ABI-inferred type for v1 SwapContext
// Option A: inferred from ABI (viem ContractFunctionArgs)
import type { ContractFunctionArgs } from 'viem'
import { leverageRouterAbi } from '@/lib/contracts/abis/leverageRouter'
export type V1SwapContext = ContractFunctionArgs<typeof leverageRouterAbi, 'nonpayable', 'mint'>[4]

// Option B: reuse existing helper (recommended)
// src/domain/mint/swapContext.ts already declares:
//   export type SwapContext = ContractFunctionArgs<typeof leverageRouterAbi, 'nonpayable', 'mint'>[4]
// In Plan and RouterPort, use that:
import type { SwapContext as V1SwapContextFromHelper } from '@/domain/mint/utils/swapContext'

// Then in Plan/RouterPort types above, replace `unknown` with `V1SwapContext` (or the helper alias):
type Plan = {
  // ...
  swapContext?: V1SwapContextFromHelper
}

interface RouterPort {
  // ...
  invokeMint(args:
    | { mode:'v2'; token: Address; collateralFromSender: bigint; flashLoanAmount: bigint; minShares: bigint; calls: Array<{ target: Address; data: Hex; value?: bigint }> }
    | { mode:'v1'; token: Address; equityInCollateralAsset: bigint; minShares: bigint; swapContext: V1SwapContextFromHelper; maxSwapCost: bigint }
  ): Promise<Hash>
}
```

## 4) Planner Algorithm (single path, used by both routers)
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
- v2 (initial scope): `calls = [ approve(debt→agg), swap(debt→collateral) ]` (no user conversion yet); `collateralFromSender = userCollateralAfterConversion` (which equals the user’s input if already collateral).
- v1: `swapContext = buildSwapContext(collateralAsset, debtAsset, chainId)`.

Return: `Plan`.

## 5) ManagerPort Implementation
- idealPreview:
  - Prefer `router.previewDeposit(token, userCollateral)` (v2), else `manager.previewMint(token, equity=userCollateral)`.
- finalPreview:
  - Prefer `manager.previewDeposit(token, totalCollateral)`.
  - Else use `manager.previewMint(token, equity=totalCollateral)` as an approximation (no binary search in initial scope).

## 6) Router Ports
- v2
  - Preview: `router.previewDeposit(token, userCollateral)`.
  - Invoke: `router.deposit(token, collateralFromSender, flashLoanAmount, minShares, calls[])`.
  - Initial scope: collateral-only from user; do not include input-conversion calls yet.
- v1
  - Preview: delegate to `managerPort.idealPreview`.
  - Invoke: `router.mint(token, equityInCollateralAsset, minShares, maxSwapCost, swapContext)`; collateral-only.

## 7) Orchestrator
- Version selection: `VITE_ROUTER_VERSION=auto|v1|v2` (default `auto`).
  - auto: if v2 addresses provided (VNet), use v2; else v1.
- Ensure allowance:
  - v2: collateral asset to router (initial scope). No Permit2.
  - v1: collateral to router. No Permit2.
- `maxSwapCostInCollateral` (v1-only): default 2% of `userCollateralAfterConversion` (expose override in UI Advanced panel).
- Invoke the selected router port with mapped args from the Plan.

## 8) Quote Adapters (interfaces)
```ts
// LiFi-only initially. Required fields must include minOut + deadline, and recipient must be the router.
export type Quote = { out: bigint; minOut: bigint; deadline: bigint; approvalTarget: Address; calldata: Hex }
export type QuoteFn = (args: { inToken: Address; outToken: Address; amountIn: bigint }) => Promise<Quote>
```

## 9) Guards & Errors
- Repayability: throw before simulate if `final.previewDebt < flashLoan'`.
- Share floor: compute `minShares` with floor.
- Swap safety: reject quotes without `minOut + deadline` semantics.
- Cost cap (v1-only): pass `maxSwapCostInCollateral` to router; default 2%. Not applicable to v2.
- v1: if `inputAsset !== collateralAsset` → fail early (collateral-only).

## 10) Telemetry
- `router_version: 'v1'|'v2'`
- `quote_source: 'LiFi'`
- `quote_latency_ms`, `min_out`, `deadline`
- `flash_loan_scaled: boolean`, `scale_ratio = flashLoan'/idealDebt`
- `excess_debt_returned`, `excess_debt_returned_bps`
- `preview_delta_shares`, `preview_delta_debt`
- `reprice_rate` (planner rejections), `mint_success_rate`

## 11) Tests
### Unit (planner)
- Underfill → scaled flash loan (floor) math.
- Exact/overfill → no scaling.
- v2 call ordering: debt approve+swap only (no user conversion).
- Planner: throws if input ≠ collateral; v1 builds `swapContext` stub.
- Guard: throws if `previewDebt < flashLoan'`.
- Determinism: same inputs → same plan.

### Integration (fork/Tenderly)
- v2 (VNet), input=collateral: success; shares ≥ minShares; tiny excess debt returned.
- v2 (VNet), input≠collateral: out-of-scope for initial delivery (to be added behind a flag once supported).
- v1 (Base), collateral-only: success; non-collateral input → planner rejection.

### E2E (Playwright)
- Happy path; “price moved → reprice” surface; chain switch on write; allowance prompting logic.

## 12) Tasks (T1–T9)
- T1 ManagerPort: idealPreview + finalPreview (approximation; no binary search).
- T2 RouterPort v2: preview + deposit (Call[]), no user conversion in initial scope.
- T3 RouterPort v1: mint with SwapContext; supportsUserConversion=false.
- T4 Planner: implement steps 1–5; return Plan; quote interfaces.
- T5 Orchestrator: version detection; map Plan to invoke; compute default maxSwapCost (v1-only).
- T6 Allowance: robust `ensureAllowance` (supports optional approve(0) then max path).
- T7 Unit tests: planner math, guards, order.
- T8 Integration/E2E: fork + UI happy paths and reprice UX.
- T9 Telemetry: add logs/metrics (flash_loan_scaled, excess_debt, etc.).

## 13) Acceptance Criteria
- V2 (VNet): mint in one tx with collateral-only input; underfill scaling works; shares ≥ minShares; dust-level excess debt returned.
- V2 user-conversion: only if router supports pulling user input; otherwise excluded.
- V1 (Base): mint with collateral-only; non-collateral input rejected pre-tx.
- Planner enforces guardrails and re-quotes when scaling amountIn.
- All swaps enforce `minOut + deadline`.
- Default `maxSwapCost` 2% applied (v1 only); user override available.
- Unit + fork tests green; E2E happy path green.

## 14) Risks & Mitigations
- Quote drift / inclusion risk → simulate exact calldata; reprice on drift; tight minOut/deadlines.
- ABI churn → ports isolate change; planner unchanged.
- Decimals/rounding → floor user-protective; tolerate +1 wei debt rounding.
- Arbitrary Call[] risk (v2) → consider router allow-listing targets/selectors (contract-side).

## 15) Configuration & Environments
- Router selection: `VITE_ROUTER_VERSION=auto|v1|v2` (default `auto`).
- V2 (Tenderly VNet): provide v2 router/manager addresses via env/config; set `VITE_ROUTER_VERSION=v2` in VNet CI.
- Base mainnet: use v1 addresses from `src/lib/contracts/addresses.ts` (no v2 env provided → auto selects v1).

## 16) Open Items
- Future: add optional user conversion (e.g., WETH→weETH) via Call[] if router supports pulling user tokens.
- VNet v2 addresses are provided below and should be injected via env/config.

## 17) Tenderly VNet (v2) Addresses
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

Env injection: expose these via `VITE_ROUTER_V2_ADDRESS`, `VITE_MANAGER_V2_ADDRESS`, and similar keys for CI/Tenderly. Or add a `contractAddresses['vnet']` entry populated at runtime from env.

## Implementation Notes (current state)
- Planner scope: Implemented for v2 with collateral-only input (no input→collateral conversion yet). Underfill scaling, repayability via manager preview, and minShares guard are in place. Debt-leg calls (approve+swap) are encoded for the router.
- v1 path: Uses a simple execute flow with simulate guard; planner is not used for v1 in initial delivery. Collateral-only input enforced.
- Allowances: UI hooks handle approvals; a domain helper `ensureAllowance` exists and supports approve(0)→approve(max) when needed.
- Quote constraints: The LiFi adapter returns out/minOut and calldata. Deadline validation is not currently enforced.
- Tests: Unit tests cover planner math/guards and ports. Integration tests validate v2 happy path on Tenderly VNet.
