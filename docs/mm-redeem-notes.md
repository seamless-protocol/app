# MM Redeem Notes

WIP scratchpad for the redeem integration refactor. Summaries below should expand as the implementation lands.

## Current V2 Redeem Blockers

- **Missing quote injection**
  - `useRedeemExecution` calls `orchestrateRedeem` without `quoteCollateralToDebt`.
  - Router v2 throws immediately when the quote is absent.

- **Collateral swap sizing logic is wrong**
  - `calculateCollateralNeededForDebt` seeds the quote with the debt amount and falls back to `(debt^2)/quote.out`.
  - Needs to quote collateral→debt and solve `ceil(debtToRepay * collateralQuoted / debtOut)` instead.

- **Swap calldata is incomplete**
  - `buildCollateralToDebtSwapCalls` emits only a single aggregator call; no approvals or native wrap/unwrap.
  - Compare with `buildDebtSwapCalls` in the mint planner.

## Follow-ups / Future Notes

- [ ] Pass `quoteDebtToCollateral` through `useMintExecution` so mint v2 can actually run.
- [ ] Once fixes land, expand the Tenderly spec suite (mint + redeem) and add env docs.

## Tenderly Redeem Spec (router.v2.redeem.spec.ts)

1. Discover collateral/debt assets from the manager.
2. Fund & approve, then mint via `orchestrateMint` (quote = Uniswap v2 adapter today).
3. Redeem half of the minted shares via `orchestrateRedeem` (LiFi or Uniswap v2).
4. Assert leverage-token balance decreases.
5. **Missing assertions:** leverage-token approval (if required) and collateral balance delta after redeem.

## Findings

- 🔴 **Uniswap v2 fallback unusable** – ~15 weETH → ~0.157 WETH, planner requests 1.47e18 wei collateral and reverts.
- 🔴 **LiFi path reverts** – `ERC20InsufficientAllowance` (0xfb8f41b2); we never approve LiFi’s `approvalTarget`.
- ⚪️ **Swap-call builder** – approvals / unwrap logic still TODO.
- ⚪️ **Mint wiring** – still missing quote pass-through.

## Env Vars (unchanged)

| Variable | Description |
|----------|-------------|
| `VITE_ROUTER_VERSION` | Force router version to v2 |
| `VITE_ROUTER_V2_ADDRESS` | Router v2 address |
| `VITE_MANAGER_V2_ADDRESS` | Manager v2 address |
| `VITE_MULTICALL_EXECUTOR_ADDRESS` | Multicall executor address |

These are pinned in `tests/shared/env` for the Tenderly runs.
