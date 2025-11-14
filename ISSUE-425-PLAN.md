# Issue #425: Simplify Testing Setup & Consolidate Configuration

**Status**: In Progress
**Branch**: `feat/issue-425-consolidate-testing-config`
**Assignee**: TBD
**Estimated Effort**: 2-3 hours

## Problem Statement

The current testing infrastructure has become unnecessarily complicated due to:
1. **Broken `anvil:mainnet` script** - Fails without `VITE_ALCHEMY_API_KEY` but variable marked as optional
2. **Inconsistent defaults** - Code defaults to Tenderly JIT, docs say Anvil is default
3. **Fragmented configuration** - `VITE_INCLUDE_TEST_TOKENS` defined in 4+ places with different logic
4. **Documentation gaps** - Missing/incorrect environment variable documentation
5. **CI vs Local mismatch** - Different configurations between GitHub Actions and local development

## Research Findings

### Current Issues Identified

1. **`anvil:mainnet` Script (package.json:22)**
   - Uses `${VITE_ALCHEMY_API_KEY}` but variable marked optional in `.env.example`
   - Would fail for new developers trying to run tests

2. **Backend Default Confusion**
   - `tests/shared/backend.ts:59` - Defaults to `'tenderly-jit'`
   - CLAUDE.md claims Anvil is the default
   - Package.json scripts use `--backend=anvil` explicitly

3. **VITE_INCLUDE_TEST_TOKENS Scattered Logic**
   - `scripts/run-tests.ts:486-491` - Auto-enables for Tenderly
   - `playwright.config.ts:15-16` - Derives from E2E_TOKEN_SOURCE
   - `tests/integration/.env.example:23` - Hardcoded true
   - `.github/workflows/ci.yml:93,144` - Hardcoded true

4. **Documentation Errors**
   - `tests/integration/README.md:168` - Uses wrong variable name `ALCHEMY_API_KEY` (should be `VITE_ALCHEMY_API_KEY`)
   - CLAUDE.md doesn't clearly state `VITE_ALCHEMY_API_KEY` is required for testing

5. **Token Source Determination**
   - `tests/shared/scenarios/index.ts` - Has scattered logic for 'prod' vs 'tenderly'
   - Base uses 'tenderly', mainnet uses 'prod' - inconsistent pattern

### Current Production Token Adapters ✅ CORRECT

All production tokens already use LiFi as intended:
- WSTETH-ETH-25x (Ethereum) - LiFi
- RLP-USDC-6.75x (Ethereum) - LiFi
- WEETH-WETH-17x (Base) - LiFi

Test-only tokens correctly use deterministic adapters:
- PT-RLP-4DEC2025-USDC-2x - Pendle
- WEETH-WETH-17x-TENDERLY - UniswapV2
- CBBTC-USDC-2x-TENDERLY - UniswapV3

**No changes needed for adapter selection** - already follows best practices.

## Implementation Plan

### Phase 1: Lock Anvil Default & Fix Env Docs ⚡

1. **Make Anvil the explicit default backend in code**
   - `tests/shared/backend.ts`
     - Set `DEFAULT_MODE: BackendMode = 'anvil'`.
     - Update the comment that currently says "Default to Tenderly JIT" to describe the Anvil‑first default.
   - `scripts/run-tests.ts`
     - Confirm `test:integration` / `test:e2e` paths always pass `--backend=anvil` (happy path).
     - Keep `--backend=tenderly` as an explicit, advanced option that uses JIT VNets.

2. **Fix environment variable documentation**
   - `.env.example`
     - Move `VITE_ALCHEMY_API_KEY` from "optional" into a clearly marked "REQUIRED FOR TESTING (Anvil forks)" section.
     - Document that this single key is used for both Base and Mainnet forks.
   - `tests/integration/README.md`
     - Replace `ALCHEMY_API_KEY` with `VITE_ALCHEMY_API_KEY` in examples.
     - Explain the relationship between root `.env(.local)` and `tests/integration/.env` for integration/E2E.

3. **Update CLAUDE.md & AGENTS.md**
   - Make both documents:
     - Explicitly Anvil‑first (Anvil default, Tenderly advanced).
     - Include a short "Quick Start Testing" section that matches the new `docs/testing-backends.md` profiles.
   - Ensure they remain verbatim copies, as required by project rules.
   - Keep `docs/testing-backends.md` in sync with any backend/env behavior changes introduced in this phase.

### Phase 2: Consolidate Test Defaults (Tokens & Backends) 🔧

4. **Standardize `VITE_INCLUDE_TEST_TOKENS` behavior**
   - Introduce a small helper (e.g. in `tests/shared/env.ts` or a `tests/shared/test-config.ts`) that decides whether to include test‑only tokens:
     - If `VITE_INCLUDE_TEST_TOKENS` is explicitly set → respect it.
     - Else, default to `true` for chain‑aware tests (integration/E2E) to match CI and `tests/integration/.env.example`.
   - Use this helper in:
     - `scripts/run-tests.ts` (`withTestDefaults`) instead of custom heuristics.
     - `playwright.config.ts` instead of recomputing inclusion logic.

5. **Clarify token source and leverage token key selection**
   - Document in `docs/testing-backends.md` (and optionally `CLAUDE.md`/`AGENTS.md`):
     - Testers should use `E2E_LEVERAGE_TOKEN_KEY=<key>` to choose which leverage token a run targets.
     - `E2E_TOKEN_SOURCE` is an advanced override; by default, `tests/shared/scenarios/index.ts` and backend selection decide between `'prod'` and `'tenderly'`.
   - Ensure `tests/fixtures/addresses.ts` is the single source of truth for test‑side leverage token definitions and that it clearly notes which keys are test‑only vs prod‑mirroring.

6. **Document configuration hierarchy**
   - Add or refine an env reference table (either in `CLAUDE.md`/`AGENTS.md` or `docs/testing-backends.md`) covering:
     - `VITE_ALCHEMY_API_KEY`, `VITE_INCLUDE_TEST_TOKENS`,
     - `TEST_CHAIN`, `TEST_MODE`, `TEST_SCENARIO`, `TEST_RPC_URL`, `VITE_TEST_RPC_URL`,
     - `TENDERLY_ACCOUNT`, `TENDERLY_PROJECT`, `TENDERLY_ACCESS_KEY`.
   - Clearly state the precedence:
     1. CLI `--backend` flag.
     2. Presence of `TEST_RPC_URL` (expert override).
     3. Tenderly credentials (when `--backend=auto`).
     4. Final default: Anvil.
   - Update `docs/testing-backends.md` to reflect the final, consolidated defaults so it remains the single authoritative reference.

### Phase 4: CI & Script Cleanliness ✨

7. **Tidy CI workflows**
   - Review `.github/workflows/ci.yml`:
     - Ensure E2E and integration jobs are clearly labeled and reflect the Anvil‑default story.
     - Remove redundant comments or legacy Tenderly‑default wording.
     - Group env vars logically (app env vs testing env).
   - Where possible, reuse the same commands documented in `AGENTS.md`/`CLAUDE.md` (e.g., `bun run test:integration`, `bun run test:e2e`) instead of bespoke one‑offs.

8. **Tidy `package.json` scripts**
   - Make test scripts mirror the documented profiles:
     - `test` / `test:unit` for unit tests.
     - `test:integration` (Anvil default, clearly scoped).
     - `test:e2e` (Anvil default).
     - Optional clearly named Tenderly scripts (e.g. `test:integration:tenderly`) for advanced flows.
   - Remove or rename any legacy / confusing scripts so there is a small, memorable set of “blessed” commands.
   - Update `docs/testing-backends.md` and `AGENTS.md`/`CLAUDE.md` so all examples use this cleaned‑up script set.

### Phase 3: Testing & Validation ✅

#### 3.1 Test the Changes

**Manual Testing Checklist:**
- [ ] Fresh checkout, run `bun install`
- [ ] Set only `VITE_ALCHEMY_API_KEY` in .env
- [ ] Run `bun run anvil:mainnet` - should work
- [ ] Run `bun run test:integration` - should pass
- [ ] Run `bun run test:e2e` - should pass
- [ ] Unset Tenderly credentials, confirm Anvil is default
- [ ] Set Tenderly credentials, use `--backend=tenderly`, confirm it works
- [ ] CI pipeline still passes (no changes to CI config needed)

#### 3.2 Documentation Review

**Final Checks:**
- [ ] CLAUDE.md accurate for all commands
- [ ] AGENTS.md in sync with CLAUDE.md
- [ ] tests/integration/README.md has correct variable names
- [ ] .env.example clearly marks required vs optional
- [ ] Quick start guide works for new developers

## Files to Modify

### Definite Changes
1. `.env.example` - Fix `VITE_ALCHEMY_API_KEY` documentation (required for Anvil forks).
2. `CLAUDE.md` - Update backend/testing instructions and keep in sync with AGENTS.
3. `AGENTS.md` - Same as CLAUDE.
4. `tests/integration/README.md` - Fix variable names and align scripts/layout.
5. `tests/shared/backend.ts` - Change default to Anvil; clarify comments.
6. `tests/shared/env.ts` or `tests/shared/test-config.ts` - Centralize `VITE_INCLUDE_TEST_TOKENS` behavior.
7. `scripts/run-tests.ts` - Use centralized test-token logic; ensure backend precedence matches docs.
8. `playwright.config.ts` - Use centralized test-token logic; rely on `tests/shared/env.ts` for backend/RPC.
9. `docs/testing-backends.md` - Keep in sync with actual behavior as changes land.

## Success Criteria

- [ ] New developer can run tests by only setting `VITE_ALCHEMY_API_KEY` and following the documented Anvil happy path.
- [ ] Default backend is Anvil (fast, no quotas, works offline); Tenderly is opt‑in via `--backend=tenderly`.
- [ ] Documentation (AGENTS, CLAUDE, tests/integration/README.md, docs/testing-backends.md) is consistent and accurate.
- [ ] Test‑specific defaults like `VITE_INCLUDE_TEST_TOKENS` are centralized and predictable for integration/E2E.
- [ ] CI continues to pass unchanged (or with minimal, intentional updates).
- [ ] All integration and E2E tests pass on both Anvil and Tenderly (when configured).

## Non-Goals (Deferred)

- Fixing any actual test failures (separate issues)
- Adding new test coverage (separate issues)
- Changing adapter selection (already correct)
- Major refactoring of test infrastructure

## Timeline

- **Phase 1** (Priority): 1-1.5 hours - Fix broken items
- **Phase 2**: 1 hour - Consolidate configuration
- **Phase 3**: 0.5 hours - Testing & validation
- **Total**: 2.5-3 hours

## Notes

- Keep changes minimal and focused
- Maintain backward compatibility where possible
- CI should require zero changes (just documentation sync)
- This unblocks developers trying to run tests locally
