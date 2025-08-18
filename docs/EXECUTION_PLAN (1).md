# Seamless Front‑end v2 — Execution Plan (Phase II: Leverage Tokens)
*Testing‑first, Bun‑native, multi‑chain, Tenderly‑centric.*

## Who does what
- **Tech Lead (you)**
  - Own cross‑cutting decisions: chain switching, provider fallback, token‑economics guardrails, telemetry, CI gates.
  - Implement the **first write path (mint)** and set patterns (`simulateContract` → `writeContract`).
  - Review every PR for Design Gate + test completeness; mentor via weekly pairing.
- **Engineer 2**
  - Owns vertical feature slices end‑to‑end (scaffold → tests → UI/logic).
  - Starts with **Token Discovery** and then **Redeem**; later takes **Portfolio**.

> **Parallelization**: Start parallel work **after Milestone 1** lands (discovery + detail + sim). From Milestone 2 onward, run 2 small verticals in parallel, each behind a feature flag.

---

## Repo alignment (immediate)
- Keep existing structure; add **feature folders**:
```
src/features/
├─ leverage-tokens/     # Phase II (this plan)
│  ├─ hooks/
│  ├─ components/
│  └─ utils/
├─ morpho-vaults/       # Phase III
├─ dashboard/           # Phase III
├─ staking/             # Phase V
└─ governance/          # Phase VI
```
- Ensure these exist/are configured (see CLAUDE.md):
  - TanStack Router **hash mode** (already done).  
  - wagmi + RainbowKit config (`lib/config/wagmi.config.ts`) with **Base** + future Ethereum.  
  - Contracts/ABIs in `lib/contracts/abis` (factory + token).  
  - Feature flags: `VITE_ENABLE_*`.

---

## Milestones & deliverables

### **Milestone 1 — Token Discovery & Detail (Owner: Engineer 2)**
**Goal:** users browse leverage tokens and view accurate details; simulations run.

**Hooks to implement**
```
src/features/leverage-tokens/hooks/
- useLeverageTokenFactory()     // discover tokens
- useLeverageTokenMetadata()    // name, symbol, decimals, leverage
- useTokenTotalSupply()
- useTokenPrice()               // oracle + staleness guard
- useRebalancingStatus()        // last rebalance, threshold proximity
- useUserTokenBalance()
- useMintSimulation()
- useRedeemSimulation()
```
**ABI integration** (typed with viem):
```
src/lib/contracts/abis/leverageToken.ts
src/lib/contracts/abis/leverageTokenFactory.ts
```
**Query keys** in `src/features/leverage-tokens/utils/queryKeys.ts` (see System Prop).

**Subgraph queries (initial)**
- TokenCreated events (id, underlying, leverage, timestamp)  
- Rebalanced events (token, ratio, timestamp)  
- UserMinted/UserRedeemed events (owner, amount, tx)  
- Price timeseries for performance charts

**UI**
- Use ShadCN: `Card`, `Button`, `DropdownMenu`, `Badge`(leverage), `Progress`(rebal proximity), `Alert` (stale oracle).

**Tests**
- **Unit:** `tests/unit/leverage-calculations.test.ts`
  - calculates leverage ratio from collateral
  - determines rebalancing threshold breach
  - calculates mint fees correctly
  - handles slippage in redemption
- **Integration (Tenderly):** `tests/integration/leverage-tokens.test.ts`
  - fetches all deployed tokens from factory
  - filters by underlying
  - reads token metadata correctly
- **E2E (Mock):** browse list → open detail → run a simulation

**Acceptance / DoD**
- Works on Base; passes `bun check:fix`, `bun build`, `bun test`, `bun test:e2e`.  
- Telemetry: list load time, detail view time, simulation usage.

---

### **Milestone 2 — Mint & Redeem (Owners: TL = Mint, Eng2 = Redeem)**
**Goal:** complete mint/redeem with switch‑on‑write UX.

**Implementation notes**
- **Mint** flow: allowance check → approve if needed → `useSimulateContract` → `writeContract` → optimistic portfolio update → confirmation → invalidate keys.  
- **Redeem** flow: burn → confirmation → invalidate keys.  
- Handle 4001 (reject), 4902 (add network), stale oracle (disable), rebalancing in‑progress (guard).  
- Persist **tx history** (local storage) for the activity list.

**Tests**
- **Integration (Tenderly):** mint & redeem with `evm_snapshot/revert` per test.  
- **E2E (Mock):** connect → switch‑on‑write → mint success; redeem success; negative cases (reject, unknown chain, missing allowance).

**Acceptance / DoD**
- Telemetry: attempts, success/failure, p95 write time, wrong‑network prompts per session.

---

### **Milestone 3 — Portfolio & P&L (Owner: Engineer 2)**
**Goal:** users see holdings, P&L, and risk.

**Implementation notes**
- Aggregate balances **per chain** using per‑chain query keys; present combined view.  
- P&L: subgraph fills entry prices & fees; oracle prices provide current valuation; show “last updated”.  
- Risk: compute leverage ratio vs thresholds; show warnings.

**Tests**
- **Unit:** P&L & fee math.  
- **Integration:** batched reads for balances & ratios across multiple tokens.  
- **E2E:** portfolio renders rows; numbers consistent with detail.

**Acceptance / DoD**
- Feature‑flaggable; graceful degradation on subgraph/oracle outages (show cached + banner).

---

### **Milestone 4 — Hardening & Performance (Shared)**
- Tune Query `staleTime`/`retry`; ensure **multicall** used for heavy views; confirm fallback transports and per‑chain RPCs.  
- Add pagination/virtualization if token list grows; code‑split detail routes.  
- SLOs: token list < 2s p95, price updates < 500ms, simulation < 3s, confirmation < 30s; flake rate < 1% (7‑day).  
- Add **kill‑switch per token/chain** in config.

---

## Code templates (drop‑in)

**Typed hook skeleton**
```ts
// src/features/leverage-tokens/hooks/useLeverageTokenFactory.ts
import { useQuery } from '@tanstack/react-query'
import { readContract } from '@wagmi/core'
import factoryAbi from '@/lib/contracts/abis/leverageTokenFactory'
import { ltKeys } from '../utils/queryKeys'
import { config } from '@/lib/config/wagmi.config'

export function useLeverageTokenFactory() {
  return useQuery({
    queryKey: ltKeys.factory(),
    queryFn: async () => {
      const address = import.meta.env['VITE_FACTORY_ADDRESS'] as `0x${string}`
      // adjust method names to actual ABI
      const tokens = await readContract(config, { address, abi: factoryAbi, functionName: 'getAllTokens' })
      return tokens as `0x${string}`[]
    },
    staleTime: 60_000,
  })
}
```

**Optimistic write + invalidation**
```ts
// src/features/leverage-tokens/hooks/useMintToken.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { simulateContract, writeContract } from '@wagmi/core'
import tokenAbi from '@/lib/contracts/abis/leverageToken'
import { ltKeys } from '../utils/queryKeys'
import { config } from '@/lib/config/wagmi.config'

export function useMintToken(token: `0x${string}`, owner: `0x${string}`) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (amount: bigint) => {
      const { request } = await simulateContract(config, {
        address: token, abi: tokenAbi, functionName: 'mint', args: [amount],
        account: owner,
      })
      return writeContract(config, request)
    },
    onMutate: async (amount) => {
      await qc.cancelQueries({ queryKey: ltKeys.user(token, owner) })
      const prev = qc.getQueryData<any>(ltKeys.user(token, owner))
      qc.setQueryData(ltKeys.user(token, owner), (data: any) => ({
        ...(data ?? {}),
        balance: (BigInt(data?.balance ?? 0) + amount).toString(),
      }))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ltKeys.user(token, owner), ctx.prev)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ltKeys.user(token, owner) })
      qc.invalidateQueries({ queryKey: ltKeys.supply(token) })
    },
  })
}
```

**Feature flags**
```ts
// src/lib/config/features.ts
export const features = {
  tokenCreation: import.meta.env['VITE_ENABLE_LEVERAGE_TOKEN_CREATION'] === 'true',
  advancedFilters: import.meta.env['VITE_ENABLE_ADVANCED_FILTERS'] === 'true',
  portfolioPnl: import.meta.env['VITE_ENABLE_PORTFOLIO_PNL'] === 'true',
} as const
```

---

## Testing plan (Bun‑native)

**Install once**
```bash
bun add -d vitest @vitest/ui @testing-library/react @testing-library/jest-dom @playwright/test msw
```

**Scripts**
```bash
bun test          # Unit + MSW integration (fast)
bun test:e2e      # Playwright (MockConnector)
```

**Unit scenarios (examples)**
```ts
// tests/unit/leverage-calculations.test.ts
describe('Leverage Token Calculations', () => {
  it('calculates leverage ratio from collateral', () => {/* ... */})
  it('determines rebalancing threshold breach', () => {/* ... */})
  it('calculates mint fees correctly', () => {/* ... */})
  it('handles slippage in redemption', () => {/* ... */})
})
```

**Integration scenarios (Tenderly)**
```ts
// tests/integration/leverage-tokens.test.ts
describe('Factory Integration', () => {
  it('fetches all deployed tokens', async () => {/* ... */})
  it('filters tokens by underlying asset', async () => {/* ... */})
  it('reads token metadata correctly', async () => {/* ... */})
})
```

**E2E (MockConnector)**
- connect → browse tokens → view detail → simulate mint/redeem  
- connect → mint success (with switch‑on‑write)  
- connect → redeem success  
- negative: user rejects, unknown chain, stale oracle (write disabled)

**Tenderly**
- Use VTN/Fork; per test `evm_snapshot`/`evm_revert`.  
- Env: `TENDERLY_PUBLIC_RPC`, `TENDERLY_ADMIN_RPC`.

---

## CI / CD

**PR‑blocking (fast)**
```yaml
- run: bun install
- run: bun check:fix
- run: bun build          # IPFS-safe (base: './')
- run: bun test
- run: bun test:e2e
```
Artifacts: Playwright traces, junit/coverage.

**Nightly / RC**
- Tenderly matrix (Base now; +Ethereum later).  
- Negative cases: 4001, 4902, missing allowance, stale oracle, rebalancing in progress.  
- Subgraph/oracle outage drills via MSW (serve cached UI with warning).

**Deploy**
- Pin to IPFS; update IPNS/DNSLink. Enforce bundle budget threshold; fail build if exceeded.

---

## Environment & configuration
```
VITE_WALLETCONNECT_PROJECT_ID=xxx
VITE_BASE_RPC_URL=xxx
VITE_SEAMLESS_SUBGRAPH_URL=xxx
VITE_SENTRY_DSN=xxx
VITE_TEST_MODE=mock|prod
# Addresses (Base)
VITE_FACTORY_ADDRESS=0xE0b2e40EDeb53B96C923381509a25a615c1Abe57
VITE_MANAGER_ADDRESS=0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8
```
Access with `import.meta.env['VITE_*']` and guard undefined.

---

## Performance & Observability
- **SLOs**: Token list < 2s p95; price updates < 500ms; simulation < 3s; confirmation < 30s; write success ≥ 98% (excl. cancels).  
- **Metrics**: route p50/95/99; RPC error rate; wallet connect/drop; mint/redeem attempts & success; wrong‑network prompts/session; subgraph/oracle availability.  
- **Logs**: structured events per chain; include token address, amounts, and outcomes.

---

## Risks & mitigations
- **Contract upgrades**: monitor factory/manager implementation address changes; surface “contract version” in UI.  
- **Rate limiting**: enable `batch.multicall`; guard retries/backoff; exponential backoff on indexer calls.  
- **Graceful degradation**: cache last‑known good data; display staleness banners; disable risky writes.  
- **IPFS constraints**: code‑split routes; tree‑shake; avoid server features.

---

## Quick wins (do now)
1) Install test deps (Vitest/Playwright/MSW).  
2) Create `src/features/leverage-tokens/` with `hooks/`, `components/`, `utils/`.  
3) Add `queryKeys.ts` + type defs for token DTOs.  
4) Add MSW mocks for subgraph until it’s live.

---

## Documentation
- JSDoc on every contract hook (params, returns, chain notes).  
- Rebalancing logic doc (how thresholds are computed & enforced).  
- User‑facing tooltips (leverage multiple, rebalancing, fees, slippage).
