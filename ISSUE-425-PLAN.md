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

### Phase 1: Fix Broken Testing Infrastructure ⚡ PRIORITY

#### 1.1 Fix Environment Variables Documentation

**File: `.env.example`**
- Move `VITE_ALCHEMY_API_KEY` from "optional" to a clearly marked "REQUIRED FOR TESTING" section
- Add helpful comment explaining it's needed for Anvil mainnet forks
- Add `VITE_INCLUDE_TEST_TOKENS=true` example for testing

**File: `tests/integration/README.md`**
- Line 168: Fix `ALCHEMY_API_KEY` → `VITE_ALCHEMY_API_KEY`
- Add section explaining relationship between root `.env.example` and `tests/integration/.env.example`
- Document all test-specific environment variables

#### 1.2 Change Default Backend to Anvil

**File: `tests/shared/backend.ts`**
- Line 59: Change `const DEFAULT_MODE: BackendMode = 'tenderly-jit'` to `'anvil'`
- Update logic to:
  - Default to Anvil (fast, no quota limits)
  - Allow Tenderly via explicit `--backend=tenderly` flag
  - Provide clear error message when Tenderly requested but credentials missing

**Reasoning**: Makes code match documentation and package.json scripts. Anvil is faster, has no API quotas, and works without external credentials.

#### 1.3 Update CLAUDE.md & AGENTS.md

**Changes Needed:**
- Clarify `VITE_ALCHEMY_API_KEY` is **REQUIRED** for testing (currently says optional)
- Document backend selection hierarchy clearly:
  1. Explicit `--backend` flag wins
  2. Default is Anvil (local, fast, no quotas)
  3. Tenderly available as alternative with credentials
- Add troubleshooting section for common setup issues
- Add "Quick Start Testing" section with minimal steps

**Ensure CLAUDE.md and AGENTS.md stay in sync** - both must have identical content per project rules.

### Phase 2: Consolidate Configuration Defaults 🔧

#### 2.1 Standardize VITE_INCLUDE_TEST_TOKENS Logic

**Create: `tests/shared/test-config.ts`** (new file)
```typescript
export function shouldIncludeTestTokens(backend: BackendMode): boolean {
  // Explicit env var takes precedence
  const explicit = import.meta.env['VITE_INCLUDE_TEST_TOKENS']
  if (explicit !== undefined) {
    return explicit === 'true'
  }

  // Default: true for Tenderly, false for Anvil/production
  return backend === 'tenderly-jit' || backend === 'tenderly-persistent'
}
```

**Update these files to use centralized function:**
- `scripts/run-tests.ts` - Replace lines 486-491
- `playwright.config.ts` - Replace lines 15-16
- Remove duplication, single source of truth

#### 2.2 Centralize Token Source Logic

**File: `tests/shared/scenarios/index.ts`**

Currently has scattered logic determining 'prod' vs 'tenderly':
- Line 21: Base mainnet uses 'tenderly'
- Line 29: Base testnet uses 'tenderly'
- Line 41: Ethereum mainnet uses 'prod'
- Line 50: Ethereum testnet uses 'prod'

**Create helper function:**
```typescript
export function getTokenSource(chainId: number, backend: BackendMode): 'prod' | 'tenderly' {
  if (backend === 'tenderly-jit' || backend === 'tenderly-persistent') {
    return 'tenderly'
  }
  return 'prod'
}
```

Replace scattered conditionals with single function call.

#### 2.3 Document Configuration Hierarchy

**Add to CLAUDE.md:**

Create comprehensive environment variables reference table:

| Variable | Required For | Default | Used By | Purpose |
|----------|-------------|---------|---------|---------|
| `VITE_ALCHEMY_API_KEY` | Testing | - | Anvil fork scripts | Mainnet fork RPC |
| `VITE_INCLUDE_TEST_TOKENS` | Optional | Auto | Token configs | Include test-only tokens |
| `TEST_CHAIN` | Testing | mainnet | Test scripts | Which chain to test |
| `TEST_RPC_URL` | Optional | Auto | Backend selection | Override RPC URL |
| `TENDERLY_ACCOUNT` | Tenderly | - | Tenderly backend | Account slug |
| `TENDERLY_PROJECT` | Tenderly | - | Tenderly backend | Project slug |
| `TENDERLY_ACCESS_KEY` | Tenderly | - | Tenderly backend | API key |

Explain:
- **VITE_** prefix = Available in browser (Vite injects)
- **TEST_** prefix = Backend/Node.js only
- Auto-detection logic for test tokens and backends

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

### Definite Changes (7 files)
1. `.env.example` - Fix VITE_ALCHEMY_API_KEY documentation
2. `CLAUDE.md` - Update testing instructions
3. `AGENTS.md` - Keep in sync with CLAUDE.md
4. `tests/integration/README.md` - Fix variable names
5. `tests/shared/backend.ts` - Change default to Anvil
6. `tests/shared/test-config.ts` - NEW FILE - Centralized test config
7. `tests/shared/scenarios/index.ts` - Use centralized token source logic

### Possible Changes (2 files)
8. `scripts/run-tests.ts` - Use centralized test token logic
9. `playwright.config.ts` - Use centralized test token logic

## Success Criteria

- [ ] New developer can run tests by only setting `VITE_ALCHEMY_API_KEY`
- [ ] Default backend is Anvil (fast, no quotas, works offline)
- [ ] Tenderly available via explicit flag with credentials
- [ ] Documentation accurate and consistent across files
- [ ] Configuration defaults centralized, not scattered
- [ ] CI continues to pass unchanged
- [ ] All integration and E2E tests pass

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
