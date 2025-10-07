Sentry Observability Hardening (Replay Off)

Context
- Sentry is ingesting; Replay is disabled in code. The goal is fast triage with clear grouping and actionable tags while preserving privacy.

Outcomes (what “good” looks like)
- Issue titles explain what failed and where (API, quote, tx).
- Stable grouping by provider/endpoint/status for API; by flow/token/decoded error for on‑chain.
- Rich tags for filtering (provider, endpointPath, method, status, feature, chainId, token, durationMs, attempt, route).
- Breadcrumbs show a short timeline (start → submit → fail/success) without Replay.

Scope and Constraints
- Version‑agnostic: v1 is deprecated; do not tag or branch by router version.
- No Replay; do not record sessions.
- No wallet addresses sent to Sentry (scrubbed in beforeSend).

Implementation Summary
1) Central enrichment (beforeSend)
   - Promote selected fields from `event.extra` into `event.tags` so they’re queryable.
   - Deterministic fingerprints for grouping:
     - API: ['api', provider, method, endpointPath, String(status||'0')]
     - Tx:  ['tx', flow, String(chainId||0), token, errorName||'revert']
   - Normalize titles:
     - API: `ExternalAPIError: <provider> <METHOD> <endpointPath> <status>`
     - Tx:  `OnChainError: <mint|redeem> <decodedErrorName|revert>`
   - Filter noise: drop “User rejected/denied”. Optional: drop AbortError timeouts if noisy.

2) Capture helpers (centralize shape + breadcrumbs)
   - captureApiError(provider, method, url, status, options)
     - Tags: provider, method, endpointPath, status, feature, chainId, token, durationMs, attempt, route
     - Extra: url, responseSnippet (first ~500 chars), requestId
     - Breadcrumbs: end with `${status} in <ms>`
   - captureTxError(flow, ctx)
     - Tags: flow (mint|redeem), chainId, token, inputAsset/outputAsset, slippageBps, amountIn/expectedOut, quoteProvider, route, status
     - Extra: decoded error name/message if available, txHash when present
     - Breadcrumbs: tx start/submit/success|revert with durations

3) Adoption
   - External APIs: EtherFi APR, Merkl rewards
   - User flows: Mint/Redeem modals (tx failures)
   - Subgraph: TheGraph GraphQL wrapper (HTTP non‑200, GraphQL errors, network failures)

Event Contract (fields we standardize)
- Titles
  - API: `ExternalAPIError: <provider> <METHOD> <endpointPath> <status>`
  - Tx:  `OnChainError: <mint|redeem> <decodedErrorName|revert>`
- Tags (common)
  - provider, method, endpointPath, status
  - feature (e.g., 'leverage-tokens'), chainId, token
  - durationMs, attempt, route (current hash path)
- Tx-specific
  - flow=mint|redeem, inputAsset, outputAsset, slippageBps, amountIn, expectedOut
  - provider=lifi|uniswap, quoteOrder, swapKey (short)
- Extra (non‑indexed)
  - url, responseSnippet, requestId
  - decodedError (ERC‑6093 signature/name/message), rawError if needed

Breadcrumbs (small but useful)
- API: `api <provider> <METHOD> <endpointPath> <status> in <ms>`
- Tx:  `tx <flow> start`, `tx submit <hash>`, `tx <flow> success|revert <reason>`
- Navigation: optional (via router events).

Privacy
- No wallet addresses are sent to Sentry. Any address data should be excluded or redacted locally; beforeSend scrubs `userAddress` defensively.

Sentry UI (no‑code actions)
- Saved queries: `provider:etherfi is:unresolved`, `flow:mint status:tx-reverted`.
- Dashboard: issues by tag[provider], tag[status].
- Spend control: keep Replay paused (disabled in code).

 Test Plan (local)
1) bun dev -- --mode production with VITE_SENTRY_DSN set.
2) Force API fail → expect ExternalAPIError with tags, correct grouping.
3) Trigger mint/redeem fail (e.g., low slippage) → expect OnChainError with decoded name when available.
4) TheGraph failures (HTTP/GQL/network) → expect ExternalAPIError provider=thegraph with route tag.

Future Enhancements
- Optional: filter AbortError/timeout noise in beforeSend if volume is high.
- Optional: release tagging + source maps for enhanced stack traces.
