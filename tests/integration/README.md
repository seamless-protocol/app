# Integration Tests (Tenderly VNet or Anvil Fork)

This directory contains integration tests that run against a Tenderly Virtual TestNet (default when configured) or a local Anvil fork of Base mainnet.

## Quick Start

### Prerequisites

Install Foundry (includes Anvil):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Setup

1. Configure environment:
   ```bash
   cp .env.example .env
   # Choose mode via env. Tenderly is used automatically when TENDERLY_RPC_URL is set.
   # For Tenderly (default when set):
   #   TENDERLY_RPC_URL=https://rpc.tenderly.co/fork/<your-fork-id>
   #   TENDERLY_ADMIN_RPC_URL=https://rpc.tenderly.co/fork/<your-fork-id>  # optional, often same as RPC
   # For Anvil (fallback when Tenderly is not configured):
   #   ANVIL_BASE_FORK_URL=https://mainnet.base.org
   ```

2. When using Anvil, start the Base fork (in one terminal):
   ```bash
   ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base
   ```

3. Run integration tests (in another terminal):
   ```bash
   bun run test:integration
   ```

## Architecture

### Modes

- Tenderly VNet (default when `TENDERLY_RPC_URL` is set):
  - Pros: real hosted fork, easy admin balance methods, works without Foundry
  - Funding: `tenderly_setBalance` / `tenderly_setErc20Balance`
  - Snapshot: `evm_snapshot` / `evm_revert`

- Anvil Base Fork (fallback):
  - Pros: no external dependency, fast and free
  - Funding: `setBalance`, WETH `deposit()`, or impersonation of rich holders
  - Snapshot: `snapshot` / `revert` via Viem Test Actions

### Test Structure

```
tests/integration/
├── .env.example          # Environment configuration template
├── setup.ts              # Anvil clients and Test Actions
├── utils.ts              # Funding utilities (WETH deposit, impersonation)
├── router.mint.test.ts   # Working integration tests
└── vitest.config.ts      # Test runner configuration
```

### Key Components

#### Setup (setup.ts)
- Mode: `tenderly` (when env present) or `anvil`
- Clients: Public + Wallet; and an Admin client for funding/snapshots
- Helpers: `topUpNative`, `setErc20Balance`, `takeSnapshot`, `revertSnapshot`

#### Funding Strategy (utils.ts)
1. **WETH**: Use `deposit()` function for deterministic funding
2. **Other tokens**: Impersonate rich holders (add addresses to `RICH_HOLDERS` map)
3. **Storage writes**: Disabled by default (ERC-7201 compatibility)

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
bun run test:integration router.mint.test.ts

# Run with watch mode
bun run test:integration --watch
```

### Debugging

```bash
# Check Anvil is running
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://127.0.0.1:8545

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x2105"}  (Base chain ID)
```

### Adding New Tokens

To test with new ERC-20 tokens, add token constants and rich holder addresses to `RICH_HOLDERS` in `funding.ts`:

```typescript
// Token addresses from Base network
const YOUR_TOKEN_ADDRESS: Address = '0x<your-token-address>'

// Rich holders for token funding via impersonation (Anvil only)  
const RICH_HOLDERS: Record<Address, Address | undefined> = {
  [USDC_ADDRESS]: '0x3304dd20f87a67ed649c3dF34aD6b19dFEC33877' as Address, // Coinbase custody wallet
  [YOUR_TOKEN_ADDRESS]: '0x<rich-holder-address>' as Address, // Description of holder
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

## Tenderly vs Anvil

Both modes share the same tests and helpers. Tenderly is preferred when configured; Anvil is provided for local/offline workflows and CI without secrets.

## Performance

**Target SLOs:**
- Local tests: <30s total suite time
- CI tests: <60s total suite time  
- Individual test: <10s execution time

**Optimizations:**
- `--block-time 0`: Instant mining
- `--no-rate-limit`: No compute throttling
- Snapshot/revert: Fast state management

### Focused Run: Mainnet wstETH/WETH 2x (Tenderly static + LiFi)

When you only need to validate the production wstETH/WETH 2x leverage token redeem path on a static Tenderly VNet, run this single spec:

```bash
# Required env (CI/dev)
export TENDERLY_ACCOUNT=your_account
export TENDERLY_PROJECT=your_project
export TENDERLY_ACCESS_KEY=your_access_key
# LiFi key recommended to avoid 429s during mint
export VITE_LIFI_API_KEY=your_lifi_api_key
export VITE_LIFI_INTEGRATOR=seamless-protocol

# Run focused integration test (static Tenderly VNet, mainnet)
bun run test:integration:wsteth
```

Notes:
- Test mints via LiFi and redeems via deterministic on-chain path (Uniswap V2 seeded locally).
- Keeps other integration tests untouched and skipped in CI.
