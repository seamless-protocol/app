import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getPublicClient, getWalletClient } from '@wagmi/core'
import type { Address } from 'viem'
import { useAccount, useChainId, useConfig } from 'wagmi'
import { type MintParams, type MintResult, mintWithRouter } from '@/domain/mint-with-router'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { classifyError, isActionableError } from '../utils/errors'
import { logWriteError, logWriteSuccess } from '../utils/logger'
import { ltKeys } from '../utils/queryKeys'

export interface UseMintWithRouterParams {
  token: Address
  onSuccess?: (hash: Address) => void
  onError?: (error: unknown) => void
}

export function useMintWithRouter({ token, onSuccess, onError }: UseMintWithRouterParams) {
  const queryClient = useQueryClient()
  const { address: user } = useAccount()
  const chainId = useChainId()
  const config = useConfig()
  const addresses = getContractAddresses(chainId)

  if (!addresses.leverageRouter || !addresses.leverageManager) {
    throw new Error(`Router/Manager contracts not deployed on chain ${chainId}`)
  }

  return useMutation<MintResult, unknown, MintParams>({
    mutationKey: [...ltKeys.token(token), 'mintWithRouter', user],
    mutationFn: async (params) => {
      if (!user)
        throw new Error('WALLET_NOT_CONNECTED: Please connect your wallet before minting tokens')

      const publicClient = getPublicClient(config, { chainId })
      if (!publicClient) throw new Error('Failed to get public client')
      const walletClient = await getWalletClient(config, { chainId, account: user })
      if (!walletClient) throw new Error('Failed to get wallet client')

      const result = await mintWithRouter(
        { publicClient, walletClient },
        { router: addresses.leverageRouter, manager: addresses.leverageManager, token },
        user,
        params,
      )
      return result
    },
    onSuccess: ({ hash }) => {
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
      const classifiedError = classifyError(error)
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
}
