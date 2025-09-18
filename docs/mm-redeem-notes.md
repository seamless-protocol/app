# Mint/Morph Redeem Notes

WIP scratchpad for the redeem integration refactor. Summaries below should expand as the implementation lands.

## Current V2 Redeem Blockers

- **Missing quote injection**
  - `useRedeemExecution` (src/features/leverage-tokens/hooks/redeem/useRedeemExecution.ts#L29) calls `orchestrateRedeem` without `quoteCollateralToDebt`.
  - `orchestrateRedeem` throws when router v2 is active, so every v2 redemption fails immediately.
  - Action: wire the quote function (pattern should mirror the mint flow once it’s updated).

- **Collateral swap sizing logic is wrong**
  - `calculateCollateralNeededForDebt` (src/domain/redeem/planner/plan.v2.ts#L171-L194) passes the debt amount as `amountIn` to the quote API, so it asks “if I sell **debt**, how much debt do I get back?”
  - The follow-up formula `(debt^2)/quote.out` is meaningless; the router ends up swapping the wrong amount and can’t clear the loan.
  - Action: mimic the on-chain integration test: quote the debt you get for selling collateral, then compute `collateralNeeded = ceil(debtToRepay * collateralQuoted / debtOut)`. Use that amount for the swap and subtract it from the collateral returned to the user.

- **V2 swap calldata is incomplete**
  - `buildCollateralToDebtSwapCalls` (src/domain/redeem/planner/plan.v2.ts#L196-L236) always sets `value: 0n` and inserts a `WETH.deposit()` call, which mints new WETH instead of repaying the existing loan.
  - Any router call that expects ETH `msg.value` (e.g. ETH→ERC20 swaps) will revert.
  - Action: mirror the mint implementation (`buildDebtSwapCalls` in src/domain/mint/planner/plan.v2.ts#L200-L222): handle native vs ERC-20 flows, propagate the quote’s approval target/calldata/value, and wrap/unwrap at the correct layer (e.g. `withdraw` when the aggregator expects ETH input, `deposit` when it returns ETH but the debt token is WETH).

## Follow-ups / Future Notes

- [ ] Update mint path to provide `quoteDebtToCollateral` as well (same missing wiring today).
- [ ] After fixes, add V2 redeem integration test (Tenderly-backed) alongside the mint happy path.
- [ ] Document required env vars for V2 redeem flow once finalized.
