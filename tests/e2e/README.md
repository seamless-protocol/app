# E2E (Playwright)

- Env source: `tests/shared/env.ts` reads `TEST_RPC_KIND` and `TEST_RPC_URL`.
- Server wiring: `playwright.config.ts` passes that RPC URL into Vite via `VITE_BASE_RPC_URL`/`VITE_ANVIL_RPC_URL`.
- Result: The UI under test talks to the same RPC as integration.

## Run locally

### Against Anvil
1. Start fork in another terminal:
   ```bash
   ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base
   ```
2. Run E2E (default `TEST_RPC_URL` = `http://127.0.0.1:8545`):
   ```bash
   bun run test:e2e
   ```

### Against Tenderly VirtualNet (existing URL)
```bash
TEST_RPC_KIND=tenderly TEST_RPC_URL=https://virtual.base.eu.rpc.tenderly.co/<id> \
  bun run test:e2e
```

### Against an ephemeral Tenderly VirtualNet (create → run → delete)
Use the one-liner that runs both integration + E2E on the same VNet:

```bash
export TENDERLY_ACCESS_KEY=...   # or TENDERLY_TOKEN=...
export TENDERLY_ACCOUNT=marco_scopelift
export TENDERLY_PROJECT=project

# Recommended: pass explicit JSON body matching the API docs
export TENDERLY_VNET_CREATE_JSON='{
  "display_name": "local",
  "fork_config": { "network_id": 8453, "block_number": "latest" },
  "virtual_network_config": { "chain_config": { "chain_id": 8453 } },
  "sync_state_config": { "enabled": false },
  "explorer_page_config": { "enabled": false, "verification_visibility": "bytecode" }
}'

bun run test:all:tenderly
```

