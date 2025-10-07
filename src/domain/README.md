Domain Layer Guidelines

- Purpose: Encapsulate business use-cases (plan/preview/execute) with no UI concerns.
- Imports: Only from `@/lib` and third-party libs. Never import from `features` or `routes`.
- React: Not allowed. Keep code framework-agnostic for testability and reuse.
- IO: Inject `publicClient`/`walletClient` and IO overrides; no hidden globals.
- Router : Single-tx flow supports optional input conversion and debt->collateral swap.
- Types: Prefer precise return types; avoid casts. Reuse helpers like `previewMint`, `getCollateralAsset`.

