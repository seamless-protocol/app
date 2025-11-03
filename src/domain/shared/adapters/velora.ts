import type { Address, Hex } from 'viem'
import { getAddress } from 'viem'
import { z } from 'zod'
import { getTokenDecimals } from '@/features/leverage-tokens/leverageTokens.config'
import { ETH_SENTINEL, type SupportedChainId } from '@/lib/contracts/addresses'
import { bpsToDecimalString, DEFAULT_SLIPPAGE_BPS } from './constants'
import type { QuoteFn } from './types'

export interface VeloraAdapterOptions {
  chainId: SupportedChainId
  router: Address
  /** Optional override for quote `fromAddress` (defaults to `router`). */
  fromAddress?: Address
  slippageBps?: number
  baseUrl?: string
  /** Optional filter to force specific ParaSwap contract methods (for testing). */
  includeContractMethods?: Array<string>
}

// Velora API response validation schemas
const veloraSuccessResponseSchema = z.object({
  priceRoute: z.object({
    srcAmount: z.string().refine(
      (val) => {
        try {
          BigInt(val)
          return true
        } catch {
          return false
        }
      },
      { message: 'srcAmount must be a valid BigInt string' },
    ),
    destAmount: z.string().refine(
      (val) => {
        try {
          BigInt(val)
          return true
        } catch {
          return false
        }
      },
      { message: 'destAmount must be a valid BigInt string' },
    ),
    contractAddress: z.string().transform((val, ctx) => {
      try {
        return getAddress(val)
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'contractAddress must be a valid Ethereum address',
        })
        return z.NEVER
      }
    }),
    contractMethod: z.string(),
  }),
  txParams: z.object({
    data: z.string().refine((val) => val.startsWith('0x') && /^[a-fA-F0-9]*$/.test(val.slice(2)), {
      message: 'data must be a valid hex string',
    }),
  }),
})

const veloraErrorResponseSchema = z.object({
  error: z.string(),
})

const veloraResponseSchema = z.union([veloraSuccessResponseSchema, veloraErrorResponseSchema])

// Velora API response types - only fields we actually use
type VeloraSwapResponse = z.infer<typeof veloraSuccessResponseSchema>

/**
 * Create a QuoteFn adapter backed by Velora's Market API.
 * Returns swap data and metadata needed for the redeemWithVelora contract function.
 * For exactOut quotes, veloraData is always present and can be accessed via type narrowing.
 */
export function createVeloraQuoteAdapter(opts: VeloraAdapterOptions): QuoteFn {
  const {
    chainId,
    router,
    fromAddress,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    baseUrl = 'https://api.velora.xyz',
    includeContractMethods,
  } = opts

  const slippage = bpsToDecimalString(slippageBps)

  return async ({ inToken, outToken, amountIn, amountOut, intent }) => {
    const url = buildQuoteUrl(baseUrl, {
      chainId,
      inToken,
      outToken,
      ...(typeof amountIn === 'bigint' ? { amountIn } : {}),
      ...(typeof amountOut === 'bigint' ? { amountOut } : {}),
      ...(intent ? { intent } : {}),
      router,
      fromAddress: (fromAddress ?? router) as Address,
      toAddress: router as Address,
      slippage,
      ...(includeContractMethods ? { includeContractMethods } : {}),
    })

    const res = await fetch(url.toString(), { method: 'GET' })
    if (!res.ok) throw new Error(`Velora quote failed: ${res.status} ${res.statusText}`)

    const response = veloraResponseSchema.parse(await res.json())

    // Check for Velora API errors in the response body
    if ('error' in response) {
      console.error('Velora error from API', { errorMessage: response.error })
      throw new Error(`Velora quote failed: ${response.error}`)
    }

    const wantsNativeIn = inToken.toLowerCase() === ETH_SENTINEL.toLowerCase()
    return mapVeloraResponseToQuote(response, wantsNativeIn, slippage, intent ?? 'exactIn')
  }
}

// Internal helpers
function buildQuoteUrl(
  baseUrl: string,
  params: {
    chainId: number
    inToken: Address
    outToken: Address
    amountIn?: bigint
    amountOut?: bigint
    intent?: 'exactIn' | 'exactOut'
    router: Address
    fromAddress: Address
    toAddress: Address
    slippage: string
    includeContractMethods?: Array<string>
  },
): URL {
  const url = new URL('/swap', baseUrl)
  const normalizeToken = (token: Address) =>
    token.toLowerCase() === ETH_SENTINEL.toLowerCase()
      ? '0x0000000000000000000000000000000000000000'
      : getAddress(token)

  const network = String(params.chainId)

  url.searchParams.set('srcToken', normalizeToken(params.inToken))
  url.searchParams.set('destToken', normalizeToken(params.outToken))
  url.searchParams.set('network', network)
  url.searchParams.set('userAddress', getAddress(params.fromAddress))
  url.searchParams.set('receiver', getAddress(params.toAddress))
  url.searchParams.set('version', '6.2')

  // Add required decimals parameters using centralized token decimals lookup
  const srcDecimals = getTokenDecimals(params.inToken)
  const destDecimals = getTokenDecimals(params.outToken)
  url.searchParams.set('srcDecimals', String(srcDecimals))
  url.searchParams.set('destDecimals', String(destDecimals))

  // Convert slippage from decimal string to basis points
  const slippageBps = Math.round(parseFloat(params.slippage) * 10000)
  url.searchParams.set('slippage', String(slippageBps))

  if (params.intent === 'exactOut') {
    if (typeof params.amountOut !== 'bigint') {
      throw new Error('Velora exact-out quote requires amountOut')
    }
    url.searchParams.set('side', 'BUY')
    url.searchParams.set('amount', params.amountOut.toString())
  } else {
    if (typeof params.amountIn !== 'bigint') {
      throw new Error('Velora exact-in quote requires amountIn')
    }
    url.searchParams.set('side', 'SELL')
    url.searchParams.set('amount', params.amountIn.toString())
  }

  // Add optional method filter (for testing)
  if (params.includeContractMethods && params.includeContractMethods.length > 0) {
    url.searchParams.set('includeContractMethods', params.includeContractMethods.join(','))
  }

  return url
}

function mapVeloraResponseToQuote(
  response: VeloraSwapResponse,
  wantsNativeIn: boolean,
  slippage: string,
  intent: 'exactIn' | 'exactOut',
) {
  const { priceRoute, txParams } = response

  // Extract approval target from contract address (already checksummed by zod schema)
  const approvalTarget = priceRoute.contractAddress

  // Extract swap data from transaction params
  const swapData = txParams.data as Hex // validated by zod schema

  // Extract amounts from price route (expected amounts)
  const expectedOut = BigInt(priceRoute.destAmount)
  const maxIn = BigInt(priceRoute.srcAmount)

  // Calculate slippage-adjusted minimum amount
  // Note: This is not used but instead keep for the sake of consistency with other adapters
  const slippageBps = Math.round(parseFloat(slippage) * 10000)
  const slippageMultiplier = (10000 - slippageBps) / 10000
  const minOut = BigInt(Math.floor(Number(expectedOut) * slippageMultiplier))

  // Velora API already handles slippage internally in the transaction calldata
  // We use the API's expected amount for UI display and debt repayment
  // The transaction calldata already contains slippage protection
  const out = expectedOut

  const baseQuote = {
    out,
    minOut,
    maxIn,
    approvalTarget: getAddress(approvalTarget),
    calldata: swapData,
    wantsNativeIn,
  }

  // For mint (exactIn), offsets are not used and ParaSwap returns SELL methods.
  // We accept these unconditionally and pass the calldata through to deposit().
  if (intent === 'exactIn') {
    console.log('[velora-adapter] ParaSwap method', {
      method: response.priceRoute?.contractMethod,
      intent,
      note: 'No offsets needed for regular deposit() with exactIn',
    })
    return baseQuote
  }

  // Only validate method and add veloraData for exactOut (used by redeemWithVelora)
  if (intent === 'exactOut') {
    // Validate ParaSwap method - offsets are specific to BUY (exactOut) methods
    // Velora API v6.2 documentation (all BUY methods): https://developers.velora.xyz/api/velora-api/velora-market-api/master/api-v6.2
    //
    // IMPORTANT: Only swapExactAmountOut has been validated with live API testing.
    // Other methods (UniswapV2, UniswapV3, BalancerV2, RFQ, MakerPSM) use different calldata structures
    // and the hardcoded offsets (132, 100, 164) extract incorrect values from their calldata.
    //
    // Live validation results (see tests/integration/domain/adapters/velora-offset-validation.spec.ts):
    // ✅ swapExactAmountOut: All offsets extract correct values
    // ❌ swapExactAmountOutOnUniswapV3: Offsets extract garbage data
    // ❌ swapExactAmountOutOnUniswapV2: API returns 500 error (cannot test)
    // ❌ swapExactAmountOutOnBalancerV2: API returns 500 error (cannot test)
    //
    // To add support for other methods:
    // 1. Get real calldata samples from Velora API for that method
    // 2. Derive correct byte offsets for exactAmount, limitAmount, quotedAmount
    // 3. Validate with live API test using RUN_LIVE_VELORA_TESTS=true
    // 4. Add method to allowlist below
    const SUPPORTED_METHODS = [
      'swapExactAmountOut', // ✅ Validated - offsets: exactAmount=132, limitAmount=100, quotedAmount=164
    ]

    if (priceRoute.contractMethod) {
      const isSupported = SUPPORTED_METHODS.includes(priceRoute.contractMethod)
      console.log('[velora-adapter] ParaSwap method', {
        method: priceRoute.contractMethod,
        intent,
        supported: isSupported,
        note: 'Offsets required for redeemWithVelora (BUY/exactOut methods only)',
      })

      if (!isSupported) {
        throw new Error(
          `Velora returned unsupported ParaSwap method for exactOut: ${priceRoute.contractMethod}. ` +
            `Only supported method: ${SUPPORTED_METHODS.join(', ')}. ` +
            `Hardcoded offsets (132n, 100n, 164n) are only validated for swapExactAmountOut. ` +
            `Other methods use different calldata structures where offsets extract incorrect values.`,
        )
      }
    }

    // Return quote with veloraData for redeemWithVelora
    return {
      ...baseQuote,
      // Store Velora-specific data for redeemWithVelora function
      veloraData: {
        augustus: approvalTarget, // Use the contract address from the API response
        offsets: {
          // IMPORTANT: These offsets are ONLY valid for swapExactAmountOut method.
          // They are used by the redeemWithVelora contract function to read specific
          // byte positions in the swap calldata.
          //
          // Validated method: swapExactAmountOut (ParaSwap Augustus V6.2)
          // - See Solidity tests: https://github.com/seamless-protocol/leverage-tokens/blob/audit-fixes/test/integration/8453/LeverageRouter/RedeemWithVelora.t.sol#L19
          // - See live API validation: tests/integration/domain/adapters/velora-offset-validation.spec.ts
          //
          // Other BUY methods (UniswapV2, UniswapV3, BalancerV2, RFQ, MakerPSM) use different
          // calldata structures where these offsets extract incorrect values.
          //
          // For regular deposit() operations (exactIn), these offsets are not needed
          // as the contract just passes the calldata through to Velora/Augustus.
          //
          // Offsets represent byte positions in swapExactAmountOut calldata:
          exactAmount: 132n, // Byte position for exact output amount
          limitAmount: 100n, // Byte position for max input amount (with slippage)
          quotedAmount: 164n, // Byte position for quoted input amount (base quote)
        },
      },
    }
  }

  // Fallback return (should be unreachable due to early returns above)
  return baseQuote
}
