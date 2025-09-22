// Simple debug script to create a visible transaction on Tenderly
import { createPublicClient, createWalletClient, http } from 'viem'
import { base } from 'viem/chains'

const RPC_URL = 'https://virtual.base.us-east.rpc.tenderly.co/3433d25e-64a4-4ea1-96c1-fbc9e6022e30'

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL)
})

const walletClient = createWalletClient({
  chain: base,
  transport: http(RPC_URL),
  account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
})

async function debugMint() {
  console.log('🔍 Starting debug mint transaction...')
  console.log('📡 RPC URL:', RPC_URL)
  
  try {
    // Take a snapshot first
    const snap = await publicClient.request({
      method: 'evm_snapshot'
    })
    console.log('📸 Snapshot taken:', snap)
    
    // Fund the account with some ETH
    await publicClient.request({
      method: 'tenderly_addBalance',
      params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xde0b6b3a7640000'] // 1 ETH
    })
    console.log('💰 Account funded with 1 ETH')
    
    // Fund with weETH
    await publicClient.request({
      method: 'tenderly_setErc20Balance',
      params: [
        '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A', // weETH
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x56bc75e2d630000000' // 100 weETH
      ]
    })
    console.log('💰 Account funded with 100 weETH')
    
    // Try to call the leverage router deposit function
    const txHash = await walletClient.sendTransaction({
      to: '0xfd46483b299197c616671B7dF295cA5186c805c2', // Leverage Router
      data: '0x' // This will fail but create a visible transaction
    })
    
    console.log('📝 Transaction hash:', txHash)
    console.log('🔗 Check Tenderly dashboard for transaction details')
    console.log('⏰ Transaction will remain visible for 10 minutes...')
    
    // Wait 10 minutes to keep transaction visible
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))
    
  } catch (error) {
    console.error('❌ Transaction failed:', error)
    console.log('🔗 Check Tenderly dashboard for the failed transaction')
    console.log('⏰ Transaction will remain visible for 10 minutes...')
    
    // Wait 10 minutes to keep transaction visible
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))
  }
}

debugMint().catch(console.error)
