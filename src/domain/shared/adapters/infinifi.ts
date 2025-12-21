import type { Address, PublicClient } from 'viem'
import { encodeFunctionData, getAddress, isAddressEqual } from 'viem'
import { mainnet } from 'viem/chains'
import {
  abi as infinifiPreviewerAbi,
  code as infinifiPreviewerBytecode,
} from '@/lib/contracts/queries/InfinifiPreviewer'
import infinifiGatewayAbi from './abi/infinifi/InfinifiGateway'
import unstakeAndRedeemHelperAbi from './abi/infinifi/UnstakeAndRedeemHelper'
import { applySlippageFloor, validateSlippage } from './helpers'
import type { QuoteFn } from './types'

const ADDRESSES: Record<number, InfinifiAddresses> = {
  [mainnet.id]: {
    gateway: '0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5',
    unstakeAndRedeemHelper: '0x4f0122D43aB4893d5977FB0358B73CC178339dFE',
    siusd: '0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB',
  },
}

type InfinifiAddresses = {
  gateway: Address
  unstakeAndRedeemHelper: Address
  siusd: Address
}

type PublicClientLike = Pick<PublicClient, 'multicall' | 'readContract'>

export interface InfinifiAdapterOptions {
  publicClient: PublicClientLike
  /** Receiver for minted shares and redeemed assets (typically the router). */
  router: Address
  chainId?: number
  /** Optional per-chain overrides (e.g., forks/Tenderly). */
  overrides?: Partial<InfinifiAddresses>
}

/**
 * Quotes siUSD mint/redeem flows using the ERC-4626 preview functions and
 * returns call sequences to execute the operation on-chain.
 *
 * Supported pairs:
 * - USDC -> siUSD (mint/stake)
 * - siUSD -> USDC (redeem/unstake)
 *
 * The adapter only supports exact-in:
 * - exactIn: deposit/redeem with slippage floor on expected output
 */
export function createInfinifiQuoteAdapter(options: InfinifiAdapterOptions): QuoteFn {
  const { publicClient, router, chainId = mainnet.id, overrides = {} } = options

  const addresses = resolveAddresses(chainId, overrides)
  const normalizedRouter = getAddress(router)

  return async ({ inToken, outToken, amountIn, intent, slippageBps }) => {
    validateSlippage(slippageBps)

    const normalizedIn = getAddress(inToken)
    const normalizedOut = getAddress(outToken)
    const [usdcOnGateway, mintController] = await publicClient.multicall({
      allowFailure: false,
      contracts: [
        {
          address: addresses.gateway,
          abi: infinifiGatewayAbi,
          functionName: 'getAddress',
          args: ['USDC'],
        },
        {
          address: addresses.gateway,
          abi: infinifiGatewayAbi,
          functionName: 'getAddress',
          args: ['mintController'],
        },
      ],
    })
    const normalizedUsdc = getAddress(usdcOnGateway)
    const normalizedMintController = getAddress(mintController)
    const normalizedUnstakeAndRedeemHelper = getAddress(addresses.unstakeAndRedeemHelper)

    const inputIsSiusd = isAddressEqual(normalizedIn, addresses.siusd)
    const outputIsSiusd = isAddressEqual(normalizedOut, addresses.siusd)
    const outputIsUsdc = isAddressEqual(normalizedOut, normalizedUsdc)
    const inputIsUsdc = isAddressEqual(normalizedIn, normalizedUsdc)

    const isMint = outputIsSiusd && inputIsUsdc
    const isRedeem = inputIsSiusd && outputIsUsdc

    if (!isMint && !isRedeem) {
      throw new Error('Infinifi adapter only supports USDC <-> siUSD conversions')
    }

    if (intent === 'exactOut') {
      throw new Error('Infinifi adapter does not support exactOut/withdraw')
    }

    // USDC -> siUSD (stake)
    if (isMint) {
      if (typeof amountIn !== 'bigint') {
        throw new Error('Infinifi exact-in mint requires amountIn')
      }

      const [, sharesOut] = await publicClient.readContract({
        // Deployless call using the previewer bytecode (not deployed on-chain).
        abi: infinifiPreviewerAbi,
        code: infinifiPreviewerBytecode,
        functionName: 'previewDepositFromAsset',
        args: [normalizedMintController, addresses.siusd, amountIn],
      })

      const minOut = applySlippageFloor(sharesOut, slippageBps)
      const calldata = encodeFunctionData({
        abi: infinifiGatewayAbi,
        functionName: 'mintAndStake',
        args: [normalizedRouter, amountIn],
      })

      return {
        out: sharesOut,
        minOut,
        maxIn: amountIn,
        approvalTarget: addresses.gateway,
        calls: [{ target: addresses.gateway, data: calldata, value: 0n }],
      }
    }

    // siUSD -> USDC (unstake and redeem)
    if (typeof amountIn !== 'bigint') {
      throw new Error('Infinifi exact-in redeem requires amountIn')
    }
    const [, usdcOut] = await publicClient.readContract({
      // Deployless call using the previewer bytecode (not deployed on-chain).
      abi: infinifiPreviewerAbi,
      code: infinifiPreviewerBytecode,
      functionName: 'previewRedeemToAsset',
      args: [normalizedUnstakeAndRedeemHelper, amountIn],
    })

    // siUSD -> USDC: unstake then redeem via helper
    const minOut = applySlippageFloor(usdcOut, slippageBps)
    const unstakeAndRedeemCalldata = encodeFunctionData({
      abi: unstakeAndRedeemHelperAbi,
      functionName: 'unstakeAndRedeem',
      args: [amountIn],
    })

    return {
      out: usdcOut,
      minOut,
      maxIn: amountIn,
      approvalTarget: normalizedUnstakeAndRedeemHelper,
      calls: [
        { target: normalizedUnstakeAndRedeemHelper, data: unstakeAndRedeemCalldata, value: 0n },
      ],
    }
  }
}

function resolveAddresses(
  chainId: number,
  overrides: Partial<InfinifiAddresses>,
): InfinifiAddresses {
  const defaults = ADDRESSES[chainId]
  if (!defaults) {
    throw new Error(`Infinifi adapter unsupported chain: ${chainId}`)
  }
  return {
    gateway: getAddress(overrides.gateway ?? defaults.gateway),
    unstakeAndRedeemHelper: getAddress(
      overrides.unstakeAndRedeemHelper ?? defaults.unstakeAndRedeemHelper,
    ),
    siusd: getAddress(overrides.siusd ?? defaults.siusd),
  }
}
