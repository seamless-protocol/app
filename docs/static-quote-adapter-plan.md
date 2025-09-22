# Static Quote Adapter Plan

## Current Status
- **Adapter module**: `tests/shared/adapters/staticQuote.ts` instantiates a deterministic `QuoteFn` from either a normalized snapshot or a raw LiFi `/v1/quote` response.
- **Unit coverage**: `tests/unit/shared/adapters/staticQuote.spec.ts` verifies success paths and drift detection for token/amount mismatches.
- **Integration hooks**:
  - `tests/shared/mintHelpers.ts` honours `TEST_QUOTE_ADAPTER=static` and loads fixtures via `TEST_STATIC_DEBT_TO_COLLATERAL_PATH` (or the shared fallback `TEST_STATIC_QUOTE_PATH`).
  - `tests/integration/leverage-tokens/redeem/router.v2.redeem.spec.ts` mirrors the switch with `TEST_STATIC_COLLATERAL_TO_DEBT_PATH` (or the shared fallback).
- **Env surface** (case-insensitive values):
  - `TEST_QUOTE_ADAPTER`: `static` \| `lifi` \| `uniswapv3` \| `uniswapv2` (defaults to LiFi → V3 → V2).
  - `TEST_STATIC_DEBT_TO_COLLATERAL_PATH`: path to captured LiFi mint quote JSON.
  - `TEST_STATIC_COLLATERAL_TO_DEBT_PATH`: path to captured LiFi redeem quote JSON.
  - `TEST_STATIC_QUOTE_PATH`: optional shared fallback for both directions.
  - `TEST_STATIC_QUOTE_SELECTOR`: optional JSON key when storing multiple snapshots in one file.
  - `TEST_SLIPPAGE_BPS`, `TEST_EQUITY_AMOUNT`: continue to size planner inputs; must match the captured fixture.

## How To Use The Static Adapter
1. Capture a LiFi quote with the same parameters that the planner emits (debt size, slippage BPS, executor address, allowed bridges). Save the raw JSON response.
2. Write the fixture to disk and configure the env vars, e.g.:
   ```bash
   export TEST_QUOTE_ADAPTER=static
   export TEST_STATIC_DEBT_TO_COLLATERAL_PATH=tests/fixtures/static/weeth-weth-mint.json
   export TEST_STATIC_COLLATERAL_TO_DEBT_PATH=tests/fixtures/static/weeth-weth-redeem.json
   export TEST_SLIPPAGE_BPS=50
   export TEST_EQUITY_AMOUNT=0.1
   ```
3. Run the Tenderly-backed integration spec (`bun test tests/integration/leverage-tokens/redeem/router.v2.redeem.spec.ts`) or the shared mint helper; both will replay the captured calldata against Leverage Router V2.
4. If the planner drifts (e.g., previewMint produces a different `amountIn`), the adapter throws with a descriptive error so the fixture can be refreshed.

## Remaining Work
- **Fixture tooling**: add a scripted capture flow (e.g., `scripts/captureStaticSwap.ts`) that:
  - pins the Tenderly block via env
  - runs `planMintV2` / `planRedeemV2` with `TEST_USE_LIFI=1`
  - persists normalized snapshots for both directions under `tests/fixtures/static/`
- **Documentation sync**:
  - Extend `tests/integration/README.md` with capture instructions, required env, and troubleshooting tips.
  - Mirror the env variable descriptions in `.env.example` / `tests/integration/.env` (ensure `AGENTS.md` ↔ `CLAUDE.md` stay in lockstep).
- **Router execution options**: decide whether to keep simulation disabled for static fixtures (`TEST_SKIP_SIMULATE=1`) or to seed the flash debt on Tenderly so the simulated call succeeds without the live quote.
- **Exact-out support** (future): if redeem flows adopt exact-out semantics, extend `createStaticQuoteAdapter` to validate/request `intent === 'exactOut'` snapshots.

## Notes & Tips
- The adapter warns if the recorded approval target differs from the calldata target; today LiFi uses the same address, but the log surfaces any regressions.
- When multiple fixtures live in a single JSON blob, use `TEST_STATIC_QUOTE_SELECTOR` to pick the correct entry without copying files.
- Leave `TEST_QUOTE_ADAPTER=lifi` available for live smoke tests—the static path is for deterministic CI only.
