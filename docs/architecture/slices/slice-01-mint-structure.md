# Slice 1 – Mint-with-Router structure only

Goal
- Introduce a viem-first domain module for Router.mint with a stable API shape.
- Add a thin React hook wrapper (exported, not used) to set up the future integration point.
- Establish a shared test harness namespace for future unit/integration/E2E work.
- Make zero user-facing changes and avoid any network access.

Non-goals
- No UI wiring or removal of legacy hooks.
- No networked tests (no Anvil/Tenderly) and no contract calls.

What’s included
- Domain: src/domain/mint-with-router/{types, previewMint, allowance, mintWithRouter, index, swapContext}
  - All implementations are placeholders that compile and are safe by default.
- Hook: src/features/leverage-tokens/hooks/useMintWithRouter.ts (not imported by UI)
- Tests: tests/shared/{env, clients} (placeholders) and a minimal unit test validating API surface.

Follow-up slices (high-level)
- Slice 2 – Integration harness
  - Add tests/shared/{funding, withFork} and gate Anvil/Tenderly integration tests behind env.
  - Wire wagmi/viem clients to a single source of truth for read/write.
- Slice 3 – E2E/CI alignment
  - Align Playwright to the shared harness; gate Tenderly VNet in CI via secrets.
- Slice 4 – UI migration
  - Update the mint form to use useMintWithRouter; remove/shim legacy hook; expand unit tests.

Acceptance for Slice 1
- Typecheck and lint pass.
- Unit tests run and only validate exported shapes.
- No changes to runtime behavior.
