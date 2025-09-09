/**
 * Minimal shared test env helpers (slice 1).
 * These provide a single place to resolve environment variables for tests.
 */
export function getRequiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export function getOptionalEnv(name: string, fallback = ''): string {
  const v = process.env[name]
  return v ?? fallback
}
