/**
 * Live Velora Offset Validation Tests
 *
 * These tests validate that the hardcoded offsets (132, 100, 164) correctly extract
 * values from real Velora API calldata for all supported ParaSwap BUY methods.
 *
 * RUN ONLY WITH: RUN_LIVE_VELORA_TESTS=true bun run test:integration
 *
 * Purpose:
 * - Prove offsets work for all 6 Velora-documented BUY methods
 * - Validate against REAL calldata from Velora API (not mocks)
 * - Determine if RFQ and MakerPSM methods should be added to allowlist
 *
 * Reference: https://developers.velora.xyz/api/velora-api/velora-market-api/master/api-v6.2
 */

import { type Hex, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import type { Quote, VeloraQuote } from '@/domain/shared/adapters/types'
import {
  createVeloraQuoteAdapter,
  type VeloraAdapterOptions,
} from '@/domain/shared/adapters/velora'
import { getContractAddresses } from '@/lib/contracts/addresses'

// Gate behind env var to avoid CI flakes and API rate limits
const shouldRun = process.env['RUN_LIVE_VELORA_TESTS'] === 'true'
const testSuite = shouldRun ? describe : describe.skip

// All 6 ParaSwap BUY methods documented by Velora
const METHODS_TO_VALIDATE = [
  'swapExactAmountOut',
  'swapExactAmountOutOnUniswapV2',
  'swapExactAmountOutOnUniswapV3',
  'swapExactAmountOutOnBalancerV2',
  'swapOnAugustusRFQTryBatchFill', // Not currently in allowlist
  'swapExactAmountInOutOnMakerPSM', // Not currently in allowlist
] as const

// Expected offsets from Solidity contract
const EXPECTED_OFFSETS = {
  exactAmount: 132n,
  limitAmount: 100n,
  quotedAmount: 164n,
}

/**
 * Extract a uint256 value from calldata at a specific byte offset.
 *
 * @param calldata - Hex string of calldata (0x-prefixed)
 * @param byteOffset - Byte position to start reading from
 * @returns BigInt value extracted from calldata
 */
function extractUint256(calldata: Hex, byteOffset: number): bigint {
  // Skip 0x prefix, convert byte offset to hex character offset
  const hexOffset = 2 + byteOffset * 2
  // Extract 32 bytes (64 hex characters) for uint256
  const hex = calldata.slice(hexOffset, hexOffset + 64)

  if (hex.length !== 64) {
    throw new Error(
      `Invalid calldata slice at offset ${byteOffset}: expected 64 hex chars, got ${hex.length}`,
    )
  }

  return BigInt(`0x${hex}`)
}

testSuite('Velora Offset Validation (Live API)', () => {
  const addresses = getContractAddresses(base.id)
  const router = addresses.leverageRouterV2
  const weth = addresses.tokens?.weth
  const weeth = addresses.tokens?.weeth

  if (!router || !weth || !weeth) {
    throw new Error('Missing required addresses for Base chain')
  }

  // Test each method individually
  it.each(METHODS_TO_VALIDATE)(
    'validates offsets for method: %s',
    async (method) => {
      console.log(`\n=== Testing method: ${method} ===`)

      // Create adapter with method filter to force specific method
      const adapterOpts: VeloraAdapterOptions = {
        chainId: base.id,
        router,
        slippageBps: 50,
        includeContractMethods: [method],
      }

      const adapter = createVeloraQuoteAdapter(adapterOpts)

      // Request a small exactOut quote (weETH has 18 decimals)
      const amountOut = parseUnits('0.1', 18) // 0.1 weETH

      let quote: Quote
      try {
        quote = await adapter({
          inToken: weth,
          outToken: weeth,
          amountOut,
          intent: 'exactOut',
        })
      } catch (error) {
        if (error instanceof Error && error.message.includes('unsupported ParaSwap method')) {
          console.log(`  ⚠️  Method ${method} returned but is not in allowlist`)
          console.log(`  ℹ️  This is expected - test validates if we should add it`)
          // Don't fail - this is a discovery test
          return
        }
        throw error
      }

      // Verify quote has veloraData
      expect(quote).toHaveProperty('veloraData')
      if (!('veloraData' in quote)) {
        throw new Error('Quote missing veloraData for exactOut operation')
      }

      // Type narrow to VeloraQuote after verifying veloraData exists
      const veloraQuote = quote as VeloraQuote
      const { out: expectedOut, maxIn: expectedMaxIn } = veloraQuote
      const calldata = veloraQuote.calls[0]?.data ?? ('0x' as Hex)
      const { offsets } = veloraQuote.veloraData

      console.log(`  📊 API Response:`)
      console.log(`    - Expected Out: ${expectedOut}`)
      console.log(`    - Max In: ${expectedMaxIn}`)
      console.log(`    - Calldata length: ${calldata.length} chars`)
      console.log(`  🔍 Extracting from calldata at offsets:`)
      console.log(`    - exactAmount offset: ${offsets.exactAmount}`)
      console.log(`    - limitAmount offset: ${offsets.limitAmount}`)
      console.log(`    - quotedAmount offset: ${offsets.quotedAmount}`)

      // Extract values from calldata at offset positions
      const extractedExactAmount = extractUint256(calldata, Number(offsets.exactAmount))
      const extractedLimitAmount = extractUint256(calldata, Number(offsets.limitAmount))
      const extractedQuotedAmount = extractUint256(calldata, Number(offsets.quotedAmount))

      console.log(`  ✅ Extracted from calldata:`)
      console.log(`    - exactAmount: ${extractedExactAmount}`)
      console.log(`    - limitAmount: ${extractedLimitAmount}`)
      console.log(`    - quotedAmount: ${extractedQuotedAmount}`)

      // Verify extracted values match API response
      // exactAmount (offset 132) = output amount we want
      expect(extractedExactAmount).toBe(expectedOut)
      console.log(`  ✓ exactAmount matches expectedOut (${extractedExactAmount} = ${expectedOut})`)

      // quotedAmount (offset 164) = quoted input amount (srcAmount from API)
      expect(extractedQuotedAmount).toBe(expectedMaxIn)
      console.log(
        `  ✓ quotedAmount matches srcAmount (${extractedQuotedAmount} = ${expectedMaxIn})`,
      )

      // limitAmount (offset 100) = max input with slippage buffer (should be >= quoted)
      expect(extractedLimitAmount).toBeGreaterThanOrEqual(extractedQuotedAmount)
      console.log(
        `  ✓ limitAmount >= quotedAmount (${extractedLimitAmount} >= ${extractedQuotedAmount})`,
      )

      // Verify offsets match expected values
      expect(offsets.exactAmount).toBe(EXPECTED_OFFSETS.exactAmount)
      expect(offsets.limitAmount).toBe(EXPECTED_OFFSETS.limitAmount)
      expect(offsets.quotedAmount).toBe(EXPECTED_OFFSETS.quotedAmount)
      console.log(`  ✓ Offsets match expected values (132, 100, 164)`)

      console.log(`\n✅ Method ${method} PASSED validation\n`)
    },
    60_000, // 60s timeout per test
  )

  // Summary test that logs which methods work
  it('generates validation summary', async () => {
    console.log(`\n${'='.repeat(80)}`)
    console.log('VALIDATION SUMMARY')
    console.log('='.repeat(80))
    console.log('\nTested methods:')
    console.log('1. swapExactAmountOut')
    console.log('2. swapExactAmountOutOnUniswapV2')
    console.log('3. swapExactAmountOutOnUniswapV3')
    console.log('4. swapExactAmountOutOnBalancerV2')
    console.log('5. swapOnAugustusRFQTryBatchFill (NEW)')
    console.log('6. swapExactAmountInOutOnMakerPSM (NEW)')
    console.log('\nOffsets validated: 132, 100, 164')
    console.log('\nNext steps:')
    console.log('- If all tests passed: offsets are correct for all methods')
    console.log('- If RFQ/MakerPSM passed: add to SUPPORTED_METHODS array')
    console.log('- If some failed: investigate calldata structure differences')
    console.log(`${'='.repeat(80)}\n`)
  })
})
