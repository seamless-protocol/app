/**
 * Unit tests for executeRedeemWithVelora
 *
 * Tests the Velora-specific redeem execution function that calls
 * simulateLeverageRouterV2RedeemWithVelora and writeLeverageRouterV2RedeemWithVelora
 */

import type { Address, Hash } from 'viem'
import { base } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { executeRedeemWithVelora } from '@/domain/redeem/exec/execute.velora'

// Mock the generated contract functions
vi.mock('@/lib/contracts/generated', () => ({
  simulateLeverageRouterV2RedeemWithVelora: vi.fn(),
  writeLeverageRouterV2RedeemWithVelora: vi.fn(),
}))

// Import mocked functions for type-safe mocking
import {
  simulateLeverageRouterV2RedeemWithVelora,
  writeLeverageRouterV2RedeemWithVelora,
} from '@/lib/contracts/generated'

describe('executeRedeemWithVelora', () => {
  // Test addresses and values
  const MOCK_CONFIG = {} as Config
  const LEVERAGE_TOKEN: Address = '0x1234567890123456789012345678901234567890'
  const USER_ACCOUNT: Address = '0x2345678901234567890123456789012345678901'
  const VELORA_ADAPTER: Address = '0x3456789012345678901234567890123456789012'
  const AUGUSTUS: Address = '0x4567890123456789012345678901234567890123'
  const ROUTER: Address = '0x5678901234567890123456789012345678901234'
  const SHARES_TO_REDEEM = 1000000000000000000n // 1 token
  const MIN_COLLATERAL = 900000000000000000n // 0.9 tokens (10% slippage)
  const SWAP_DATA: `0x${string}` = '0xdeadbeef'
  const OFFSETS = {
    exactAmount: 132n,
    limitAmount: 100n,
    quotedAmount: 164n,
  }
  const MOCK_HASH: Hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Execution', () => {
    it('should execute redeem with velora successfully', async () => {
      // Mock successful simulation
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)

      // Mock successful write
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(result).toEqual({ hash: MOCK_HASH })
    })

    it('should call simulate with correct parameters', async () => {
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2RedeemWithVelora).toHaveBeenCalledTimes(1)
      expect(simulateLeverageRouterV2RedeemWithVelora).toHaveBeenCalledWith(MOCK_CONFIG, {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
        account: USER_ACCOUNT,
        chainId: base.id,
      })
    })

    it('should call write with simulated request', async () => {
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(writeLeverageRouterV2RedeemWithVelora).toHaveBeenCalledTimes(1)
      expect(writeLeverageRouterV2RedeemWithVelora).toHaveBeenCalledWith(
        MOCK_CONFIG,
        mockSimulateRequest,
      )
    })
  })

  describe('Parameter Handling', () => {
    it('should handle different chainIds correctly', async () => {
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      const MAINNET_CHAIN_ID = 1

      await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: MAINNET_CHAIN_ID,
      })

      expect(simulateLeverageRouterV2RedeemWithVelora).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          chainId: MAINNET_CHAIN_ID,
        }),
      )
    })

    it('should handle different share amounts correctly', async () => {
      const LARGE_SHARES = 100000000000000000000n // 100 tokens
      const LARGE_MIN_COLLATERAL = 90000000000000000000n // 90 tokens

      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          LARGE_SHARES,
          LARGE_MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: LARGE_SHARES,
        minCollateralForSender: LARGE_MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2RedeemWithVelora).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([LARGE_SHARES, LARGE_MIN_COLLATERAL]),
        }),
      )
    })

    it('should pass velora-specific parameters correctly', async () => {
      const CUSTOM_OFFSETS = {
        exactAmount: 200n,
        limitAmount: 150n,
        quotedAmount: 250n,
      }
      const CUSTOM_SWAP_DATA: `0x${string}` = '0x1234567890abcdef'

      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          CUSTOM_OFFSETS,
          CUSTOM_SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: CUSTOM_OFFSETS,
        swapData: CUSTOM_SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2RedeemWithVelora).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([CUSTOM_OFFSETS, CUSTOM_SWAP_DATA]),
        }),
      )
    })
  })

  describe('Error Handling', () => {
    it('should propagate simulation errors', async () => {
      const simulationError = new Error('Simulation failed: insufficient collateral')
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockRejectedValueOnce(simulationError)

      await expect(
        executeRedeemWithVelora({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          veloraAdapter: VELORA_ADAPTER,
          augustus: AUGUSTUS,
          offsets: OFFSETS,
          swapData: SWAP_DATA,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Simulation failed: insufficient collateral')

      expect(writeLeverageRouterV2RedeemWithVelora).not.toHaveBeenCalled()
    })

    it('should propagate transaction write errors', async () => {
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)

      const writeError = new Error('Transaction failed: user rejected')
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockRejectedValueOnce(writeError)

      await expect(
        executeRedeemWithVelora({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          veloraAdapter: VELORA_ADAPTER,
          augustus: AUGUSTUS,
          offsets: OFFSETS,
          swapData: SWAP_DATA,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Transaction failed: user rejected')
    })

    it('should handle contract revert errors', async () => {
      const revertError = new Error('Contract reverted with reason: SlippageExceeded')
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockRejectedValueOnce(revertError)

      await expect(
        executeRedeemWithVelora({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          veloraAdapter: VELORA_ADAPTER,
          augustus: AUGUSTUS,
          offsets: OFFSETS,
          swapData: SWAP_DATA,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Contract reverted with reason: SlippageExceeded')
    })
  })

  describe('Return Value', () => {
    it('should return transaction hash in correct format', async () => {
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(result).toHaveProperty('hash')
      expect(typeof result.hash).toBe('string')
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should only return hash property', async () => {
      const mockSimulateRequest = {
        args: [
          LEVERAGE_TOKEN,
          SHARES_TO_REDEEM,
          MIN_COLLATERAL,
          VELORA_ADAPTER,
          AUGUSTUS,
          OFFSETS,
          SWAP_DATA,
        ],
      }
      vi.mocked(simulateLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2RedeemWithVelora).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemWithVelora({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: OFFSETS,
        swapData: SWAP_DATA,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(Object.keys(result)).toEqual(['hash'])
    })
  })
})
