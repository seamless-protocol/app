import type { Hash } from 'viem'
import { testClient } from './clients'

export async function takeSnapshot(): Promise<Hash | null> {
  if (!testClient) return null
  return await testClient.snapshot()
}

export async function revertSnapshot(id: Hash | null) {
  if (!testClient || !id) return
  await testClient.revert({ id })
}

export async function withFork<T>(fn: () => Promise<T>): Promise<T> {
  const snap = await takeSnapshot()
  try {
    return await fn()
  } finally {
    await revertSnapshot(snap)
  }
}
