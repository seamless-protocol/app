Title
Refactor: viem-first mintWithRouter lib + unified tests; remove legacy code

Summary
- Viem-first domain library for Router minting and a thin React hook.
- Unified test harness supporting Tenderly VirtualNet and Anvil forks.
- Removed legacy hooks/helpers; standardized on weETH funding and EtherFi swap context on Base.

Motivation
- Clean separation of concerns: pure business logic vs. React hook vs. UI.
- Environment-agnostic testing with a single configuration surface.
- Fix approval/state issues on Anvil by ensuring a single signer/RPC source of truth across approve + mint.

Changes
- Domain lib: src/domain/mint-with-router
  - types.ts, previewMint.ts, allowance.ts, swapContext.ts (re-export), mintWithRouter.ts, index.ts.
  - mintWithRouter: preview → allowance → simulate → write → wait; special-cases weETH on Base to EtherFi swap context.
- Hook: src/features/leverage-tokens/hooks/useMintWithRouter.ts
  - Thin React Query wrapper around mintWithRouter; handles cache invalidation + logging.
  - src/features/leverage-tokens/components/MintForm.tsx now uses useMintWithRouter.
- Tests: shared harness for both RPCs
  - tests/shared/{env.ts, clients.ts, funding.ts, withFork.ts}.
  - Integration: tests/integration/mint/mintWithRouter.int.test.ts (weETH + Router, end-to-end contract write).
  - Unit: tests/unit/mint/{allowance.unit.test.ts, previewMint.unit.test.ts, mintWithRouter.unit.test.ts, swapContext.unit.test.ts}.
- E2E: Playwright aligned to shared harness
  - tests/e2e/global-setup.ts funds native + weETH via shared funding; starts Anvil only if needed.
  - playwright.config.ts wires VITE_BASE_RPC_URL/VITE_ANVIL_RPC_URL to the selected RPC.
- Cleanup: removed legacy code
  - Deleted useMintViaRouter, integration helpers (setup/utils/helpers/constants), router.mint.test.ts, and old unit tests for the legacy hook.
  - Updated tests/integration/.env.example to use TEST_WEETH (and optional TEST_WEETH_WHALE).

Why this fixes Anvil approval/state issues
- Single signer for approve + mint (walletClient of the connected account).
- Single RPC for reads/writes (shared clients).
- No test-specific logic in app code; tests manage env/funding externally.

Testing
- Integration (Tenderly): PASS
  - Command: TEST_RPC_KIND=tenderly TEST_RPC_URL=<your-tenderly-vnet> bun run test:integration
  - Verified against: https://virtual.base.eu.rpc.tenderly.co/89b3481f-c5bb-4945-bcb6-5ebd7030a8ec
- Integration (Anvil):
  - Terminal A: ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base
  - Terminal B: TEST_RPC_KIND=anvil TEST_RPC_URL=http://127.0.0.1:8545 bun run test:integration
- Unit: bun run test (jsdom suite)
- E2E (UI):
  - Reuses shared env/clients for RPC config and funding; VITE_BASE_RPC_URL is set from tests/shared/env.

How to configure
- tests/integration/.env
  - TEST_RPC_KIND=tenderly|anvil
  - TEST_RPC_URL=<Tenderly VNet URL or http://127.0.0.1:8545>
  - TEST_LEVERAGE_MANAGER, TEST_LEVERAGE_ROUTER, TEST_LEVERAGE_TOKEN_PROXY
  - TEST_WEETH=0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A (default)
  - Optional (Anvil): TEST_WEETH_WHALE

Breaking changes
- Removed useMintViaRouter. Replace imports with useMintWithRouter (already done in this branch).
- Legacy test helpers removed; all tests should use tests/shared harness.

Follow-ups
- Add CI matrix to run integration tests on both Tenderly and Anvil.
- Expand error-path unit tests for mintWithRouter (sim/write reverts, insufficient balance).
- Optionally add a Redeem flow mirroring this structure.
