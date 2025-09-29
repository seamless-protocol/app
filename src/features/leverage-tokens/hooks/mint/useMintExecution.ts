import { useCallback, useMemo, useState } from 'react'
import type { Address, PublicClient } from 'viem'
import { useConfig, usePublicClient, useSwitchChain } from 'wagmi'
import { orchestrateMint } from '@/domain/mint'
import { RouterVersion } from '@/domain/mint/planner/types'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { detectRouterVersion } from '@/domain/mint/utils/detectVersion'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

export function useMintExecution(params: {
  token: Address
  account?: Address
  inputAsset: Address // collateral asset
  slippageBps: number
  targetChainId: number
}) {
  const { switchChainAsync } = useSwitchChain()
  const { token, account, inputAsset, slippageBps, targetChainId } = params
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
  const envMulticallExecutor = import.meta.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] as
    | Address
    | undefined

  const routerAddressV2 = useMemo(() => {
    return envRouterV2 ?? (addresses.leverageRouterV2 as Address | undefined)
  }, [envRouterV2, addresses.leverageRouterV2])

  const managerAddressV2 = useMemo(() => {
    return envManagerV2 ?? (addresses.leverageManagerV2 as Address | undefined)
  }, [envManagerV2, addresses.leverageManagerV2])

  const multicallExecutorAddress = useMemo(() => {
    return envMulticallExecutor ?? (addresses.multicall as Address | undefined)
  }, [envMulticallExecutor, addresses.multicall])

  const canSubmit = useMemo(() => Boolean(account), [account])

  const mint = useCallback(
    async (equityInInputAsset: bigint) => {
      if (!account) throw new Error('No account')
      setStatus('submitting')
      setError(undefined)
      try {
        const version = detectRouterVersion()
        let quoteDebtToCollateral: QuoteFn | undefined

        if (version === RouterVersion.V2) {
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
            ...(multicallExecutorAddress ? { fromAddress: multicallExecutorAddress } : {}),
          })

          quoteDebtToCollateral = quote
        }

        if (chainId !== targetChainId) {
          await switchChainAsync({ chainId: targetChainId })
        }

        const { hash } = await orchestrateMint({
          config,
          account,
          token,
          inputAsset,
          equityInInputAsset,
          slippageBps,
          ...(quoteDebtToCollateral ? { quoteDebtToCollateral } : {}),
          ...(routerAddressV2 ? { routerAddressV2 } : {}),
          ...(managerAddressV2 ? { managerAddressV2 } : {}),
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
      targetChainId,
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
