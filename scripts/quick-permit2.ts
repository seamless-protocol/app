import { createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const RPC_URL = process.env.TEST_RPC_URL!
const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY!

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
const client = createWalletClient({
  account,
  chain: base,
  transport: http(RPC_URL),
})

const WETH = '0x4200000000000000000000000000000000000006'
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const SWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481'

async function main() {
  const amount = parseUnits('56.7', 18)

  console.log('1/2 approve token->permit2')
  await client.writeContract({
    address: WETH,
    abi: ['function approve(address spender, uint256 amount) returns (bool)'],
    functionName: 'approve',
    args: [PERMIT2, amount],
  })

  console.log('2/2 approve permit2->router')
  await client.writeContract({
    address: PERMIT2,
    abi: ['function approve(address token, address spender, uint160 amount, uint48 expiration)'],
    functionName: 'approve',
    args: [WETH, SWAP_ROUTER, BigInt(amount), BigInt(2 ** 48 - 1)],
  })

  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
