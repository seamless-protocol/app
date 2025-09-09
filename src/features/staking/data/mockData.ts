export interface StakingMockData {
  currentHoldings: {
    amount: string
    usdValue: string
  }
  claimableRewards: {
    amount: string
    description: string
  }
  keyMetrics: {
    totalStaked: {
      amount: string
      usdValue: string
    }
    totalAPR: {
      percentage: string
    }
    unstakingCooldown: {
      days: string
    }
  }
}

export const stakingMockData: StakingMockData = {
  currentHoldings: {
    amount: "0.00 stkSEAM",
    usdValue: "$0.00"
  },
  claimableRewards: {
    amount: "$0.00",
    description: "Stake SEAM to receive rewards"
  },
  keyMetrics: {
    totalStaked: {
      amount: "3.70M SEAM",
      usdValue: "$7.96M"
    },
    totalAPR: {
      percentage: "35.72%",
    },
    unstakingCooldown: {
      days: "7 days"
    }
  }
}
