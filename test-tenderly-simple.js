// Simple Tenderly integration test - standalone version
import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { base } from 'viem/chains'
import { createSwapContext } from './src/features/leverage-tokens/utils/swapContext.ts'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: './tests/integration/.env' })

console.log('🧪 Testing Tenderly integration...\n')

async function testTenderlyIntegration() {
  try {
    // Test 1: Environment variables
    console.log('1. Checking environment variables...')
    const tenderlyRpc = process.env.TEST_TENDERLY_ADMIN_RPC_BASE
    const privateKey = process.env.TEST_PRIVATE_KEY
    const managerAddress = process.env.TEST_LEVERAGE_MANAGER
    const routerAddress = process.env.TEST_LEVERAGE_ROUTER
    const leverageTokenAddress = process.env.TEST_LEVERAGE_TOKEN_PROXY
    
    console.log('✅ Environment variables loaded:')
    console.log('  Tenderly RPC:', tenderlyRpc ? '✅ Set' : '❌ Missing')
    console.log('  Private Key:', privateKey ? '✅ Set' : '❌ Missing')
    console.log('  Manager:', managerAddress ? '✅ Set' : '❌ Missing')
    console.log('  Router:', routerAddress ? '✅ Set' : '❌ Missing')
    console.log('  Leverage Token:', leverageTokenAddress ? '✅ Set' : '❌ Missing')
    console.log()

    // Test 2: SwapContext creation
    console.log('2. Testing SwapContext creation...')
    const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
    const wethAddress = '0x4200000000000000000000000000000000000006' // WETH on Base
    
    const swapContext = createSwapContext(usdcAddress, wethAddress, base.id)
    console.log('✅ SwapContext created successfully:')
    console.log('  Exchange:', swapContext.exchange)
    console.log('  Path:', swapContext.path)
    console.log('  Fees:', swapContext.fees)
    console.log('  Exchange Addresses:', Object.keys(swapContext.exchangeAddresses))
    console.log()

    // Test 3: Tenderly connection (if RPC is available)
    if (tenderlyRpc && !tenderlyRpc.includes('...')) {
      console.log('3. Testing Tenderly connection...')
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http(tenderlyRpc),
      })

      // Test basic connection
      const blockNumber = await publicClient.getBlockNumber()
      console.log('✅ Tenderly connection successful, block number:', blockNumber.toString())
      
      // Test contract addresses if available
      if (managerAddress && leverageTokenAddress) {
        console.log('4. Testing contract interaction...')
        
        // Test reading collateral asset
        const collateralAsset = await publicClient.readContract({
          address: managerAddress,
          abi: [{
            type: 'function',
            stateMutability: 'view',
            name: 'getLeverageTokenCollateralAsset',
            inputs: [{ name: 'token', internalType: 'contract ILeverageToken', type: 'address' }],
            outputs: [{ name: 'collateralAsset', internalType: 'contract IERC20', type: 'address' }],
          }],
          functionName: 'getLeverageTokenCollateralAsset',
          args: [leverageTokenAddress],
        })
        
        console.log('✅ Collateral asset read successfully:', collateralAsset)
        
        // Test reading debt asset
        const debtAsset = await publicClient.readContract({
          address: managerAddress,
          abi: [{
            type: 'function',
            stateMutability: 'view',
            name: 'getLeverageTokenDebtAsset',
            inputs: [{ name: 'token', internalType: 'contract ILeverageToken', type: 'address' }],
            outputs: [{ name: 'debtAsset', internalType: 'contract IERC20', type: 'address' }],
          }],
          functionName: 'getLeverageTokenDebtAsset',
          args: [leverageTokenAddress],
        })
        
        console.log('✅ Debt asset read successfully:', debtAsset)
        
        // Test creating SwapContext with real assets
        const realSwapContext = createSwapContext(collateralAsset, debtAsset, base.id)
        console.log('✅ Real SwapContext created:')
        console.log('  From:', collateralAsset)
        console.log('  To:', debtAsset)
        console.log('  Exchange:', realSwapContext.exchange)
        
      } else {
        console.log('⚠️  Contract addresses not available, skipping contract tests')
      }
      
    } else {
      console.log('⚠️  Tenderly RPC not configured, skipping connection test')
      console.log('   To test with Tenderly, set up the RPC URL in tests/integration/.env')
    }

    console.log('\n🎉 Tenderly integration test completed!')
    console.log('   SwapContext is working correctly')
    console.log('   Ready for real contract testing when Tenderly is configured')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testTenderlyIntegration() 