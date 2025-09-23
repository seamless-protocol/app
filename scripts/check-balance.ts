#!/usr/bin/env bun

/**
 * Script to check token balances for Anvil account #0 on Tenderly VNet
 * Usage: bun run scripts/check-balance.ts
 */

import { createPublicClient, http, formatUnits } from 'viem'
import { base } from 'viem/chains'

// Configuration
const ANVIL_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const
const TENDERLY_RPC_URL = process.env.TEST_RPC_URL

// Token addresses on Base
const TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
  ETH: '0x0000000000000000000000000000000000000000', // Native ETH
} as const

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'string' }],
  },
] as const

async function checkBalances() {
  console.log('🔍 Checking token balances for Anvil account #0')
  console.log(`📍 Address: ${ANVIL_ACCOUNT}`)
  console.log(`🌐 RPC: ${TENDERLY_RPC_URL}`)
  console.log('')

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(TENDERLY_RPC_URL),
    })

    // Check native ETH balance
    const ethBalance = await publicClient.getBalance({ address: ANVIL_ACCOUNT })
    console.log(`💰 ETH Balance: ${formatUnits(ethBalance, 18)} ETH`)

    // Check ERC20 token balances
    for (const [tokenName, tokenAddress] of Object.entries(TOKENS)) {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') continue

      try {
        const [balance, decimals, symbol] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [ANVIL_ACCOUNT],
          }),
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }),
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'symbol',
          }),
        ])

        const formattedBalance = formatUnits(balance, decimals)
        console.log(`🪙 ${tokenName} (${symbol}): ${formattedBalance} ${symbol}`)
      } catch (error) {
        console.log(`❌ ${tokenName}: Error reading balance - ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    console.log('')
    console.log('💡 If balances are 0, you may need to:')
    console.log('1. Use Tenderly dashboard to set balances')
    console.log('2. Run the funding script: bun run scripts/fund-account.ts')
    console.log('3. Transfer tokens from another account')

  } catch (error) {
    console.error('❌ Failed to check balances:', error)
    process.exit(1)
  }
}

// Run the script
checkBalances().catch(console.error)
