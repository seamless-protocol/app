// import { afterAll, beforeAll, describe, expect, it } from 'vitest'
// import { mode } from '../../../shared/env'
// import { executeSharedMint } from '../../../shared/mintHelpers'
// import { withFork } from '../../../shared/withFork'

// describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
//   beforeAll(() => {
//     if (mode !== 'tenderly') {
//       console.warn('Skipping V2 mint integration: requires Tenderly VNet via TEST_RPC_URL')
//     }
//   })
//   afterAll(() => {})

//   it('mints shares successfully (happy path)', async () =>
//     withFork(async ({ account, publicClient, config }) => {
//       if (mode !== 'tenderly') {
//         throw new Error('TEST_RPC_URL missing or invalid for tenderly mode')
//       }

//       const outcome = await executeSharedMint({ account, publicClient, config })
//       expect(outcome.sharesMinted > 0n).toBe(true)
//       console.info('[SHARED MINT RESULT]', {
//         token: outcome.token,
//         sharesMinted: outcome.sharesMinted.toString(),
//       })
//     }))
// })
