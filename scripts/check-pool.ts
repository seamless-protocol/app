import { createPublicClient, decodeFunctionResult, encodeFunctionData, http } from 'viem'
import { base } from 'viem/chains'
import { ADDR, RPC } from '../tests/shared/env.ts'

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

const poolKey = {
  currency0: ADDR.weeth,
  currency1: ADDR.weth,
  hooks: '0x0000000000000000000000000000000000000000',
  fee: 500,
  tickSpacing: 10,
}

async function main() {
  console.log('quoter', ADDR.quoterV4)
  const data = encodeFunctionData({
    abi: [
      {
        type: 'function',
        stateMutability: 'nonpayable',
        name: 'quoteExactInputSingle',
        inputs: [
          {
            name: 'params',
            type: 'tuple',
            components: [
              {
                name: 'poolKey',
                type: 'tuple',
                components: [
                  { name: 'currency0', type: 'address' },
                  { name: 'currency1', type: 'address' },
                  { name: 'fee', type: 'uint24' },
                  { name: 'tickSpacing', type: 'int24' },
                  { name: 'hooks', type: 'address' },
                ],
              },
              { name: 'zeroForOne', type: 'bool' },
              { name: 'exactAmount', type: 'uint128' },
              { name: 'hookData', type: 'bytes' },
            ],
          },
        ],
        outputs: [
          { name: 'amountOut', type: 'uint256' },
          { name: 'gasEstimate', type: 'uint256' },
        ],
      },
    ] as const,
    functionName: 'quoteExactInputSingle',
    args: [
      {
        poolKey,
        zeroForOne: true,
        exactAmount: 1_000_000_000_000_000_000n,
        hookData: '0x',
      },
    ],
  })
  const res = await client.call({ to: ADDR.quoterV4!, data })
  const decoded = decodeFunctionResult({
    abi: [
      {
        type: 'function',
        stateMutability: 'nonpayable',
        name: 'quoteExactInputSingle',
        inputs: [
          {
            name: 'params',
            type: 'tuple',
            components: [
              {
                name: 'poolKey',
                type: 'tuple',
                components: [
                  { name: 'currency0', type: 'address' },
                  { name: 'currency1', type: 'address' },
                  { name: 'fee', type: 'uint24' },
                  { name: 'tickSpacing', type: 'int24' },
                  { name: 'hooks', type: 'address' },
                ],
              },
              { name: 'zeroForOne', type: 'bool' },
              { name: 'exactAmount', type: 'uint128' },
              { name: 'hookData', type: 'bytes' },
            ],
          },
        ],
        outputs: [
          { name: 'amountOut', type: 'uint256' },
          { name: 'gasEstimate', type: 'uint256' },
        ],
      },
    ] as const,
    functionName: 'quoteExactInputSingle',
    data: res.data!,
  })
  console.log(decoded)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
