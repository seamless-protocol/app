import { http } from 'wagmi'

/**
 * Mint and Redeem configuration that can use Tenderly VNet for testing
 * while keeping the rest of the app on production RPC
 */

// Check if we should use Tenderly RPC for mint/redeem operations
const isMintRedeemTestMode =
  import.meta.env['VITE_MINT_REDEEM_TEST_MODE'] === 'true' ||
  import.meta.env['VITE_MINT_TEST_MODE'] === 'true' ||
  import.meta.env['VITE_TEST_MODE'] === 'true'
const testRpc = import.meta.env['VITE_TEST_RPC_URL']

// Use Tenderly RPC for mint/redeem operations when in test mode
export const mintRedeemRpcUrl =
  isMintRedeemTestMode && testRpc
    ? testRpc
    : import.meta.env['VITE_BASE_RPC_URL'] || 'https://mainnet.base.org'

// Create a custom transport for mint/redeem operations
export const mintRedeemTransport = http(mintRedeemRpcUrl)

// Log configuration for debugging
if (isMintRedeemTestMode) {
  console.log('🧪 Mint/Redeem test mode enabled', {
    testRpc: testRpc ? 'configured' : 'not configured',
    mintRedeemRpcUrl: mintRedeemRpcUrl,
    isMintRedeemTestMode,
  })
}

// Export the test mode flag for use in components
export const isMintRedeemTestModeEnabled = isMintRedeemTestMode
