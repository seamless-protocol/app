import { useCallback, useMemo, useState } from 'react'
import type { Address, PublicClient } from 'viem'
import { useChainId, useConfig, usePublicClient, useSwitchChain } from 'wagmi'
import { orchestrateMint } from '@/domain/mint'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

export function useMintExecution(params: {
  token: Address
  account?: Address
  inputAsset: Address // collateral asset
  slippageBps: number
}) {
  const { switchChainAsync } = useSwitchChain()
  const activeChainId = useChainId()
  const { token, account, inputAsset, slippageBps } = params
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const config = useConfig()

  const tokenConfig = useMemo(() => {
    const cfg = getLeverageTokenConfig(token)
    if (!cfg) {
      throw new Error(`Leverage token configuration missing for ${token}`)
    }
    return cfg
  }, [token])

  const chainId = tokenConfig.chainId as SupportedChainId
  const chainPublicClient = usePublicClient({ chainId }) as PublicClient | undefined
  const activePublicClient = usePublicClient() as PublicClient | undefined

  const addresses = useMemo(() => getContractAddresses(chainId), [chainId])
  const envRouterV2 = import.meta.env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
  const envManagerV2 = import.meta.env['VITE_MANAGER_V2_ADDRESS'] as Address | undefined
  const multicallExecutorAddress = useMemo(
    () => (addresses.multicallExecutor as Address | undefined) ?? undefined,
    [addresses.multicallExecutor],
  )

  const routerAddressV2 = useMemo(() => {
    // Prefer chain-scoped addresses (respects Tenderly overrides), fallback to env
    return (addresses.leverageRouterV2 as Address | undefined) ?? envRouterV2
  }, [envRouterV2, addresses.leverageRouterV2])

  const managerAddressV2 = useMemo(() => {
    // Prefer chain-scoped addresses (respects Tenderly overrides), fallback to env
    return (addresses.leverageManagerV2 as Address | undefined) ?? envManagerV2
  }, [envManagerV2, addresses.leverageManagerV2])

  const canSubmit = useMemo(() => Boolean(account), [account])

  const mint = useCallback(
    async (equityInInputAsset: bigint) => {
      if (!account) throw new Error('No account')
      setStatus('submitting')
      setError(undefined)
      try {
        if (!tokenConfig.swaps?.debtToCollateral) {
          throw new Error('Router v2 mint requires a debtToCollateral swap configuration')
        }
        if (!routerAddressV2) {
          throw new Error('Router v2 address is required for mint orchestration')
        }
        if (!chainPublicClient) {
          throw new Error('Public client unavailable for leverage token chain')
        }

        const { quote } = createDebtToCollateralQuote({
          chainId,
          routerAddress: routerAddressV2,
          swap: tokenConfig.swaps.debtToCollateral,
          slippageBps,
          getPublicClient: (cid: number): PublicClient | undefined =>
            cid === chainId ? chainPublicClient : undefined,
          // Use the multicall executor as fromAddress; it executes swap calls on-chain
          ...(multicallExecutorAddress ? { fromAddress: multicallExecutorAddress } : {}),
        })

        if (!quote) {
          throw new Error('Quote is required for V2 mint')
        }

        // Ensure wallet is on the correct chain before proceeding
        if (activeChainId !== chainId) {
          try {
            await switchChainAsync({ chainId })
          } catch (_switchErr) {
            const err = new Error(
              `Wrong network: expected ${chainId}, got ${activeChainId}. Please switch in your wallet.`,
            ) as Error & { expectedChainId?: number; actualChainId?: number; code?: number }
            err.expectedChainId = chainId
            err.actualChainId = activeChainId
            // Map to common wallet error code used by our classifier
            err.code = 4902
            throw err
          }
        }

        const { hash } = await orchestrateMint({
          config,
          account,
          token,
          inputAsset,
          equityInInputAsset,
          slippageBps,
          quoteDebtToCollateral: quote,
          ...(routerAddressV2 ? { routerAddressV2 } : {}),
          ...(managerAddressV2 ? { managerAddressV2 } : {}),
          chainId,
        })
        setHash(hash)
        setStatus('pending')
        const receiptClient = (chainPublicClient ?? activePublicClient) as PublicClient | undefined
        await receiptClient?.waitForTransactionReceipt({ hash })
        setStatus('success')
        return hash
      } catch (e: unknown) {
        setError(e as Error)
        setStatus('error')
        throw e
      }
    },
    [
      account,
      activeChainId,
      config,
      token,
      inputAsset,
      slippageBps,
      tokenConfig,
      chainId,
      routerAddressV2,
      managerAddressV2,
      chainPublicClient,
      activePublicClient,
      multicallExecutorAddress,
      switchChainAsync,
    ],
  )

  return {
    mint,
    status,
    hash,
    error,
    canSubmit,
  }
}
