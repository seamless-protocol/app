# Integration Tests with Anvil Base Fork

This directory contains integration tests that run against a local Anvil fork of Base mainnet, replacing the previous Tenderly-based setup.

## Quick Start

### Prerequisites

Install Foundry (includes Anvil):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Setup

1. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Base RPC URL
   ```

2. **Start Anvil Base fork** (in one terminal):
   ```bash
   ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base
   ```

3. **Run integration tests** (in another terminal):
   ```bash
   bun run test:integration
   ```

## Architecture

### Anvil Advantages over Tenderly

- ✅ **No API limits** - Runs locally
- ✅ **Faster execution** - No network latency
- ✅ **Deterministic** - Consistent state across runs  
- ✅ **Free** - No external service costs
- ✅ **CI-friendly** - Easy to setup in GitHub Actions

### Test Structure

```
tests/integration/
├── .env.example          # Environment configuration template
├── setup.ts              # Legacy Anvil clients (replaced by tests/shared/*)
├── utils.ts              # Legacy funding utils (replaced by tests/shared/*)
├── mint/                 # Mint flow integration tests
│   └── mintWithRouter.int.test.ts
└── vitest.config.ts      # Test runner configuration
```

### Key Components

#### Test Client (setup.ts)
- **Public Client**: Read blockchain state
- **Wallet Client**: Sign and send transactions  
- **Test Client**: Anvil-specific actions (setBalance, impersonateAccount, snapshot/revert)

#### Funding Strategy (tests/shared/funding.ts)
1. **weETH**: On Tenderly, set ERC20 balance via `tenderly_setErc20Balance`; on Anvil, impersonate a weETH whale and transfer
2. **Native**: On Anvil, `setBalance`; on Tenderly, `tenderly_setBalance`
3. **Storage writes**: Avoided by default (ERC-7201 compatibility)

#### Test Isolation
- Each test uses `withFork()` wrapper
- Automatic snapshot before test / revert after test
- No state pollution between tests

## Local Development

### Running Tests

```bash
# Start Anvil (keep running)
ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base

# Run all integration tests
bun run test:integration

# Run specific test file
bun run test:integration mint/mintWithRouter.int.test.ts

# Run with watch mode
bun run test:integration --watch
```

### Tenderly VirtualNet (Local)

You can run the integration suite (and E2E UI) on an ephemeral Tenderly VirtualNet. The scripts will create the VNet, run tests against its RPC, and delete it afterward.

Option A — use an existing VNet URL (no create/delete):

```bash
TENDERLY_VNET_URL="https://virtual.base.eu.rpc.tenderly.co/<id>" \
  bun run test:integration:tenderly

# Or run both integration + E2E on the same VNet URL
TENDERLY_VNET_URL="https://virtual.base.eu.rpc.tenderly.co/<id>" \
  bun run test:all:tenderly
```

Option B — create a fresh VNet with an explicit JSON body (recommended):

```bash
export TENDERLY_ACCESS_KEY=... # or TENDERLY_TOKEN=...
export TENDERLY_ACCOUNT=marco_scopelift
export TENDERLY_PROJECT=project

export TENDERLY_VNET_CREATE_JSON='{
  "display_name": "local",
  "fork_config": { "network_id": 8453, "block_number": "latest" },
  "virtual_network_config": { "chain_config": { "chain_id": 8453 } },
  "sync_state_config": { "enabled": false },
  "explorer_page_config": { "enabled": false, "verification_visibility": "bytecode" }
}'

# Integration only
bun run test:integration:tenderly

# Integration + E2E (UI) on the same VNet
bun run test:all:tenderly
```

Option C — create a fresh VNet with env knobs (fork mode):

```bash
export TENDERLY_ACCESS_KEY=... # or TENDERLY_TOKEN=...
export TENDERLY_ACCOUNT=marco_scopelift
export TENDERLY_PROJECT=project

export TENDERLY_FORK_NETWORK_ID=8453
export TENDERLY_VNET_BLOCK=latest   # or decimal / 0x-hex

bun run test:integration:tenderly       # integration only
bun run test:all:tenderly               # integration + E2E
```

Notes:
- Auth works with either X-Access-Key (TENDERLY_ACCESS_KEY) or Bearer token (TENDERLY_TOKEN).
- The scripts choose the best RPC URL from the VNet response (Admin/Public).
- E2E reuses the same `TEST_RPC_URL` so UI and integration tests share one VNet.

### Debugging

```bash
# Check Anvil is running
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://127.0.0.1:8545

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x2105"}  (Base chain ID)
```

### Adding New Tokens

To test with new ERC-20 tokens, add rich holder addresses to `RICH_HOLDERS` in `utils.ts`:

```typescript
const RICH_HOLDERS: Record<string, Address | undefined> = {
  // USDC on Base
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': '0x<rich-usdc-holder>',
  // Add your token here
  '0x<your-token-address>': '0x<rich-holder-address>',
}
```

## CI/CD Setup

For GitHub Actions, add this step before running tests:

```yaml
- name: Install Foundry
  uses: foundry-rs/foundry-toolchain@v1
  with:
    version: stable

- name: Start Anvil Base Fork
  run: |
    nohup anvil --fork-url "$ANVIL_BASE_FORK_URL" --port 8545 --block-time 0 --no-rate-limit > anvil.log 2>&1 &
    for i in {1..60}; do nc -z 127.0.0.1 8545 && break || sleep 1; done

- name: Run Integration Tests  
  run: bun run test:integration
  env:
    ANVIL_BASE_FORK_URL: https://mainnet.base.org
```

## Shared Harness (Tenderly & Anvil)

- `tests/shared/env.ts`: Single env configuration for both RPCs
- `tests/shared/clients.ts`: Builds viem clients; includes Test Actions on Anvil
- `tests/shared/funding.ts`: weETH/native funding utilities for each RPC
- `tests/shared/withFork.ts`: Snapshot/revert wrapper; no-op on Tenderly

## Performance

**Target SLOs:**
- Local tests: <30s total suite time
- CI tests: <60s total suite time  
- Individual test: <10s execution time

**Optimizations:**
- `--block-time 0`: Instant mining
- `--no-rate-limit`: No compute throttling
- Snapshot/revert: Fast state management
