import type { Address } from 'viem'
import { parseEther, parseUnits } from 'viem'
import {
  publicClient,
  setTenderlyErc20Balance,
  setTenderlyNativeBalance,
  testClient,
  walletClient,
} from './clients'
import { ENV } from './env'

export async function fundNative(to: Address, ether: string) {
  if (ENV.RPC_KIND === 'anvil') {
    await testClient?.setBalance({ address: to, value: parseEther(ether) })
  } else {
    // Tenderly: set large balance
    const hex = `0x${parseEther(ether).toString(16)}` as `0x${string}`
    await setTenderlyNativeBalance(to, hex)
  }
}

export async function fundWeETH(target: Address, human: string) {
  // Prefer Tenderly ERC20 balance set if available
  if (ENV.RPC_KIND === 'tenderly') {
    const amount = parseUnits(human, 18)
    const hex = `0x${amount.toString(16)}` as `0x${string}`
    await setTenderlyErc20Balance(ENV.ADDR.WEETH, target, hex)
    return
  }

  // Anvil: impersonate a rich weETH holder and transfer
  const whale = ENV.WEETH_WHALE
  // Give whale gas and impersonate
  await testClient?.setBalance({ address: whale, value: parseEther('1') })
  await testClient?.impersonateAccount({ address: whale })

  const amount = parseUnits(human, 18)
  // Minimal ERC20 ABI
  const erc20Abi = [
    {
      type: 'function',
      name: 'transfer',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
  ] as const

  const hash = await walletClient.writeContract({
    address: ENV.ADDR.WEETH,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [target, amount],
    account: whale,
  })
  await publicClient.waitForTransactionReceipt({ hash })
  await testClient?.stopImpersonatingAccount({ address: whale })
}
