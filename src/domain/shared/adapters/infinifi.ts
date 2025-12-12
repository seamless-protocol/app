import type { Address, PublicClient } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, isAddressEqual } from 'viem'
import { mainnet } from 'viem/chains'
import {
  abi as infinifiPreviewerAbi,
  code as infinifiPreviewerBytecode,
} from '@/lib/contracts/queries/InfinifiPreviewer'
import infinifiGatewayAbi from './abi/infinifi/InfinifiGateway'
import siUSDAbi from './abi/infinifi/siUSD'
import { applySlippageFloor, DEFAULT_SLIPPAGE_BPS, validateSlippage } from './helpers'
import type { QuoteFn } from './types'

const ADDRESSES: Record<number, InfinifiAddresses> = {
  [mainnet.id]: {
    gateway: '0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5',
    iusd: '0x48f9e38f3070AD8945DFEae3FA70987722E3D89c',
    siusd: '0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB',
  },
}

type InfinifiAddresses = {
  gateway: Address
  iusd: Address
  siusd: Address
}

type PublicClientLike = Pick<PublicClient, 'readContract'>

export interface InfinifiAdapterOptions {
  publicClient: PublicClientLike
  /** Receiver for minted shares and redeemed assets (typically the router). */
  router: Address
  chainId?: number
  slippageBps?: number
  /** Optional per-chain overrides (e.g., forks/Tenderly). */
  overrides?: Partial<InfinifiAddresses>
}

/**
 * Quotes siUSD mint/redeem flows using the ERC-4626 preview functions and
 * returns call sequences to execute the operation on-chain.
 *
 * Supported pairs:
 * - iUSD -> siUSD (mint/stake)
 * - siUSD -> iUSD (redeem/unstake)
 *
 * The adapter only supports exact-in:
 * - exactIn: deposit/redeem with slippage floor on expected output
 */
export function createInfinifiQuoteAdapter(options: InfinifiAdapterOptions): QuoteFn {
  const {
    publicClient,
    router,
    chainId = mainnet.id,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    overrides = {},
  } = options

  validateSlippage(slippageBps)
  const addresses = resolveAddresses(chainId, overrides)
  const normalizedRouter = getAddress(router)

  return async ({ inToken, outToken, amountIn, intent }) => {
    const normalizedIn = getAddress(inToken)
    const normalizedOut = getAddress(outToken)
    const usdcOnGateway = (await publicClient.readContract({
      address: addresses.gateway,
      abi: infinifiGatewayAbi,
      functionName: 'getAddress',
      args: ['USDC'],
    })) as Address
    const mintController = (await publicClient.readContract({
      address: addresses.gateway,
      abi: infinifiGatewayAbi,
      functionName: 'getAddress',
      args: ['mintController'],
    })) as Address
    const redeemController = (await publicClient.readContract({
      address: addresses.gateway,
      abi: infinifiGatewayAbi,
      functionName: 'getAddress',
      args: ['redeemController'],
    })) as Address
    const normalizedUsdc = getAddress(usdcOnGateway)
    const normalizedMintController = getAddress(mintController)
    const normalizedRedeemController = getAddress(redeemController)

    const inputIsSiusd = isAddressEqual(normalizedIn, addresses.siusd)
    const outputIsSiusd = isAddressEqual(normalizedOut, addresses.siusd)
    const outputIsIusd = isAddressEqual(normalizedOut, addresses.iusd)
    const outputIsUsdc = isAddressEqual(normalizedOut, normalizedUsdc)

    const isMint =
      outputIsSiusd &&
      (isAddressEqual(normalizedIn, addresses.iusd) || isAddressEqual(normalizedIn, normalizedUsdc))
    const isRedeem = inputIsSiusd && (outputIsIusd || outputIsUsdc)

    if (!isMint && !isRedeem) {
      throw new Error('Infinifi adapter only supports iUSD <-> siUSD conversions')
    }

    if (intent === 'exactOut') {
      throw new Error('Infinifi adapter does not support exactOut/withdraw')
    }

    // iUSD/USDC -> siUSD (stake)
    if (isMint) {
      const inputIsUsdc = isAddressEqual(normalizedIn, normalizedUsdc)
      const inputIsIusd = isAddressEqual(normalizedIn, addresses.iusd)
      if (!inputIsUsdc && !inputIsIusd) {
        throw new Error('Infinifi mint only supports USDC or iUSD as input')
      }
      if (typeof amountIn !== 'bigint') {
        throw new Error('Infinifi exact-in mint requires amountIn')
      }
      let iusdAmount: bigint
      let sharesOut: bigint

      if (inputIsUsdc) {
        const [receiptAmount, previewSharesOut] = await publicClient.readContract({
          // Deployless call using the previewer bytecode (not deployed on-chain).
          abi: infinifiPreviewerAbi,
          code: infinifiPreviewerBytecode,
          functionName: 'previewDepositFromAsset',
          args: [normalizedMintController, addresses.siusd, amountIn],
        })

        iusdAmount = receiptAmount
        sharesOut = previewSharesOut
      } else {
        iusdAmount = amountIn
        sharesOut = (await publicClient.readContract({
          address: addresses.siusd,
          abi: siUSDAbi,
          functionName: 'previewDeposit',
          args: [iusdAmount],
        })) as bigint
      }
      const minOut = applySlippageFloor(sharesOut, slippageBps)
      const calldata = encodeFunctionData({
        abi: infinifiGatewayAbi,
        functionName: inputIsUsdc ? 'mintAndStake' : 'stake',
        args: [normalizedRouter, amountIn],
      })

      return {
        out: sharesOut,
        minOut,
        approvalTarget: addresses.gateway,
        calls: [{ target: addresses.gateway, data: calldata, value: 0n }],
      }
    }

    // siUSD -> iUSD/USDC (unstake, optional redeem)
    if (typeof amountIn !== 'bigint') {
      throw new Error('Infinifi exact-in redeem requires amountIn')
    }
    if (outputIsIusd) {
      const iusdOut = await publicClient.readContract({
        address: addresses.siusd,
        abi: siUSDAbi,
        functionName: 'previewRedeem',
        args: [amountIn],
      })
      const minOut = applySlippageFloor(iusdOut, slippageBps)
      const calldata = encodeFunctionData({
        abi: infinifiGatewayAbi,
        functionName: 'unstake',
        args: [normalizedRouter, amountIn],
      })

      return {
        out: iusdOut,
        minOut,
        approvalTarget: addresses.gateway,
        calls: [{ target: addresses.gateway, data: calldata, value: 0n }],
      }
    }

    // siUSD -> USDC: unstake to iUSD then redeem via gateway
    const [iusdOut, usdcOut] = await publicClient.readContract({
      // Deployless call using the previewer bytecode (not deployed on-chain).
      abi: infinifiPreviewerAbi,
      code: infinifiPreviewerBytecode,
      functionName: 'previewRedeemToAsset',
      args: [normalizedRedeemController, addresses.siusd, amountIn],
    })
    const minOut = applySlippageFloor(usdcOut, slippageBps)
    const unstakeCalldata = encodeFunctionData({
      abi: infinifiGatewayAbi,
      functionName: 'unstake',
      args: [normalizedRouter, amountIn],
    })
    const approveIusdCalldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [addresses.gateway, iusdOut],
    })
    const redeemCalldata = encodeFunctionData({
      abi: infinifiGatewayAbi,
      functionName: 'redeem',
      args: [normalizedRouter, iusdOut, minOut],
    })

    return {
      out: usdcOut,
      minOut,
      approvalTarget: addresses.gateway,
      calls: [
        { target: addresses.gateway, data: unstakeCalldata, value: 0n },
        { target: addresses.iusd, data: approveIusdCalldata, value: 0n },
        { target: addresses.gateway, data: redeemCalldata, value: 0n },
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
    iusd: getAddress(overrides.iusd ?? defaults.iusd),
    siusd: getAddress(overrides.siusd ?? defaults.siusd),
  }
}
