# Redeem Follow-Up Tasks

## 1. Multi-asset Output Handling
- Drive the redeem modal off the selected output asset (collateral by default, WETH or others when toggled).
- Add a second `useTokenBalance` lookup for the debt asset so we can refetch that balance on success.
- Extend the planner result surfaced to the UI with both collateral and alternate-asset payouts so the “You will receive” line reflects the chosen asset.

## 2. Secondary Output Amount Calculation
- When the user redeem-to-WETH, compute the amount from the v2 plan swap output (`plan.calls`) and expose it in the summary and confirm steps.
- Display a breakdown (gross collateral, debt repaid, net payout) so the UI explains the delta between preview and actual.

## 3. Position Metrics
- Populate “Total Earned” and “Originally Minted” in the position card using leverage token state + historical mint cost.
- Consider persisting mint totals per wallet (subgraph or local storage) to calculate earnings accurately.

## 4. Allowance Strategy
- Audit `useTokenApprove` to ensure we approve only the redeem amount (no unlimited approvals).
- If necessary, switch to precise allowances and add optional revoke UX later.

## 5. Balance & Query Hygiene
- After redeem success: refetch both the leverage token and output token balances; invalidate any dependent React Query caches (position, USD valuations).
- Keep the DEV diagnostics logging net/gross/debt for quick verification.

## Testing
- Add unit tests for `useRedeemPlanPreview` and integration coverage for alternate output assets once wired.
