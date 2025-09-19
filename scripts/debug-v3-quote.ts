import { createPublicClient, http, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { createUniswapV3QuoteAdapter } from '../src/domain/shared/adapters/uniswapV3'
import { ADDR, RPC, V3 } from '../tests/shared/env'

async function main() {
  if (!ADDR.v3Quoter || !ADDR.v3SwapRouter || !ADDR.v3Pool || typeof V3.poolFee !== 'number') {
    throw new Error('Missing V3 configuration (quoter/router/pool/fee)')
  }

  const client = createPublicClient({
    chain: {
      ...base,
      rpcUrls: {
        default: { http: [RPC.primary] },
        public: { http: [RPC.primary] },
      },
    },
    transport: http(RPC.primary),
  })

  const adapter = createUniswapV3QuoteAdapter({
    publicClient: client,
    quoter: ADDR.v3Quoter,
    router: ADDR.v3SwapRouter,
    fee: V3.poolFee,
    recipient: ADDR.v3SwapRouter,
    poolAddress: ADDR.v3Pool,
    wrappedNative: ADDR.weth,
  })

  const amountIn = parseUnits('1', 18)
  const exactInQuote = await adapter({ inToken: ADDR.weth, outToken: ADDR.weeth, amountIn })

  console.log('exact-in quote', {
    out: exactInQuote.out.toString(),
    minOut: exactInQuote.minOut?.toString(),
    calldata: exactInQuote.calldata,
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
