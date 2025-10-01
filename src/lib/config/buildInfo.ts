/**
 * Build metadata helpers.
 * The commit hash is injected at build time via Vite's `define` in vite.config.ts.
 * CI can also supply `VITE_COMMIT_SHA` or common provider vars as a fallback.
 */

export function getCommitHash(): string | undefined {
  // Prefer define-injected value (compile-time constant)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const injected = typeof __APP_COMMIT_HASH__ !== 'undefined' ? __APP_COMMIT_HASH__ : undefined
  const env =
    import.meta.env['VITE_COMMIT_SHA'] ||
    import.meta.env['VITE_VERCEL_GIT_COMMIT_SHA'] ||
    import.meta.env['VITE_GIT_COMMIT_SHA'] ||
    undefined
  const hash = injected || env
  return hash && hash.length > 0 ? hash : undefined
}

export function getShortCommitHash(): string | undefined {
  const full = getCommitHash()
  return full ? full.slice(0, 7) : undefined
}

export function getRepoCommitUrl(): string {
  const base = 'https://github.com/seamless-protocol/app'
  const hash = getCommitHash()
  return hash ? `${base}/commit/${hash}` : base
}
