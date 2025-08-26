import { type Address, erc20Abi, maxUint256 } from 'viem'
import { leverageManagerAbi } from '../../src/lib/contracts/abis/leverageManager'
import { leverageRouterAbi } from '../../src/lib/contracts/abis/leverageRouter' 
import { createWeETHSwapContext } from '../../src/features/leverage-tokens/utils/swapContext'
import { TEST_CONSTANTS, calculateMinShares } from './constants'
import { testClient, publicClient, walletClient } from './setup'

// Base token addresses (from V1 working version)
export const BASE_TOKEN_ADDRESSES = {
  weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address,
  WETH: '0x4200000000000000000000000000000000000006' as Address,
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address,
}

// Note: createWeETHSwapContext is now imported from swapContext.ts - V1 working pattern

/** Account setup for whale testing */
export async function setupWhaleAccount(whaleAddress: Address = TEST_CONSTANTS.WHALE_ADDRESS) {
  const account = { address: whaleAddress, type: 'json-rpc' } as const
  
  // Fund account with ETH for gas using Tenderly method
  try {
    await publicClient.request({
      method: 'tenderly_setBalance', 
      params: [[account.address], TEST_CONSTANTS.TENDERLY_BALANCE]
    })
    console.log('✅ Funded account via tenderly_setBalance')
  } catch (e) {
    console.log('Note: Could not set balance via tenderly_setBalance, whale should already have balance')
  }

  // Try account impersonation (Anvil only, skip for Tenderly)
  try {
    await testClient.impersonateAccount({ address: account.address })
    console.log('✅ Account impersonation enabled')
  } catch {
    console.log('Note: Account impersonation not supported on Tenderly, using account directly')
  }

  return account
}

/** Get leverage token metadata */
export async function getLeverageTokenData(leverageToken: Address, manager: Address) {
  const [collateralAsset, debtAsset] = await Promise.all([
    publicClient.readContract({
      address: manager,
      abi: leverageManagerAbi,
      functionName: 'getLeverageTokenCollateralAsset',
      args: [leverageToken],
    }),
    publicClient.readContract({
      address: manager, 
      abi: leverageManagerAbi,
      functionName: 'getLeverageTokenDebtAsset',
      args: [leverageToken],
    }),
  ])

  return {
    collateralAsset: collateralAsset as Address,
    debtAsset: debtAsset as Address,
  }
}

/** Approve Router to spend collateral (V1 pattern - single approval only) */
export async function approveRouter(
  collateralAsset: Address,
  router: Address,
  account: { address: Address; type: 'json-rpc' }
) {
  const { request } = await publicClient.simulateContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'approve',
    args: [router, maxUint256],
    account,
  })
  
  const hash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash })
}

/** Approve EtherFi L2ModeSyncPool for dual approval pattern */
export async function approveEtherFi(
  collateralAsset: Address,
  etherFiPool: Address,
  account: { address: Address; type: 'json-rpc' }
) {
  const { request } = await publicClient.simulateContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'approve',
    args: [etherFiPool, maxUint256],
    account,
  })
  
  const hash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash })
}

/** Preview mint and calculate parameters */
export async function previewMint(
  manager: Address,
  leverageToken: Address,
  amountAfterSwapCost: bigint
) {
  const preview = await publicClient.readContract({
    address: manager,
    abi: leverageManagerAbi,
    functionName: 'previewMint',
    args: [leverageToken, amountAfterSwapCost],
  })

  return {
    shares: preview.shares,
    minShares: calculateMinShares(preview.shares),
    tokenFee: preview.tokenFee,
    treasuryFee: preview.treasuryFee,
  }
}

/** Execute Router.mint transaction (full write) */
export async function executeRouterMint(
  router: Address,
  leverageToken: Address,
  amountAfterSwapCost: bigint,
  minShares: bigint,
  maxSwapCost: bigint,
  account: { address: Address; type: 'json-rpc' }
) {
  const swapContext = createWeETHSwapContext()
  
  // First simulate to catch errors early
  const { request } = await publicClient.simulateContract({
    address: router,
    abi: leverageRouterAbi,
    functionName: 'mint', 
    args: [leverageToken, amountAfterSwapCost, minShares, maxSwapCost, swapContext],
    account,
  })
  
  // Execute the actual transaction
  const hash = await walletClient.writeContract(request)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  return { hash, receipt }
}

/** Check token balance */
export async function getTokenBalance(token: Address, account: Address) {
  return publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account],
  })
}

/** Check token allowance */
export async function getTokenAllowance(token: Address, owner: Address, spender: Address) {
  return publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  })
}