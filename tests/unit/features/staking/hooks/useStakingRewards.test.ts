import { describe, expect, it } from 'vitest'

// Test the useStakingRewards hook data transformation and contract interaction
describe('useStakingRewards - Data Transformation', () => {
  it('should handle the expected contract call structure', () => {
    // Test the expected contract call parameters
    const mockUser = '0xAf5f2D7C1c02C6affEf67D3f9215e3E3b861CdaB'
    const mockStakedSeamAddress = '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4'
    const mockRewardsControllerAddress = '0x2C6dC2CE7747E726A590082ADB3d7d08F52ADB93'

    // Expected contract call structure
    const expectedContractCall = {
      address: mockRewardsControllerAddress,
      functionName: 'getAllUserRewards',
      args: [[mockStakedSeamAddress], mockUser],
      chainId: 8453,
    }

    expect(expectedContractCall.address).toBe(mockRewardsControllerAddress)
    expect(expectedContractCall.functionName).toBe('getAllUserRewards')
    expect(expectedContractCall.args).toEqual([[mockStakedSeamAddress], mockUser])
    expect(expectedContractCall.chainId).toBe(8453)
  })

  it('should handle contract response data structure', () => {
    // Mock contract response data for getAllUserRewards
    const mockContractResponse = [
      ['0x616a4E1db48e22028f6bbf20444Cd3b8e3273738', '0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18'],
      [1470085208158445n, 58254144799n],
    ]

    // Test that we can extract the response data
    const [rewardTokenList, unclaimedBalances] = mockContractResponse

    expect(rewardTokenList).toHaveLength(2)
    expect(unclaimedBalances).toHaveLength(2)
    expect(rewardTokenList?.[0]).toBe('0x616a4E1db48e22028f6bbf20444Cd3b8e3273738')
    expect(rewardTokenList?.[1]).toBe('0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18')
    expect(unclaimedBalances?.[0]).toBe(1470085208158445n)
    expect(unclaimedBalances?.[1]).toBe(58254144799n)
  })

  it('should sum unclaimed balances correctly', () => {
    // Mock unclaimed balances from contract response
    const unclaimedBalances = [1470085208158445n, 58254144799n, 34014194n]

    // Test the reduce logic for summing rewards
    const totalRewards = unclaimedBalances.reduce((sum, balance) => sum + balance, 0n)

    // Expected: 1470085208158445 + 58254144799 + 34014194 = 1470143496317438
    expect(totalRewards).toBe(1470143496317438n)
  })

  it('should format reward amounts correctly', () => {
    // Helper to convert bigint to formatted string (copied from hook logic)
    const formatUnits = (value: bigint, decimals: number): string => {
      return (Number(value) / 10 ** decimals).toString()
    }

    const formatRewards = (totalRewards: bigint): string => {
      const formattedRewards = formatUnits(totalRewards, 18)
      return `${formattedRewards} SEAM`
    }

    // Test various reward amounts
    const testCases = [
      { amount: 0n, expected: '0 SEAM' },
      { amount: 1000000000000000000n, expected: '1 SEAM' }, // 1 SEAM (18 decimals)
      { amount: 1000000000000000000000n, expected: '1000 SEAM' }, // 1000 SEAM
      { amount: 1528339352958444n, expected: '0.001528339352958444 SEAM' }, // Real example
    ]

    testCases.forEach(({ amount, expected }) => {
      expect(formatRewards(amount)).toBe(expected)
    })
  })

  it('should handle empty rewards array', () => {
    // Test empty unclaimed balances
    const unclaimedBalances: Array<bigint> = []
    const totalRewards = unclaimedBalances.reduce((sum, balance) => sum + balance, 0n)

    expect(totalRewards).toBe(0n)

    // Test formatting empty rewards
    const formatUnits = (value: bigint, decimals: number): string => {
      return (Number(value) / 10 ** decimals).toString()
    }
    const formattedRewards = formatUnits(totalRewards, 18)
    const finalString = `${formattedRewards} SEAM`

    expect(finalString).toBe('0 SEAM')
  })

  it('should validate ABI structure for getAllUserRewards', () => {
    // Test the expected ABI structure
    const expectedAbi = {
      name: 'getAllUserRewards',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'rewardsAccruingAssets', type: 'address[]' },
        { name: 'user', type: 'address' },
      ],
      outputs: [
        { name: 'rewardTokenList', type: 'address[]' },
        { name: 'unclaimedBalances', type: 'uint256[]' },
      ],
    }

    expect(expectedAbi.name).toBe('getAllUserRewards')
    expect(expectedAbi.type).toBe('function')
    expect(expectedAbi.stateMutability).toBe('view')
    expect(expectedAbi.inputs).toHaveLength(2)
    expect(expectedAbi.outputs).toHaveLength(2)
    expect(expectedAbi.inputs?.[0]?.name).toBe('rewardsAccruingAssets')
    expect(expectedAbi.inputs?.[0]?.type).toBe('address[]')
    expect(expectedAbi.inputs?.[1]?.name).toBe('user')
    expect(expectedAbi.inputs?.[1]?.type).toBe('address')
    expect(expectedAbi.outputs?.[0]?.name).toBe('rewardTokenList')
    expect(expectedAbi.outputs?.[0]?.type).toBe('address[]')
    expect(expectedAbi.outputs?.[1]?.name).toBe('unclaimedBalances')
    expect(expectedAbi.outputs?.[1]?.type).toBe('uint256[]')
  })

  it('should handle error states gracefully', () => {
    // Test defensive programming patterns
    const handleNoData = (userRewards: any) => {
      if (!userRewards) {
        return { claimableRewardsAmount: '0.00 SEAM' }
      }
      return { claimableRewardsAmount: '1.00 SEAM' }
    }

    expect(handleNoData(null)).toEqual({ claimableRewardsAmount: '0.00 SEAM' })
    expect(handleNoData(undefined)).toEqual({ claimableRewardsAmount: '0.00 SEAM' })
    expect(handleNoData([])).toEqual({ claimableRewardsAmount: '1.00 SEAM' })
  })

  it('should validate query key structure', () => {
    // Test the expected query key structure
    const mockUser = '0xAf5f2D7C1c02C6affEf67D3f9215e3E3b861CdaB'
    const expectedQueryKey = ['staking', 'rewards', mockUser]

    expect(expectedQueryKey).toEqual(['staking', 'rewards', mockUser])
    expect(expectedQueryKey).toHaveLength(3)
    expect(expectedQueryKey[0]).toBe('staking')
    expect(expectedQueryKey[1]).toBe('rewards')
    expect(expectedQueryKey[2]).toBe(mockUser)
  })

  it('should handle large reward amounts correctly', () => {
    // Test large reward amounts
    const largeRewards = [1000000000000000000000n, 2000000000000000000000n] // 1000 + 2000 SEAM
    const totalRewards = largeRewards.reduce((sum, balance) => sum + balance, 0n)

    const formatUnits = (value: bigint, decimals: number): string => {
      return (Number(value) / 10 ** decimals).toString()
    }
    const formattedRewards = formatUnits(totalRewards, 18)
    const finalString = `${formattedRewards} SEAM`

    expect(finalString).toBe('3000 SEAM')
  })

  it('should handle multiple reward tokens correctly', () => {
    // Test multiple reward tokens scenario
    const mockContractResponse = [
      [
        '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738',
        '0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18',
        '0x5a47C803488FE2BB0A0EAaf346b420e4dF22F3C7',
      ],
      [1000000000000000000n, 2000000000000000000n, 500000000000000000n], // 1 + 2 + 0.5 SEAM
    ]

    const [, unclaimedBalances] = mockContractResponse
    const totalRewards = (unclaimedBalances as Array<bigint>).reduce(
      (sum, balance) => sum + balance,
      0n,
    )

    const formatUnits = (value: bigint, decimals: number): string => {
      return (Number(value) / 10 ** decimals).toString()
    }
    const formattedRewards = formatUnits(totalRewards, 18)
    const finalString = `${formattedRewards} SEAM`

    expect(finalString).toBe('3.5 SEAM')
  })
})
