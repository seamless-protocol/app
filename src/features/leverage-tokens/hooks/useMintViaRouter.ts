import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { decodeErrorResult, type BaseError } from 'viem'
import type { Address } from 'viem'
import { erc20Abi, maxUint256 } from 'viem'
import { getPublicClient } from '@wagmi/core'
import { base } from 'wagmi/chains'
import { useAccount, useChainId, useConfig } from 'wagmi'
import { testLocalAccount } from '@/lib/config/wagmi.config.test'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { IERC20Errors } from '@/lib/abi/erc20Errors'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { leverageRouterAbi } from '@/lib/contracts/generated'
import { TX_SETTINGS } from '../utils/constants'
import { classifyError, isActionableError } from '../utils/errors'
import { logWriteError, logWriteSuccess } from '../utils/logger'
import { ltKeys } from '../utils/queryKeys'
import { createSwapContext, type SwapContext } from '../utils/swapContext'

// Runtime validation for test mode
async function assertTestRuntime(config: any, address: `0x${string}`) {
  const client = getPublicClient(config, { chainId: base.id })
  const [rpcChainId, transport] = await Promise.all([
    client.getChainId(),
    Promise.resolve((client as any).transport?.url ?? 'unknown'),
  ])
  console.log('🔧 Runtime:', { rpcChainId, expected: base.id, transport, address })
  if (rpcChainId !== base.id) {
    throw new Error(`CHAIN_ID_MISMATCH: rpc=${rpcChainId} expected=${base.id}`)
  }
}

// Decode ERC20 errors for better debugging
function tryDecodeERC20Error(err: unknown) {
  const e = err as BaseError
  // Find first error that carries raw `data` (viem exposes nested causes)
  const raw = e.walk((ee) => (ee as any)?.data) as `0x${string}` | undefined
  if (!raw) return null
  try {
    const decoded = decodeErrorResult({ abi: IERC20Errors, data: raw })
    console.error('🧨 Decoded ERC20 revert:', decoded)
    return decoded
  } catch {
    return null
  }
}

export interface UseMintViaRouterParams {
  token: Address
  onSuccess?: (hash: Address) => void
  onError?: (error: unknown) => void
}

export interface MintViaRouterParams {
  equityInCollateralAsset: bigint
  slippageBps?: number // Default 50 bps (0.5%)
  maxSwapCostInCollateralAsset?: bigint
  swapContext?: SwapContext
}

/**
 * Hook to mint leverage tokens via Router contract
 * Follows the pattern: previewMint → approve → simulate → write → wait
 * Handles slippage protection and auto-approves Router for collateral
 */
export function useMintViaRouter({ token, onSuccess, onError }: UseMintViaRouterParams) {
  const queryClient = useQueryClient()
  const { address: user } = useAccount()
  const chainId = useChainId()
  const config = useConfig() // Get config from context instead of importing
  const addresses = getContractAddresses(chainId)

  // Get Router and Manager addresses
  const routerAddress = addresses.leverageRouter
  const managerAddress = addresses.leverageManager

  // Debug logging for E2E tests
  console.log('🏗️ Contract resolution:', {
    chainId,
    addresses,
    routerAddress,
    managerAddress,
    hasRouter: !!routerAddress,
    hasManager: !!managerAddress,
  })

  if (!routerAddress || !managerAddress) {
    throw new Error(`Router/Manager contracts not deployed on chain ${chainId}`)
  }

  // Query for collateral asset of the leverage token
  const { data: collateralAsset } = useQuery({
    queryKey: ['collateralAsset', token, chainId],
    queryFn: async () => {
      const asset = await readContract(config, {
        address: managerAddress,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [token],
      })
      return asset
    },
    enabled: !!token && !!managerAddress,
  })

  // Preview mint to calculate expected shares
  const previewMint = async (equityInCollateralAsset: bigint) => {
    if (!managerAddress) throw new Error('Manager address not available')

    return await readContract(config, {
      address: managerAddress,
      abi: leverageManagerAbi,
      functionName: 'previewMint',
      args: [token, equityInCollateralAsset],
    })
  }

  // Check and handle allowance for Router
  const ensureAllowance = async (amount: bigint, account: any) => {
    if (!collateralAsset || !routerAddress) {
      throw new Error('Missing collateral asset or router address')
    }

    // Extract address from account (Local Account has .address property, Address is already a string)
    const accountAddress = typeof account === 'string' ? account : account.address

    // Check current allowance
    const currentAllowance = await readContract(config, {
      address: collateralAsset,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [accountAddress, routerAddress],
    })

    // If allowance is insufficient, approve max
    if (currentAllowance < amount) {
      const { request } = await simulateContract(config, {
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'approve',
        args: [routerAddress, maxUint256],
        account,
      })

      const approveHash = await writeContract(config, request)
      await waitForTransactionReceipt(config, {
        hash: approveHash,
        confirmations: TX_SETTINGS.confirmations,
      })
    }
  }

  // Create swap context for the leverage token
  const generateSwapContext = async () => {
    if (!collateralAsset) {
      throw new Error('Collateral asset not available')
    }

    const debtAsset = (await readContract(config, {
      address: managerAddress,
      abi: leverageManagerAbi,
      functionName: 'getLeverageTokenDebtAsset',
      args: [token],
    })) as Address

    return createSwapContext(collateralAsset, debtAsset, chainId)
  }

  const mutation = useMutation({
    mutationKey: [...ltKeys.token(token), 'mintViaRouter', user],

    mutationFn: async ({
      equityInCollateralAsset,
      slippageBps = 50, // 0.5% default slippage
      maxSwapCostInCollateralAsset,
      swapContext,
    }: MintViaRouterParams) => {
      if (!user) {
        throw new Error('WALLET_NOT_CONNECTED: Please connect your wallet before minting tokens')
      }

      if (!routerAddress || !collateralAsset) {
        throw new Error('Required contracts not available')
      }

      // 👇 Use Local Account to sign writes in test mode; otherwise use connected user
      const writeAccount = testLocalAccount ?? user
      const accountAddress = typeof writeAccount === 'string' ? writeAccount : writeAccount?.address

      // 0) Confirm we're on the right node & address
      await assertTestRuntime(config, accountAddress as `0x${string}`)

      // 1) Read token metadata to verify we're on the right asset
      const [decimals, symbol] = await Promise.all([
        readContract(config, { address: collateralAsset, abi: erc20Abi, functionName: 'decimals' }),
        readContract(config, { address: collateralAsset, abi: erc20Abi, functionName: 'symbol' }),
      ])
      console.log('🪙 Collateral:', { collateralAsset, symbol, decimals })

      // 2) Check balance/allowance with proper typing
      const [wethBalance, currentAllowance] = await Promise.all([
        readContract(config, {
          address: collateralAsset,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accountAddress],
        }),
        readContract(config, {
          address: collateralAsset,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [accountAddress, routerAddress],
        }),
      ])

      console.log('📊 Pre-flight:', {
        sender: accountAddress,
        collateralAsset,
        symbol,
        decimals,
        wethBalance: wethBalance.toString(),
        currentAllowance: currentAllowance.toString(),
        equity: equityInCollateralAsset.toString(),
        hasEnoughBalance: wethBalance >= equityInCollateralAsset,
        hasEnoughAllowance: currentAllowance >= equityInCollateralAsset,
      })

      // Early validation - fail fast if insufficient balance
      if (wethBalance < equityInCollateralAsset) {
        throw new Error(
          `INSUFFICIENT_BALANCE: Need ${equityInCollateralAsset} ${symbol}, have ${wethBalance}`
        )
      }

      // Step 1: Preview mint to get expected shares
      const preview = await previewMint(equityInCollateralAsset)
      const expectedShares = preview.shares

      // Step 2: Calculate minShares with slippage protection
      const minShares = (expectedShares * BigInt(10000 - slippageBps)) / 10000n

      // Step 3: Use provided swapContext or create chain-based context
      const finalSwapContext = swapContext || (await generateSwapContext())

      // Step 4: Default maxSwapCost to 5% of equity if not provided
      const finalMaxSwapCost =
        maxSwapCostInCollateralAsset || (equityInCollateralAsset * 500n) / 10000n

      // Step 5: Ensure Router has allowance for collateral — IMPORTANT: pass writeAccount
      await ensureAllowance(equityInCollateralAsset, writeAccount)

      // Step 6: Simulate Router.mint transaction — IMPORTANT: pass writeAccount
      let request
      try {
        const simulation = await simulateContract(config, {
          address: routerAddress,
          abi: leverageRouterAbi,
          functionName: 'mint',
          args: [token, equityInCollateralAsset, minShares, finalMaxSwapCost, finalSwapContext],
          account: writeAccount,
        })
        request = simulation.request
      } catch (err) {
        tryDecodeERC20Error(err)
        throw err
      }

      // Step 7: Execute transaction — request already carries account (Local Account in E2E)
      let hash
      try {
        hash = await writeContract(config, request)
      } catch (err) {
        tryDecodeERC20Error(err)
        throw err
      }

      // Step 8: Wait for confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: TX_SETTINGS.confirmations,
      })

      return {
        hash,
        receipt,
        preview,
        minShares,
        slippageBps,
      }
    },

    onSuccess: ({ hash }) => {
      // Invalidate relevant queries after confirmation
      if (user) {
        queryClient.invalidateQueries({ queryKey: ltKeys.user(token, user) })
        queryClient.invalidateQueries({ queryKey: ['portfolio', user] })
      }
      queryClient.invalidateQueries({ queryKey: ltKeys.supply(token) })

      logWriteSuccess('mint token success', {
        chainId,
        token,
        method: 'mint',
        hash,
      })

      onSuccess?.(hash)
    },

    onError: (error) => {
      // Try to decode custom error if it's a contract revert
      let decodedError: any = null
      try {
        if (error instanceof Error && error.message.includes('0x')) {
          // Extract error signature from message
          const errorMatch = error.message.match(/0x[a-fA-F0-9]+/)
          if (errorMatch) {
            const errorData = errorMatch[0]
            // Try to decode with Router ABI
            decodedError = decodeErrorResult({
              abi: leverageRouterAbi,
              data: errorData as `0x${string}`,
            })
          }
        }
      } catch (decodeErr) {
        console.log('Could not decode error with Router ABI')
      }

      // Log full error details for debugging
      console.error('🔍 Full mint error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCause: error instanceof Error ? error.cause : undefined,
        decodedError,
        stack: error instanceof Error ? error.stack : undefined,
        chainId,
        token,
        testAccount: testLocalAccount?.address,
        userAccount: user,
      })

      const classifiedError = classifyError(error)

      // Only send actionable errors to monitoring
      if (isActionableError(classifiedError)) {
        logWriteError('mint token failed', {
          chainId,
          token,
          method: 'mint',
          error: classifiedError,
        })
      }

      onError?.(classifiedError)
    },
  })

  // Return the mutation hook
  return mutation
}
