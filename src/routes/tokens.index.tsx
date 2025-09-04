import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { FeaturedLeverageTokens } from '@/features/leverage-tokens/components/FeaturedLeverageToken'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { LeverageTokenTable } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { mockAPY, mockKeyMetrics, mockSupply } from '@/features/leverage-tokens/data/mockData'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'

export const Route = createFileRoute('/tokens/')({
  component: () => {
    const navigate = useNavigate()

    // Convert leverage token configs to the format expected by the table
    const leverageTokens: Array<LeverageToken> = getAllLeverageTokenConfigs().map((config) => ({
      id: config.address, // Use leverage token address as ID
      name: config.name,
      collateralAsset: {
        symbol: config.collateralAsset.symbol,
        name: config.collateralAsset.name,
        address: config.collateralAsset.address,
      },
      debtAsset: {
        symbol: config.debtAsset.symbol,
        name: config.debtAsset.name,
        address: config.debtAsset.address,
      },
      tvl: mockKeyMetrics.tvl,
      apy: mockAPY.total,
      leverage: config.leverageRatio,
      supplyCap: mockSupply.supplyCap,
      currentSupply: mockSupply.currentSupply,
      chainId: config.chainId,
      chainName: config.chainName,
      chainLogo: config.chainLogo,
      baseYield: mockAPY.baseYield,
      borrowRate: mockAPY.borrowRate,
      rewardMultiplier: mockAPY.rewardMultiplier,
    }))

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
