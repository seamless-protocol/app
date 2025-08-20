import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import type { Address } from 'viem'
import { erc20Abi, maxUint256 } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { config } from '@/lib/config/wagmi.config'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { leverageRouterAbi } from '@/lib/contracts/abis/leverageRouter'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { TX_SETTINGS } from '../utils/constants'
import { classifyError, isActionableError } from '../utils/errors'
import { ltKeys } from '../utils/queryKeys'
import { createSwapContext, type SwapContext } from '../utils/swapContext'

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
  const addresses = getContractAddresses(chainId)

  // Get Router and Manager addresses
  const routerAddress = addresses.leverageRouter
  const managerAddress = addresses.leverageManager

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
  const ensureAllowance = async (amount: bigint) => {
    if (!user || !collateralAsset || !routerAddress) {
      throw new Error('Missing user, collateral asset, or router address')
    }

    // Check current allowance
    const currentAllowance = await readContract(config, {
      address: collateralAsset,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [user, routerAddress],
    })

    // If allowance is insufficient, approve max
    if (currentAllowance < amount) {
      const { request } = await simulateContract(config, {
        address: collateralAsset,
        abi: erc20Abi,
        functionName: 'approve',
        args: [routerAddress, maxUint256],
        account: user,
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

    const debtAsset = await readContract(config, {
      address: managerAddress,
      abi: leverageManagerAbi,
      functionName: 'getLeverageTokenDebtAsset',
      args: [token],
    }) as Address

    return createSwapContext(
      collateralAsset,
      debtAsset,
      chainId
    )
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

      // Step 5: Ensure Router has allowance for collateral
      await ensureAllowance(equityInCollateralAsset)

      // Step 6: Simulate Router.mint transaction
      const { request } = await simulateContract(config, {
        address: routerAddress,
        abi: leverageRouterAbi,
        functionName: 'mint',
        args: [
          token,
          equityInCollateralAsset,
          minShares,
          finalMaxSwapCost,
          finalSwapContext,
        ] as any,
        account: user,
      })

      // Step 7: Execute transaction
      const hash = await writeContract(config, request)

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

    onSuccess: ({ hash, preview }) => {
      // Invalidate relevant queries after confirmation
      if (user) {
        queryClient.invalidateQueries({ queryKey: ltKeys.user(token, user) })
        queryClient.invalidateQueries({ queryKey: ['portfolio', user] })
      }
      queryClient.invalidateQueries({ queryKey: ltKeys.supply(token) })

      console.log('[Mint Success]', {
        hash,
        expectedShares: preview.shares.toString(),
        tokenFee: preview.tokenFee.toString(),
        treasuryFee: preview.treasuryFee.toString(),
      })

      onSuccess?.(hash)
    },

    onError: (error) => {
      const classifiedError = classifyError(error)

      // Only send actionable errors to monitoring
      if (isActionableError(classifiedError)) {
        console.error('[Mint Error]', {
          type: classifiedError.type,
          chainId,
          token,
          router: routerAddress,
          error: classifiedError,
        })
      }

      onError?.(classifiedError)
    },
  })

  // Return the mutation hook
  return mutation
}
