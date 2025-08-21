# Handoff 1 — 2025-08-20

Owner: MM (Marco Mariscal)

## Scope
- Deterministic Base-fork testing for mint path.
- Test-mode wiring with wagmi `mock` connector.
- Integration test infra on Anvil; unit test stabilization.

## What Landed In This PR
- Test-only wagmi config (`src/lib/config/wagmi.config.test.ts`) using `mock` connector, HTTP to Anvil.
- App switches to test config when `VITE_TEST_MODE=mock` (`src/main.tsx`).
- Header renders `Connect (Mock)` button when in test mode (`src/components/ConnectButtonTest.tsx`, gated in `src/components/header.tsx`).
- Unit test bootstrap fix: added `leverageRouterAbi` to mocked exports in `tests/setup.ts` to prevent Vitest import failure.
- **MintForm testability improvements**:
  - Added `data-testid` attributes for E2E testing (amount input, submit button, tx hash, expected shares)
  - Implemented safe decimal parsing (string → wei) to avoid float→bigint precision issues
- **CI build fixes**:
  - Fixed TypeScript errors in MintForm error handling
  - Fixed environment variable access using bracket notation (strict mode)
  - Fixed wagmi config type mismatch between test and production configs
  - Added explicit parameter types in test mocks
- **Vercel deployment fix**: Removed platform-specific Biome dependencies causing Linux deployment failures
- No E2E infra changes yet; CI workflows remain as-is.

## Current Status ✅ COMPLETE
- **Lint/Typecheck**: ✅ PASSING (all TypeScript errors resolved)
- **Unit tests**: ✅ PASSING (ABI mock fix implemented)
- **Integration tests**: ✅ IMPLEMENTED and runnable locally with Anvil (not executed in CI yet)
- **E2E tests**: ✅ PASSING (existing navigation/specs run against RainbowKit; no Anvil bootstrap in CI yet)
- **CI Build**: ✅ PASSING (TypeScript errors fixed)
- **Vercel Deployment**: ✅ FIXED (platform dependency issues resolved)

## What's Left ✅ COMPLETED
- ~~MintForm testability polish~~: ✅ **COMPLETED**
  - ✅ Added `data-testid` for amount, submit, expected/min shares, tx hash
  - ✅ Safe decimal parsing (string → wei) to avoid float→bigint issues
- Optional: Version pins for stability (wagmi 2.16.4, viem 2.34.0, rainbowkit 2.2.8, Playwright 1.55.0) - **DEFERRED** (current versions working well)

## Next PR — E2E Anvil + Mint Happy Path
- Playwright global setup to start Anvil if not up (`tests/e2e/global-setup.ts`).
- Update `playwright.config.ts`:
  - `globalSetup` reference.
  - `webServer.command` with `VITE_TEST_MODE=mock VITE_ANVIL_RPC_URL=http://127.0.0.1:8545`.
- Add mint E2E spec (`tests/e2e/mint-flow.spec.ts`): connect mock → input 1 → mint → assert expected/min shares and tx hash.
- CI `test-e2e` job:
  - Install Foundry (`foundry-rs/foundry-toolchain@v1`).
  - Provide `ANVIL_BASE_FORK_URL` secret/variable.

## How To Run Locally
1) Start Base fork:
   - `ANVIL_BASE_FORK_URL=<your_rpc> bun run anvil:base`
2) Integration tests:
   - `bun run test:integration` (uses `tests/integration/.env`).
3) E2E (current nav tests):
   - `bun run test:e2e` (no Anvil dependency yet).

## Risks & Notes
- Swap path realism: keep `maxSwapCost` generous for tests to avoid flaky liquidity.
- Token decimals: adjust amounts if moving to 6-decimals collateral.
- Address drift: contract addresses come from `tests/integration/.env`; keep them updated.

## Acceptance Criteria ✅ ALL MET
- ✅ Unit tests green
- ✅ Lint/Typecheck green
- ✅ Integration tests runnable locally against Anvil
- ✅ CI build passes
- ✅ Vercel deployment succeeds
- ✅ MintForm ready for E2E testing with data-testids

## PR Status
**READY FOR REVIEW** - All scope completed, CI passing, deployment fixed. Safe to branch off for next PR.

