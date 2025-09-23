#!/usr/bin/env bun

import { createPublicClient, http, formatUnits } from 'viem'
import { base } from 'viem/chains'
import { getAllLeverageTokenConfigs } from '../src/features/leverage-tokens/leverageTokens.config'

// Configuration
const ANVIL_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

// RPC URLs for different environments
const TEST_RPC_URL = process.env.TEST_RPC_URL
const PRODUCTION_RPC_URL = process.env.VITE_BASE_RPC_URL

// Standard tokens (not leverage tokens)
const STANDARD_TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006',
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
  console.log('')

  try {
    // Create clients for both environments
    const testClient = TEST_RPC_URL ? createPublicClient({
      chain: base,
      transport: http(TEST_RPC_URL),
    }) : null

    const productionClient = PRODUCTION_RPC_URL ? createPublicClient({
      chain: base,
      transport: http(PRODUCTION_RPC_URL),
    }) : null

    // Check which clients are available
    if (testClient) {
      console.log(`🧪 Test Environment (Tenderly VNet): ${TEST_RPC_URL}`)
    }
    if (productionClient) {
      console.log(`📈 Production Environment: ${PRODUCTION_RPC_URL}`)
    }
    console.log('')

    // Helper function to check balances with a specific client
    async function checkBalancesWithClient(client: any, environment: string) {
      console.log(`\n🌐 ${environment} Environment:`)
      
      // Check native ETH balance
      try {
        const ethBalance = await client.getBalance({ address: ANVIL_ACCOUNT })
        console.log(`💰 ETH Balance: ${formatUnits(ethBalance, 18)} ETH`)
      } catch (error) {
        console.log(`❌ ETH: Error reading balance - ${error instanceof Error ? error.message : String(error)}`)
      }

      // Check standard token balances
      console.log('📊 Standard Tokens:')
      for (const [tokenName, tokenAddress] of Object.entries(STANDARD_TOKENS)) {
        if (tokenAddress === '0x0000000000000000000000000000000000000000') continue

        try {
          const [balance, decimals, symbol] = await Promise.all([
            client.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [ANVIL_ACCOUNT],
            }),
            client.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'decimals',
            }),
            client.readContract({
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
    }

    // Check balances for each available environment
    if (testClient) {
      await checkBalancesWithClient(testClient, 'Test (Tenderly VNet)')
    }
    if (productionClient) {
      await checkBalancesWithClient(productionClient, 'Production')
    }

    // Helper function to check leverage tokens with a specific client
    async function checkLeverageTokensWithClient(client: any, environment: string, isTestEnvironment: boolean) {
      console.log(`\n🚀 ${environment} Leverage Tokens & Assets:`)
      
      const configs = getAllLeverageTokenConfigs()
      for (const config of configs) {
        const isTestToken = config.isTestOnly || config.name.toLowerCase().includes('tenderly')
        
        // Skip tokens that don't match the environment
        if (isTestEnvironment && !isTestToken) continue
        if (!isTestEnvironment && isTestToken) continue
        
        const prefix = isTestToken ? '🧪' : '📈'
        console.log(`\n${prefix} ${config.name} (${config.symbol}):`)
        
        // Check leverage token balance
        try {
          const [balance, decimals, symbol] = await Promise.all([
            client.readContract({
              address: config.address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [ANVIL_ACCOUNT],
            }),
            client.readContract({
              address: config.address,
              abi: ERC20_ABI,
              functionName: 'decimals',
            }),
            client.readContract({
              address: config.address,
              abi: ERC20_ABI,
              functionName: 'symbol',
            }),
          ])

          const formattedBalance = formatUnits(balance, decimals)
          console.log(`  🎯 Leverage Token (${symbol}): ${formattedBalance} ${symbol}`)
        } catch (error) {
          console.log(`  ❌ Leverage Token: Error reading balance - ${error instanceof Error ? error.message : String(error)}`)
        }

        // Check collateral asset balance
        try {
          const [balance, decimals, symbol] = await Promise.all([
            client.readContract({
              address: config.collateralAsset.address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [ANVIL_ACCOUNT],
            }),
            client.readContract({
              address: config.collateralAsset.address,
              abi: ERC20_ABI,
              functionName: 'decimals',
            }),
            client.readContract({
              address: config.collateralAsset.address,
              abi: ERC20_ABI,
              functionName: 'symbol',
            }),
          ])

          const formattedBalance = formatUnits(balance, decimals)
          console.log(`  💎 Collateral Asset (${symbol}): ${formattedBalance} ${symbol}`)
        } catch (error) {
          console.log(`  ❌ Collateral Asset: Error reading balance - ${error instanceof Error ? error.message : String(error)}`)
        }

        // Check debt asset balance
        try {
          const [balance, decimals, symbol] = await Promise.all([
            client.readContract({
              address: config.debtAsset.address,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [ANVIL_ACCOUNT],
            }),
            client.readContract({
              address: config.debtAsset.address,
              abi: ERC20_ABI,
              functionName: 'decimals',
            }),
            client.readContract({
              address: config.debtAsset.address,
              abi: ERC20_ABI,
              functionName: 'symbol',
            }),
          ])

          const formattedBalance = formatUnits(balance, decimals)
          console.log(`  💸 Debt Asset (${symbol}): ${formattedBalance} ${symbol}`)
        } catch (error) {
          console.log(`  ❌ Debt Asset: Error reading balance - ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    // Check leverage tokens for each available environment
    if (testClient) {
      await checkLeverageTokensWithClient(testClient, 'Test (Tenderly VNet)', true)
    }
    if (productionClient) {
      await checkLeverageTokensWithClient(productionClient, 'Production', false)
    }

  } catch (error) {
    console.error('❌ Failed to check balances:', error)
    process.exit(1)
  }
}

// Run the script
checkBalances().catch(console.error)
