import { describe, it, expect } from 'vitest'
import { type Address } from 'viem'
import { withFork, erc20Abi, approveIfNeeded, parseAmount } from './utils'
import { leverageTokenAbi } from '../../src/lib/contracts/abis/leverageToken'
import { leverageTokenFactoryAbi } from '../../src/lib/contracts/abis/leverageTokenFactory'

// Note: The leverageToken has mint(address to, uint256 amount) function
// For testing purposes, we'll test direct minting on the leverage token
// In production, this would likely go through a manager contract

describe('Leverage Tokens — mint (Tenderly VNet / viem)', () => {
  it('simulate → write → verify (direct mint on leverage token)', async () =>
    withFork(async ({ account, walletClient, publicClient, ADDR, fund }) => {
      const lt: Address = ADDR.lt
      const mintAmount = await parseAmount(lt, '10') // Mint 10 leverage tokens

      // Fund: 1 native for gas
      await fund.native([account.address], '1')

      // Pre-state
      const preLt = await publicClient.readContract({
        address: lt,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })

      // Simulate → Write → Wait (direct mint on leverage token)
      const { request } = await publicClient.simulateContract({
        address: lt,
        abi: leverageTokenAbi,
        functionName: 'mint',
        args: [account.address, mintAmount],
        account,
      })
      const txHash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      expect(receipt.status).toBe('success')

      // Post-state
      const postLt = await publicClient.readContract({
        address: lt,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      })

      // Assertions - verify mint amount matches
      expect(postLt > preLt).toBe(true) // received LT
      expect(postLt - preLt === mintAmount).toBe(true) // exact mint amount
    }))

  it('mints from a second account when TEST_PRIVATE_KEYS_CSV is provided', async () =>
    withFork(async ({ others, publicClient, ADDR, fund }) => {
      if (others.length === 0) {
        // nothing to do; test will effectively be a no-op path that passes
        expect(true).toBe(true)
        return
      }
      const { account: userB, wallet: walletB } = others[0]
      const lt: Address = ADDR.lt
      const mintAmountB = await parseAmount(lt, '5') // Mint 5 leverage tokens

      // Fund: 1 native for gas
      await fund.native([userB.address], '1')

      const { request } = await publicClient.simulateContract({
        address: lt,
        abi: leverageTokenAbi,
        functionName: 'mint',
        args: [userB.address, mintAmountB],
        account: userB,
      })
      const txHash = await walletB.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      expect(receipt.status).toBe('success')
    }))
})