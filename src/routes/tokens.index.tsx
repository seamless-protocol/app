import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { FeaturedLeverageTokens } from '@/features/leverage-tokens/components/FeaturedLeverageToken'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { LeverageTokenTable } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { mockLeverageTokenData } from '@/features/leverage-tokens/data/mockData'

export const Route = createFileRoute('/tokens/')({
  component: () => {
    const navigate = useNavigate()

    // Convert our single token mock data to the format expected by the table
    const leverageTokens: Array<LeverageToken> = [
      {
        id: mockLeverageTokenData.token.address, // Use leverage token address as ID
        name: mockLeverageTokenData.token.name,
        collateralAsset: {
          symbol: mockLeverageTokenData.token.collateralAsset.symbol,
          name: mockLeverageTokenData.token.collateralAsset.name,
          address: mockLeverageTokenData.token.collateralAsset.address,
        },
        debtAsset: {
          symbol: mockLeverageTokenData.token.debtAsset.symbol,
          name: mockLeverageTokenData.token.debtAsset.name,
          address: mockLeverageTokenData.token.debtAsset.address,
        },
        tvl: mockLeverageTokenData.keyMetrics.tvl,
        apy: mockLeverageTokenData.apy.total,
        leverage: mockLeverageTokenData.token.leverageRatio,
        supplyCap: mockLeverageTokenData.supply.supplyCap,
        currentSupply: mockLeverageTokenData.supply.currentSupply,
        chainId: mockLeverageTokenData.token.chainId,
        chainName: mockLeverageTokenData.token.chainName,
        chainLogo: mockLeverageTokenData.token.chainLogo,
        baseYield: mockLeverageTokenData.apy.baseYield,
        borrowRate: mockLeverageTokenData.apy.borrowRate,
        rewardMultiplier: mockLeverageTokenData.apy.rewardMultiplier,
      },
    ]

    const handleTokenClick = (token: LeverageToken) => {
      // Navigate to the specific token's page using the new chain ID-based route
      navigate({
        to: '/tokens/$chainId/$id',
        params: { chainId: token.chainId.toString(), id: token.id },
      })
    }

    return (
      <div className="min-h-screen w-full overflow-hidden">
        <div className="w-100 sm:w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 sm:px-4 lg:px-8">
          {/* Featured Leverage Tokens Section */}
          <div className="overflow-hidden w-full p-1">
            <FeaturedLeverageTokens
              tokens={leverageTokens} // Show the single weETH token
              onTokenClick={handleTokenClick}
            />
          </div>

          {/* Leverage Tokens Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-hidden w-full"
          >
            <LeverageTokenTable tokens={leverageTokens} onTokenClick={handleTokenClick} />
          </motion.div>
        </div>
      </div>
    )
  },
})
