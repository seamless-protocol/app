import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { FeaturedLeverageTokens } from '@/features/leverage-tokens/components/FeaturedLeverageToken'
import {
  type LeverageToken,
  LeverageTokenTable,
} from '@/features/leverage-tokens/components/leverage-token-table'
import { useLeverageTokensTableData } from '@/features/leverage-tokens/hooks/useLeverageTokensTableData'
import { useTokensAPY } from '@/features/portfolio/hooks/usePositionsAPY'
import { features } from '@/lib/config/features'
import { useGA } from '@/lib/config/ga4.config'

export const Route = createFileRoute('/leverage-tokens/')({
  component: () => {
    const navigate = useNavigate()
    const analytics = useGA()

    // Track page view when component mounts
    useEffect(() => {
      analytics.trackPageView('Leverage Tokens', '/leverage-tokens')
    }, [analytics])

    // Fetch live leverage token table data
    const { data: leverageTokens = [], isLoading, isError, error } = useLeverageTokensTableData()

    // Calculate APY data for all leverage tokens
    const {
      data: tokensAPYData,
      isLoading: isApyLoading,
      isError: isApyError,
    } = useTokensAPY({
      tokens: leverageTokens,
      enabled: leverageTokens.length > 0,
    })

    const handleTokenClick = (token: LeverageToken) => {
      // Navigate to the specific token's page using the new chain ID-based route
      navigate({
        to: '/leverage-tokens/$chainId/$id',
        params: { chainId: token.chainId.toString(), id: token.address },
      })
    }

    // Get the top 3 featured tokens
    const featuredTokens = leverageTokens
      .filter((token) => token.featuredRank !== undefined && token.featuredRank > 0)
      .sort((a, b) => {
        const rankA = a.featuredRank ?? Infinity
        const rankB = b.featuredRank ?? Infinity
        return rankA - rankB
      })
      .slice(0, 3)

    return (
      <div className="min-h-screen w-full overflow-hidden">
        <div className="w-full space-y-6 sm:space-y-8">
          {/* Featured Leverage Tokens Section */}
          {features.featuredTokensSection && (
            <div className="overflow-hidden w-full p-1">
              <FeaturedLeverageTokens
                tokens={featuredTokens}
                onTokenClick={handleTokenClick}
                apyDataMap={tokensAPYData}
                isApyLoading={isApyLoading}
                isApyError={isApyError}
              />
            </div>
          )}

          {/* Leverage Tokens Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-hidden w-full"
          >
            {isLoading ? (
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden w-full">
                {/* Filters skeleton */}
                <div className="p-4 border-b border-slate-700">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-8 w-64" />
                  </div>
                </div>

                {/* Table skeleton */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Table header skeleton */}
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Table row skeleton */}
                    <div className="flex justify-between items-center py-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-400">
                Failed to load tokens{error?.message ? `: ${error.message}` : ''}
              </div>
            ) : (
              <LeverageTokenTable
                tokens={leverageTokens}
                onTokenClick={handleTokenClick}
                apyDataMap={tokensAPYData}
                isApyLoading={isApyLoading}
                isApyError={isApyError}
              />
            )}
          </motion.div>
        </div>
      </div>
    )
  },
})
