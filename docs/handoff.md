Title: Frontend Handoff — LiFi + New Mainnet wstETH/WETH Token Tests

Scope
- Summarizes recent changes to enable E2E + integration testing for the new mainnet wstETH/WETH 2x leverage token, LiFi API usage, and CI setup.
- Intended for engineers taking over day-to-day development and CI operations.

Key Outcomes
- LiFi adapter sends the correct header and reads env safely.
  - File: src/domain/shared/adapters/lifi.ts
  - Header used: x-lifi-api-key
  - Browser env: import.meta.env['VITE_LIFI_API_KEY'] (preferred)
  - Node/test env fallback via safe globalThis check; no secrets are bundled to prod.
- New focused integration script for mainnet wstETH/WETH redeem on static Tenderly VNet.
  - Script: package.json: test:integration:wsteth
- Two new E2E specs for the token.
  - tests/e2e/mainnet-wsteth-mint.spec.ts
  - tests/e2e/mainnet-wsteth-redeem.spec.ts
- CI updated to run only the focused mainnet integration test and to forward LiFi key for CI/dev.
  - Workflow: .github/workflows/ci.yml

Why this setup
- Production cannot ship a LiFi key in the client bundle; LiFi will enforce IP-based limits in prod.
- CI/dev use a LiFi key to avoid 429s for quote/mint steps.
- Integration suite is narrowed to what matters for the new token to reduce flakiness and cycle time.

How to run locally
1) E2E (JIT Tenderly + LiFi)
   - Set env (CI/dev only):
     - VITE_LIFI_API_KEY=<key>
     - VITE_LIFI_INTEGRATOR=seamless-protocol
   - Command:
     - TEST_CHAIN=mainnet bun run test:e2e

2) Focused Integration (Static Tenderly VNet + LiFi for mint)
   - Required env (CI/dev):
     - TENDERLY_ACCOUNT, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY
     - VITE_LIFI_API_KEY (recommended), VITE_LIFI_INTEGRATOR=seamless-protocol
   - Command:
     - bun run test:integration:wsteth

3) Base E2E (no LiFi, deterministic on-chain)
   - Command:
     - bun run test:e2e -- --grep "Base"  (or run the default E2E suite)

LiFi usage notes
- Production: do not set VITE_LIFI_API_KEY. The adapter will not send a key; LiFi applies IP-based quota.
- CI/dev: set VITE_LIFI_API_KEY and VITE_LIFI_INTEGRATOR to reduce rate limits and add analytics slug.
- Quick debug in browser DevTools:
  - Request headers contain x-lifi-api-key when a key is configured.
  - Query contains allowBridges=none and, if provided, integrator.

CI configuration
- Workflow: .github/workflows/ci.yml
  - E2E job now forwards VITE_LIFI_API_KEY and VITE_LIFI_INTEGRATOR.
  - Integration job runs only the focused mainnet wstETH/WETH redeem spec via test:integration:wsteth.
  - Secrets to configure in repo:
    - TENDERLY_ACCOUNT, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY, TENDERLY_TOKEN (optional)
    - VITE_LIFI_API_KEY

Files added/changed (staged)
- .env.example — documents VITE_LIFI_API_KEY, VITE_LIFI_INTEGRATOR, VITE_LIFI_DEBUG.
- playwright.config.ts — forwards LiFi env to the Vite dev server used by E2E.
- src/domain/shared/adapters/lifi.ts — header fix + robust env reading.
- tests/e2e/mainnet-wsteth-mint.spec.ts — new E2E mint spec.
- tests/e2e/mainnet-wsteth-redeem.spec.ts — new E2E redeem spec.
- tests/integration/README.md — “Focused Run” instructions for mainnet token.
- package.json — adds test:integration:wsteth script.
- .github/workflows/ci.yml — integration job now uses test:integration:wsteth and forwards LiFi env.

Operational checklist
- CI: add secrets for Tenderly and VITE_LIFI_API_KEY.
- Local dev: add VITE_LIFI_API_KEY/VITE_LIFI_INTEGRATOR to .env.local for testing; do not add to prod.
- If LiFi 429s in dev/E2E: verify key is present in request headers; enable VITE_LIFI_DEBUG=1 to log hasApiKey.
- If static VNet flakiness appears: prefer focused runs; static VNets don’t guarantee snapshot isolation across suites.

Deferred/Out of scope
- Broad integration suite re-enable; can revisit after LiFi limits and Tenderly behavior stabilize.
- Widget-specific LiFi key pass-through (current app fetches include the key when set; widget is optional).

Contact & Next steps
- If you need more routes covered for the new token, we can add focused specs similarly.
- For prod readiness, review LiFi IP-rate policy with the aggregator team and adjust UI copy/UX if needed on 429.
