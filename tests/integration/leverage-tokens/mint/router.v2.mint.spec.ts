import { describe, it } from 'vitest'
import { AVAILABLE_LEVERAGE_TOKENS, BACKEND, DEFAULT_CHAIN_ID, mode } from '../../../shared/env'
import { assertMintResult, runMintTest } from '../../../shared/scenarios/mint'

const TOKENS_UNDER_TEST = AVAILABLE_LEVERAGE_TOKENS.filter(
  (token) => token.chainId === DEFAULT_CHAIN_ID,
)

if (mode !== 'tenderly') {
  throw new Error(
    `Mint integration requires a Tenderly backend. Detected backend mode '${BACKEND.mode}'.`,
  )
}

if (TOKENS_UNDER_TEST.length === 0) {
  throw new Error(
    'No leverage tokens configured for the current backend; update tests/shared/env to provide token metadata.',
  )
}

describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
  for (const tokenDefinition of TOKENS_UNDER_TEST) {
    const testLabel = `${tokenDefinition.label} (${tokenDefinition.key})`

    it(`mints shares successfully for ${testLabel}`, async () => {
      const result = await runMintTest({ tokenDefinition })
      assertMintResult(result)
    })
  }
})
