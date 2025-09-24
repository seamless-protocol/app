# Redeem Multi-Asset Output Plan

Owner: Shared  
Issue: https://github.com/seamless-protocol/app/issues/150

## Ownership Legend
- **[Codex]** Tasks assigned to Codex (AI agent)
- **[Teammate]** Tasks assigned to the partner engineer (TBD)

## Objectives
- Allow leverage-token redemptions to return either the collateral asset (e.g. weETH) or the paired debt token (e.g. WETH) through the existing Router V2 flow.
- Ensure the UI reflects the selected output asset across the modal, success states, and toast messaging.
- Maintain deterministic swap sizing and slippage guarantees while adding the extra conversion step needed for alternate outputs.
- Extend automated coverage (domain + integration) to catch regressions for both collateral and debt payout paths, including the mainnet Tenderly harness token.

## Workstreams & Tasks

### 1. Planner & Domain Logic
- [x] **[Codex]** Thread an `outputAsset` parameter from the modal selection into `useRedeemPlanPreview`, `useRedeemExecution`, `useRedeemWithRouter`, and `orchestrateRedeem`.
- [x] **[Codex]** Update `planRedeemV2` to: 
  - compute both post-repayment collateral and optional debt payout amounts,
  - append a final swap call that converts residual collateral into the selected output token when the choice is the debt asset,
  - expose both collateral and alternate amounts on the returned plan.
- [x] **[Codex]** Revisit the `minCollateralForSender` guard so redeeming into debt does not fail the collateral slippage check (e.g. allow near-zero collateral when the user selects debt, or add a dedicated min-out floor for the chosen asset).
- [x] **[Codex]** Extend `logRedeemDiagnostics` to emit the selected output asset and both payout predictions.
- Open question: Can we safely set `minCollateralForSender` to zero for debt payouts, or do we need an on-chain change to enforce slippage in terms of the selected asset?

### 2. Execution Layer
- [x] **[Codex]** Ensure the extra swap call uses the correct recipient (router vs executor vs sender) so the router’s post-sweep transfers deliver the requested asset to the user.
- [x] **[Codex]** Propagate the new plan fields through `executeRedeemV2` to keep transaction calldata aligned with the planner output.
- [x] **[Codex]** Confirm quote adapters (`createCollateralToDebtQuote`) can size the additional swap; add support if a second quote or adapter config is required.

### 3. UI & UX
- [ ] **[Teammate]** Track balances for both collateral and debt tokens in `LeverageTokenRedeemModal` and refresh the one that matches the selected output after success.
- [ ] **[Teammate]** Update the Input, Confirm, Pending, Success, and toast messaging to display the correct token symbol, decimals, and amounts returned from the plan.
- [ ] **[Teammate]** Disable the alternate option gracefully if Router V2 infrastructure (swap config, executor, etc.) is unavailable.
- [ ] **[Teammate]** Consider surfacing estimated USD value for the selected asset if pricing data exists.

- [x] **[Codex]** Add planner-level unit tests covering collateral and debt payout scenarios, including edge cases where residual collateral is near zero.
- [x] **[Codex]** Create a new integration spec that mints and redeems the production (mainnet-deployed) Tenderly leverage token and redeems into the alternate asset.
- [ ] **[Teammate]** Update existing V2 redeem UI assertions (e.g., component tests or storybook docs) if any wording changes are required.
- [ ] **[Codex & Teammate]** Run `bun check:fix`, targeted unit tests, and V2 integration suites before opening PRs.

### 5. Documentation & DX
- [ ] **[Codex]** Update `AGENTS.md` / `CLAUDE.md` if the workflow expectations change (e.g. default tests to run).
- [ ] **[Codex]** Capture any Tenderly contract address overrides needed for the new integration test in `tests/shared/tenderly-addresses.json`.
- [ ] **[Teammate]** Add DEV troubleshooting notes (e.g. how to inspect the multicall sequence) to `@docs/redeem-followup.md` if helpful.

## Milestones / Sequencing
1. Domain + execution plumbing (Workstreams 1 & 2) – unblock plan preview data.
2. UI wiring + diagnostics (Workstream 3) – leverage new plan outputs.
3. Automated testing + docs (Workstreams 4 & 5).

## Risks & Open Questions
- Slippage guard expectations when the user requests debt output (see Workstream 1 note).
- Need for additional allowances when the final swap targets the debt token (verify router/executor approvals).
- Quote adapter coverage for the extra swap; LiFi vs Uniswap path selection may need updates.

## Next Steps
- Assign owners per workstream and break down into PR-sized chunks (domain changes first, then UI/testing).
- Use this doc as the shared checklist; update with findings or decisions during implementation.
