# Uniswap v3 Redeem Fix – Handoff Notes

## Context
- Feature: Redeem flow for weETH/WETH leverage token via V2 router.
- Problem: Uniswap v3 quote + swap kept reverting on Base, forcing `planRedeemV2` into its slot0 fallback and causing redeem orchestration to fail.
- Root cause: Env pointed to the wrong fee tier / pool for the weETH ↔ WETH single-hop pair. `V3_POOL_FEE` was set to `100`, but the live Base pool with liquidity uses fee tier `500` (tick spacing `10`). With the wrong tier, `factory.getPool` returns `address(0)` and both QuoterV2 and SwapRouter revert.

## Current State
- Adapter (`src/domain/shared/adapters/uniswapV3.ts`) is structurally correct: it normalizes ETH → WETH, sets `sqrtPriceLimitX96 = 0`, and encodes `exactOutputSingle` for debt repayment.
- Tokens in env resolve correctly (`ADDR.weeth` / `ADDR.weth`). Planner only unwraps when collateral **is** WETH, so the redeem path stays ERC-20 → ERC-20 once the quote succeeds.

## What Needs To Happen
1. **Verify new in-repo config** (developer + CI):
   - `src/lib/config/uniswapV3.ts` now pins Base defaults (quoter, swap router, weETH/WETH pool `0xB141…de78`, fee `500`, tick spacing `10`).
   - `tests/shared/env.ts` consumes those defaults; env vars remain optional overrides only. Ensure CI runners load the repo config (no extra secrets required).
2. **Re-run smoke checks** once env is fixed:
   - Invoke the Uniswap v3 adapter via a quick REPL or unit harness and ensure the quote returns non-zero `out` with calldata decoding to `exactOutputSingle`.
   - `bun run test:integration --filter "redeem"` now mints using the Uniswap v2 adapter (setup-only) and redeems via Uniswap v3; confirm both legs succeed on Tenderly.
3. **Hardening follow-ups** (recommended):
   - In `createUniswapV3QuoteAdapter`, read `token0/token1` from the provided pool and assert they match normalized inputs. Fail fast with a descriptive error if not (prevents future misconfig).
   - Surface a warning in planner logs if we ever hit the slot0 estimation fallback; it should never trigger once the quote is configured correctly.
   - Document the canonical Base addresses (WETH, QuoterV2, SwapRouter02, fee tier) in `tests/integration/README.md` to keep newcomers aligned.

## Optional Enhancements
- Add a small helper to probe `getPool` for a preferred fee tier list (e.g., try 500 then 3000) and throw if none exist. Keeps env leaner.
- Consider a quick unit test that stubs `PublicClient.readContract` for pool metadata to exercise the new guard logic once added.

## Remaining Questions
- Do we want the planner to attempt a deterministic fallback (mocked price) if quotes fail, or should we continue to hard-error? Current recommendation: fail fast—hard-coding price data risks underpaying debt.
- Need confirmation from product whether we ever plan to support two-hop routes; today we stay single-hop and that assumption is entrenched in planner + adapter APIs.

## Owner + Next Actions
- **Primary engineer tomorrow:** Align env vars, confirm Tenderly run, implement adapter guard.
- **Reviewer:** Verify the integration test, confirm no regressions in mint flow (still uses same adapter), and sign off on docs updates.
