Sentry Observability Hardening (Replay Off)

Context
- Sentry is now ingesting; Replay is disabled in code. Errors show up but lack enough context for fast triage.
- Goal: 90% clarity with minimal code churn. Keep privacy (no raw addresses) and keep Replay off.

Outcomes (what “good” looks like)
- Issue titles immediately explain what failed and where (API, quote, tx).
- Stable grouping by provider/endpoint/status for API errors; by flow/token/revert for on-chain errors.
- Rich tags for filtering (provider, endpointPath, method, status, feature, chainId, token, durationMs, attempt).
- Breadcrumbs show a short timeline (start → submit → fail/success) without Replay.

Scope and Constraints
- Version-agnostic: v1 is deprecated; do not tag or branch by router version.
- No Replay; do not record sessions.
- No raw wallet addresses in Sentry (today some events include `userAddress`; we will plan to remove later, but keep plan privacy-safe from day one).

90% Path (minimal lift)
1) Enrich and normalize in one place (beforeSend)
   - Promote selected fields from `event.extra` into `event.tags` to make them queryable.
   - Add deterministic fingerprints to stabilize grouping:
     - API errors: ['api', provider, method, endpointPath, String(status||'0')]
     - Tx errors:  ['tx', flow, String(chainId||0), token, errorName||'revert']
   - Keep dropping “User rejected/denied”. Optionally drop AbortError timeouts if we decide they are noise.

2) Two tiny capture helpers (centralize shape and breadcrumbs)
   - captureApiError(provider, method, url, status, options)
     - Title: `ExternalAPIError: ${provider} ${method} ${endpointPath} ${status}`
     - Tags: provider, method, endpointPath (strip domain + query), status, feature, chainId, token, durationMs, attempt
     - Extra: url, responseSnippet (first 300–500 chars), requestId (header), params if safe
     - Breadcrumbs: start/end with duration, outcome (ok/fail/timeout)
   - captureTxError(flow, ctx)
     - Title: `OnChainError: ${flow} ${errorName||'revert'}`
     - Tags: flow: 'mint' | 'redeem', chainId, token, inputAsset/outputAsset, slippageBps, amountIn/expectedOut, quoteProvider (lifi/uniswap), status='tx-reverted'|'submit-failed'
     - Extra: decoded error (ERC‑6093 if available), gas estimate, txHash (if any)
     - Breadcrumbs: tx start → submit → success/fail, include durations

3) Adopt helpers surgically (few call-sites)
   - External APIs
     - EtherFi APR provider: src/features/leverage-tokens/utils/apy-calculations/apr-providers/etherfi.ts
     - Merkl rewards provider: src/features/leverage-tokens/utils/apy-calculations/rewards-providers/merkl.ts
   - User flows
     - Mint: src/features/leverage-tokens/components/leverage-token-mint-modal/index.tsx
     - Redeem: src/features/leverage-tokens/components/leverage-token-redeem-modal/index.tsx

Event Contract (fields we standardize)
- Title patterns
  - API: `ExternalAPIError: <provider> <METHOD> <endpointPath> <status>`
  - Quote: same as API (provider is lifi/uniswap; endpointPath=/quote or pool id summary)
  - Tx: `OnChainError: <mint|redeem> <decodedErrorName|revert>`
- Tags (common)
  - provider, method, endpointPath, status
  - feature (e.g., 'leverage-tokens'), chainId, token
  - durationMs, attempt, route (current pathname)
- Tx-specific
  - flow=mint|redeem, inputAsset, outputAsset, slippageBps, amountIn, expectedOut
  - quoteProvider=lifi|uniswap, quoteOrder, swapKey (short)
- Extra (non-indexed)
  - url, responseSnippet, requestId
  - decodedError (ERC‑6093 signature/name/message), rawError if needed

Breadcrumbs (small but useful)
- API: `api <provider> <METHOD> <endpointPath> start`, then `api ... <status> in <ms>`
- Tx: `tx <flow> start`, `tx submit <hash>`, `tx <flow> success|revert <reason>`
- Navigation: on route change (TanStack Router), optional.

Privacy
- Do not attach raw wallet addresses to Sentry. If an address is needed locally, pass a short redacted form (e.g., `0x1234…abcd`) in extra only, or skip entirely.
- Future option (if needed): hashed wallet user id; out of scope for this pass.

Implementation Sketch (minimal)
// 1) beforeSend enrichment (src/lib/config/sentry.config.ts)
// - Promote known extra fields into tags
// - Compute fingerprint for API/Tx categories
// - Drop noisy errors

// 2) capture helpers (new, e.g., src/lib/observability/sentry.ts)
export function captureApiError(params: { provider: string; method: string; url: string; status?: number; durationMs?: number; attempt?: number; feature?: string; chainId?: number; token?: string; responseSnippet?: string; requestId?: string; error?: unknown; })
// Extract endpointPath from url, build title, tags, breadcrumbs, call logger.error (so dev stays console‑only), which captures to Sentry in prod.

export function captureTxError(params: { flow: 'mint'|'redeem'; chainId: number; token: string; inputAsset?: string; outputAsset?: string; slippageBps?: number; amountIn?: string; expectedOut?: string; quoteProvider?: string; txHash?: string; error?: unknown; decodedName?: string; })
// Build title, tags; add tx breadcrumbs; capture.

Adoption Points (small edits)
- EtherFi APR provider: wrap catch with captureApiError('etherfi','GET', url, status?, { feature:'yield', chainId:8453, ... })
- Merkl rewards provider: on AbortError and non-2xx, call captureApiError('merkl','GET', url, status?, { feature:'apr', token, chainId, durationMs })
- Mint modal: on catch around exec.mint, call captureTxError({ flow:'mint', chainId, token: leverageTokenAddress, inputAsset: collateral, slippageBps, amountIn: form.amount, quoteProvider:'lifi'|'uniswap', error })
- Redeem modal: on catch around exec.redeem, call captureTxError({ flow:'redeem', chainId, token: leverageTokenAddress, outputAsset, slippageBps, expectedOut, quoteProvider, error })

Sentry UI (no-code actions)
- Saved queries: `provider:etherfi is:unresolved`, `flow:mint status:tx-reverted`.
- Dashboard: issues by tag[provider], tag[status].
- Spend control: pause Replay only (we already disabled in code).

Test Plan (local)
1) bun dev -- --mode production with VITE_SENTRY_DSN set.
2) Trigger API fail (flip URL to a bad path locally or block via DevTools) → expect ExternalAPIError with tags.
3) Trigger mint fail (low slippage) → expect OnChainError with decoded name if available.
4) Verify envelopes to ingest.sentry.io return 200 and issues group as designed.

Effort Estimate
- beforeSend enrichment: ~30–45 min
- Helpers (captureApiError, captureTxError): ~45–60 min
- Adopt in 4 call-sites (EtherFi/Merkl/Mint/Redeem): ~60–90 min
- Total: 2.5–3.5 hours

Risks / Notes
- Over-grouping: if titles vary wildly, rely more on fingerprint than title.
- PII: ensure we never attach raw wallet addresses going forward.
- Source maps & release tagging are “nice to have” next; not required for the 90% pass.
