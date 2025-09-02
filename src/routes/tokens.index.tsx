import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { EthereumLogo } from '@/components/icons/logos'
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
        id: 'weeth-weth-17x',
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
      // Add a second mock token for demonstration
      {
        id: 'usdc-dai-10x',
        name: 'USDC / DAI 10x Leverage Token',
        collateralAsset: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' as `0x${string}`,
        },
        debtAsset: {
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as `0x${string}`,
        },
        tvl: 2500000,
        apy: 12.8,
        leverage: 10,
        supplyCap: 500000,
        currentSupply: 320000,
        chainId: 1,
        chainName: 'Ethereum',
        chainLogo: EthereumLogo,
        baseYield: 7.2,
        borrowRate: -2.1,
        rewardMultiplier: 1.2,
      },
      // Add a third mock token
      {
        id: 'wbtc-eth-15x',
        name: 'WBTC / ETH 15x Leverage Token',
        collateralAsset: {
          symbol: 'WBTC',
          name: 'Wrapped Bitcoin',
          address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as `0x${string}`,
        },
        debtAsset: {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
        },
        tvl: 4200000,
        apy: 18.5,
        leverage: 15,
        supplyCap: 800000,
        currentSupply: 650000,
        chainId: 1,
        chainName: 'Ethereum',
        chainLogo: EthereumLogo,
        baseYield: 9.8,
        borrowRate: -3.5,
        rewardMultiplier: 1.8,
      },
    ]

    const handleTokenClick = (_token: LeverageToken) => {
      // For now, navigate to the weETH token page since that's what we have implemented
      // In the future, this would navigate to the specific token's page
      navigate({ to: '/tokens/$id', params: { id: '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' } })
    }

    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <div className="w-100 sm:w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 sm:px-4 lg:px-8">
          {/* Featured Leverage Tokens Section */}
          <div className="overflow-x-hidden w-full">
            <FeaturedLeverageTokens
              tokens={leverageTokens.slice(0, 3)} // Show top 3 tokens
              onTokenClick={handleTokenClick}
            />
          </div>

          {/* Leverage Tokens Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-x-hidden w-full"
          >
            <LeverageTokenTable tokens={leverageTokens} onTokenClick={handleTokenClick} />
          </motion.div>
        </div>
      </div>
    )
  },
})
