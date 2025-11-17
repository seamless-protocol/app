# Integration Tests (Anvil or Tenderly VNet)

This directory contains integration tests that run against a local Anvil fork (default) or Tenderly Virtual TestNet. **Anvil is now the recommended approach** due to Tenderly quota limits and better local development experience.

## Quick Start

### Prerequisites

Install Foundry (includes Anvil):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Setup

1. Configure environment (.env.local, .env, or tests/integration/.env):
   ```bash
   # Required for Anvil mainnet fork
   VITE_ALCHEMY_API_KEY=your_alchemy_key_here

   # Optional: Anvil mainnet fork configuration
   ANVIL_MAINNET_FORK_URL=https://eth-mainnet.g.alchemy.com/v2/${VITE_ALCHEMY_API_KEY}
   ANVIL_PORT=8545
   ANVIL_MAINNET_FORK_BLOCK=23821277  # Pin a specific block for caching (recommended)

   # Optional: Tenderly credentials (for Tenderly backend)
   TENDERLY_ACCOUNT=your_account
   TENDERLY_PROJECT=your_project
   TENDERLY_ACCESS_KEY=your_access_key
   ```

   **Important: Pinning Fork Block for Performance**
   - Set `ANVIL_MAINNET_FORK_BLOCK` to a specific block number (e.g., `23821277`) to enable Anvil's disk cache
   - This dramatically speeds up subsequent test runs by reusing cached fork state
   - Choose a block that:
     - Is after all contracts you depend on were deployed
     - Is after any critical config changes you care about
     - You can verify on Etherscan or Alchemy UI
   - Treat this block as a snapshot of mainnet for tests - everyone uses the same block for deterministic results
   - When you need updated mainnet state, deliberately choose a new block and update the env var

2. **Option A: Using Anvil (Recommended)**

   Start Anvil with Mainnet fork:
   ```bash
   # Terminal 1: Start Anvil
   bun run anvil:mainnet

   # Terminal 2: Run tests
   bun run test:integration
   ```

3. **Option B: Using Tenderly JIT VNet (Advanced)**

   With Tenderly credentials configured:
   ```bash
   bun run test:integration:tenderly
   ```

4. **Option C: Using test runner directly with --backend flag (Advanced)**
   ```bash
   # Explicit Anvil backend
   bun scripts/run-tests.ts integration --backend=anvil

   # Explicit Tenderly backend (requires credentials)
   bun scripts/run-tests.ts integration --backend=tenderly

   # Auto-detect (Tenderly if configured, Anvil fallback)
   bun scripts/run-tests.ts integration --backend=auto
   ```

## Architecture

### Modes

- Anvil fork (default):
  - Pros: no external dependency, fast and free
  - Funding: `setBalance`, WETH `deposit()`, or impersonation of rich holders
  - Snapshot: `snapshot` / `revert` via Viem Test Actions

- Tenderly VNet (advanced):
  - Pros: real hosted fork, easy admin balance methods, works without Foundry
  - Funding: `tenderly_setBalance` / `tenderly_setErc20Balance`
  - Snapshot: `evm_snapshot` / `evm_revert`

### Test Structure

```
tests/integration/
├── domain/               # Domain-level integration tests
├── leverage-tokens/      # Leverage token mint/redeem flows
├── prices/               # Pricing integrations
├── vaults/               # Vault-related integrations
├── .env.example          # Environment configuration template
└── README.md             # This guide
```

Integration tests use shared helpers under `tests/shared/` for backend resolution, funding, and withFork-style isolation.

## Local Development

### Running Tests

```bash
# Start Anvil (keep running)
ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base

# Run all integration tests
bun run test:integration

# Run specific test file
bun run test:integration -- tests/integration/leverage-tokens/mint/router.v2.mainnet.mint.spec.ts

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

The CI workflow (`.github/workflows/ci.yml`) uses Anvil by default to avoid Tenderly quota limits:

```yaml
- name: Install Foundry
  uses: foundry-rs/foundry-toolchain@v1
  with:
    version: stable

- name: Start Anvil (Mainnet fork)
  run: |
    bash ./scripts/anvil-mainnet.sh &
    sleep 5
  env:
    VITE_ALCHEMY_API_KEY: ${{ secrets.VITE_ALCHEMY_API_KEY }}
    ANVIL_MAINNET_FORK_BLOCK: 23821277  # Pin block for caching
    ANVIL_NO_MINING: false

- name: Run integration tests
  run: TEST_CHAIN=mainnet E2E_LEVERAGE_TOKEN_KEY=wsteth-eth-25x bun scripts/run-tests.ts integration --backend=anvil -- tests/integration/leverage-tokens
  env:
    VITE_LIFI_API_KEY: ${{ secrets.VITE_LIFI_API_KEY }}
    VITE_INCLUDE_TEST_TOKENS: true
```

**Required GitHub Secrets:**
- `VITE_ALCHEMY_API_KEY` - For Anvil Mainnet fork
- `VITE_LIFI_API_KEY` - For LiFi quote adapter (optional but recommended)

## Performance

**Target SLOs:**
- Local tests: <30s total suite time
- CI tests: <60s total suite time  
- Individual test: <10s execution time

**Optimizations:**
- **Instant mining**: Anvil mines blocks immediately when transactions are submitted (no `--block-time` delay)
- `--no-rate-limit`: No compute throttling
- Snapshot/revert: Fast state management
- **Pinned fork block**: Set `ANVIL_MAINNET_FORK_BLOCK` to enable Anvil's disk cache (`~/.foundry/cache/rpc/1/<block>`), dramatically reducing startup time on subsequent runs

### Focused Run: Mainnet wstETH/ETH 25x (Tenderly JIT + LiFi)

When you only need to validate the production wstETH/ETH 25x leverage token mint/redeem paths on a Tenderly JIT VNet, run this focused command:

```bash
# Required env (CI/dev)
export TENDERLY_ACCOUNT=your_account
export TENDERLY_PROJECT=your_project
export TENDERLY_ACCESS_KEY=your_access_key
# LiFi key recommended to avoid 429s during mint
export VITE_LIFI_API_KEY=your_lifi_api_key
export VITE_LIFI_INTEGRATOR=seamless

"# Run focused integration test (Tenderly JIT VNet, mainnet)"
"# Requires TENDERLY_ACCESS_KEY, TENDERLY_ACCOUNT, and TENDERLY_PROJECT set"
bun run test:integration:wsteth
```

Notes:
- Test mints via LiFi and redeems via LiFi with bridges disabled (same-chain).
- Keeps other integration tests untouched and skipped in CI.
