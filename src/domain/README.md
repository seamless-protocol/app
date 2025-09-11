Domain Layer Guidelines

- Purpose: Encapsulate business use-cases (plan/preview/execute) with no UI concerns.
- Imports: Only from `@/lib` and third-party libs. Never import from `features` or `routes`.
- React: Not allowed. Keep code framework-agnostic for testability and reuse.
- IO: Inject `publicClient`/`walletClient` and IO overrides; no hidden globals.
- Router versions:
  - V1: Collateral-only deposits; no input->collateral conversion.
  - V2: Single-tx flow supports optional input conversion and debt->collateral swap.
  - Detection: `VITE_ROUTER_VERSION` override (v1|v2|auto), or runtime probe with caching.
- Types: Prefer precise return types; avoid casts. Reuse helpers like `previewMint`, `getCollateralAsset`.

