/**
 * Unit tests for executeRedeemV2
 *
 * Tests the standard V2 redeem execution function that calls
 * simulateLeverageRouterV2Redeem and writeLeverageRouterV2Redeem
 */

import type { Address, Hash } from 'viem'
import { base } from 'viem/chains'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { executeRedeemV2 } from '@/domain/redeem/exec/execute.v2'

// Mock the generated contract functions
vi.mock('@/lib/contracts/generated', () => ({
  simulateLeverageRouterV2Redeem: vi.fn(),
  writeLeverageRouterV2Redeem: vi.fn(),
}))

// Import mocked functions for type-safe mocking
import {
  simulateLeverageRouterV2Redeem,
  writeLeverageRouterV2Redeem,
} from '@/lib/contracts/generated'

// Type for V2 swap calls
type V2Call = {
  target: Address
  value: bigint
  data: `0x${string}`
}

describe('executeRedeemV2', () => {
  // Test addresses and values
  const MOCK_CONFIG = {} as Config
  const LEVERAGE_TOKEN: Address = '0x1234567890123456789012345678901234567890'
  const USER_ACCOUNT: Address = '0x2345678901234567890123456789012345678901'
  const MULTICALL_EXECUTOR: Address = '0x3456789012345678901234567890123456789012'
  const ROUTER: Address = '0x4567890123456789012345678901234567890123'
  const SHARES_TO_REDEEM = 1000000000000000000n // 1 token
  const MIN_COLLATERAL = 900000000000000000n // 0.9 tokens (10% slippage)
  const SWAP_CALLS: ReadonlyArray<V2Call> = [] // Empty array for no swaps
  const MOCK_HASH: Hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

  // Store original process.env
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset process.env for each test
    process.env = { ...originalEnv }
    delete process.env['TEST_SKIP_SIMULATE']
  })

  afterAll(() => {
    // Restore original env after all tests
    process.env = originalEnv
  })

  describe('Successful Execution (with simulation)', () => {
    it('should execute redeem with simulation successfully', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(result).toEqual({ hash: MOCK_HASH })
    })

    it('should call simulate with correct parameters', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2Redeem).toHaveBeenCalledTimes(1)
      expect(simulateLeverageRouterV2Redeem).toHaveBeenCalledWith(MOCK_CONFIG, {
        args: mockArgs,
        account: USER_ACCOUNT,
        chainId: base.id,
      })
    })

    it('should call write with simulated request args', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(writeLeverageRouterV2Redeem).toHaveBeenCalledTimes(1)
      expect(writeLeverageRouterV2Redeem).toHaveBeenCalledWith(MOCK_CONFIG, {
        args: mockArgs,
        account: USER_ACCOUNT,
        chainId: base.id,
      })
    })

    it('should include value field when present in simulated request', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockValue = 100000000000000000n // 0.1 ETH
      const mockSimulateRequest = { args: mockArgs, value: mockValue }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(writeLeverageRouterV2Redeem).toHaveBeenCalledWith(MOCK_CONFIG, {
        args: mockArgs,
        account: USER_ACCOUNT,
        value: mockValue,
        chainId: base.id,
      })
    })
  })

  describe('Successful Execution (skip simulation)', () => {
    it('should skip simulation when TEST_SKIP_SIMULATE=1', async () => {
      process.env['TEST_SKIP_SIMULATE'] = '1'

      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2Redeem).not.toHaveBeenCalled()
      expect(writeLeverageRouterV2Redeem).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ hash: MOCK_HASH })
    })

    it('should call write with correct args when skipping simulation', async () => {
      process.env['TEST_SKIP_SIMULATE'] = '1'

      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(writeLeverageRouterV2Redeem).toHaveBeenCalledWith(MOCK_CONFIG, {
        account: USER_ACCOUNT,
        args: [LEVERAGE_TOKEN, SHARES_TO_REDEEM, MIN_COLLATERAL, MULTICALL_EXECUTOR, SWAP_CALLS],
        chainId: base.id,
      })
    })
  })

  describe('Parameter Handling', () => {
    it('should handle different chainIds correctly', async () => {
      const MAINNET_CHAIN_ID = 1
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: MAINNET_CHAIN_ID,
      })

      expect(simulateLeverageRouterV2Redeem).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          chainId: MAINNET_CHAIN_ID,
        }),
      )
      expect(writeLeverageRouterV2Redeem).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          chainId: MAINNET_CHAIN_ID,
        }),
      )
    })

    it('should handle different share amounts correctly', async () => {
      const LARGE_SHARES = 100000000000000000000n // 100 tokens
      const LARGE_MIN_COLLATERAL = 90000000000000000000n // 90 tokens
      const mockArgs = [
        LEVERAGE_TOKEN,
        LARGE_SHARES,
        LARGE_MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: LARGE_SHARES,
        minCollateralForSender: LARGE_MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2Redeem).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([LARGE_SHARES, LARGE_MIN_COLLATERAL]),
        }),
      )
    })

    it('should handle swap calls correctly', async () => {
      const MOCK_SWAP_CALLS: ReadonlyArray<V2Call> = [
        {
          target: '0x1111111111111111111111111111111111111111',
          value: 0n,
          data: '0xabcdef',
        },
      ]
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        MOCK_SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: MOCK_SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(simulateLeverageRouterV2Redeem).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([MOCK_SWAP_CALLS]),
        }),
      )
    })
  })

  describe('Error Handling', () => {
    it('should propagate simulation errors', async () => {
      const simulationError = new Error('Simulation failed: insufficient collateral')
      vi.mocked(simulateLeverageRouterV2Redeem).mockRejectedValueOnce(simulationError)

      await expect(
        executeRedeemV2({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          multicallExecutor: MULTICALL_EXECUTOR,
          swapCalls: SWAP_CALLS,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Simulation failed: insufficient collateral')

      expect(writeLeverageRouterV2Redeem).not.toHaveBeenCalled()
    })

    it('should propagate transaction write errors', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)

      const writeError = new Error('Transaction failed: user rejected')
      vi.mocked(writeLeverageRouterV2Redeem).mockRejectedValueOnce(writeError)

      await expect(
        executeRedeemV2({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          multicallExecutor: MULTICALL_EXECUTOR,
          swapCalls: SWAP_CALLS,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Transaction failed: user rejected')
    })

    it('should propagate write errors when skipping simulation', async () => {
      process.env['TEST_SKIP_SIMULATE'] = '1'

      const writeError = new Error('Transaction failed: insufficient funds')
      vi.mocked(writeLeverageRouterV2Redeem).mockRejectedValueOnce(writeError)

      await expect(
        executeRedeemV2({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          multicallExecutor: MULTICALL_EXECUTOR,
          swapCalls: SWAP_CALLS,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Transaction failed: insufficient funds')
    })

    it('should handle contract revert errors', async () => {
      const revertError = new Error('Contract reverted with reason: SlippageExceeded')
      vi.mocked(simulateLeverageRouterV2Redeem).mockRejectedValueOnce(revertError)

      await expect(
        executeRedeemV2({
          config: MOCK_CONFIG,
          token: LEVERAGE_TOKEN,
          account: USER_ACCOUNT,
          sharesToRedeem: SHARES_TO_REDEEM,
          minCollateralForSender: MIN_COLLATERAL,
          multicallExecutor: MULTICALL_EXECUTOR,
          swapCalls: SWAP_CALLS,
          routerAddress: ROUTER,
          chainId: base.id,
        }),
      ).rejects.toThrow('Contract reverted with reason: SlippageExceeded')
    })
  })

  describe('Return Value', () => {
    it('should return transaction hash in correct format', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(result).toHaveProperty('hash')
      expect(typeof result.hash).toBe('string')
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should only return hash property', async () => {
      const mockArgs = [
        LEVERAGE_TOKEN,
        SHARES_TO_REDEEM,
        MIN_COLLATERAL,
        MULTICALL_EXECUTOR,
        SWAP_CALLS,
      ]
      const mockSimulateRequest = { args: mockArgs }
      vi.mocked(simulateLeverageRouterV2Redeem).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Redeem).mockResolvedValueOnce(MOCK_HASH)

      const result = await executeRedeemV2({
        config: MOCK_CONFIG,
        token: LEVERAGE_TOKEN,
        account: USER_ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: MIN_COLLATERAL,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: SWAP_CALLS,
        routerAddress: ROUTER,
        chainId: base.id,
      })

      expect(Object.keys(result)).toEqual(['hash'])
    })
  })
})
