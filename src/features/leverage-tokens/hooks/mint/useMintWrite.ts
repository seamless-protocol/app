import { useMutation } from '@tanstack/react-query'
import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { MintPlanV2 } from '@/domain/mint/planner/plan.v2'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'
import { captureTxError } from '@/lib/observability/sentry'

class HandledTxError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'HandledTxError'
    // Preserve original error as cause when provided (TS may not have type for cause)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (options && (options as any).cause !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      ;(this as any).cause = (options as any).cause
    }
  }
}

type Args = {
  config: Config
  chainId: SupportedChainId
  account: Address
  token: Address
  plan: Pick<
    MintPlanV2,
    | 'inputAsset'
    | 'equityInInputAsset'
    | 'minShares'
    | 'calls'
    | 'expectedTotalCollateral'
    | 'expectedDebt'
    | 'flashLoanAmount'
  >
}

export function useMintWrite(key?: {
  chainId: SupportedChainId
  token: Address
  account: Address
  plan?: Args['plan']
}) {
  // No internal chain switching; caller ensures correct network.

  const mutationKey = key
    ? ltKeys.mutations.mintWrite({
        chainId: key.chainId,
        addr: key.token,
        account: key.account,
        planSig: makePlanSig(key.plan),
      })
    : (['leverage-tokens', 'mutate', 'mint'] as const)

  return useMutation<Hash, Error, Args>({
    mutationKey,
    mutationFn: async ({ config, chainId, account: _account, token, plan }) => {
      const { multicallExecutor } = getContractAddresses(chainId)
      const executor = multicallExecutor as Address

      let request: Parameters<typeof writeLeverageRouterV2Deposit>[1]
      try {
        const sim = await simulateLeverageRouterV2Deposit(config, {
          args: [
            token,
            plan.equityInInputAsset,
            plan.flashLoanAmount ?? plan.expectedDebt,
            plan.minShares,
            executor,
            plan.calls,
          ],
          account: _account,
          chainId,
        })
        request = sim.request
      } catch (error) {
        try {
          ;(error as Record<string, unknown>)['__sentryCaptured'] = true
          captureTxError({
            flow: 'mint',
            chainId,
            token,
            inputAsset: plan.inputAsset,
            amountIn: plan.equityInInputAsset.toString(),
            expectedOut: plan.minShares.toString(),
            error,
          })
        } catch {}
        throw new HandledTxError(
          error instanceof Error ? error.message : 'Mint simulation failed',
          { cause: error },
        )
      }

      try {
        const hash = await writeLeverageRouterV2Deposit(config, request)
        return hash
      } catch (error) {
        try {
          ;(error as Record<string, unknown>)['__sentryCaptured'] = true
          captureTxError({
            flow: 'mint',
            chainId,
            token,
            inputAsset: plan.inputAsset,
            amountIn: plan.equityInInputAsset.toString(),
            expectedOut: plan.minShares.toString(),
            error,
          })
        } catch {}
        throw new HandledTxError(error instanceof Error ? error.message : 'Mint submit failed', {
          cause: error,
        })
      }
    },
    onError: (error, variables) => {
      try {
        const err = error as unknown as { [key: string]: unknown }
        if (err['__sentryCaptured']) return
        const { chainId, token, plan } = variables
        captureTxError({
          flow: 'mint',
          chainId,
          token,
          inputAsset: plan?.inputAsset,
          amountIn: plan?.equityInInputAsset?.toString?.(),
          expectedOut: plan?.minShares?.toString?.(),
          error,
        })
      } catch {
        // best-effort only
      }
    },
  })
}

function makePlanSig(plan?: Args['plan']): string {
  try {
    if (!plan) return 'na'
    const eq = plan.equityInInputAsset.toString()
    const debt = plan.expectedDebt.toString()
    const min = plan.minShares.toString()
    const len = plan.calls?.length ?? 0
    const c0 = plan.calls?.[0]
    const c0sig = c0 ? `${c0.target}:${String(c0.data).slice(0, 10)}:${c0.value.toString()}` : 'na'
    return `eq:${eq}|debt:${debt}|min:${min}|calls:${len}|c0:${c0sig}`
  } catch {
    return 'plan'
  }
}
