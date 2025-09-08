import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { FeaturedLeverageTokens } from '@/features/leverage-tokens/components/FeaturedLeverageToken'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { LeverageTokenTable } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { useLeverageTokenAPY } from '@/features/leverage-tokens/hooks/useLeverageTokenAPY'
import { useLeverageTokensTableData } from '@/features/leverage-tokens/hooks/useLeverageTokensTableData'

export const Route = createFileRoute('/tokens/')({
  component: () => {
    const navigate = useNavigate()

    // Fetch live leverage token table data
    const { data: leverageTokens = [], isLoading, isError, error } = useLeverageTokensTableData()

    // Pre-load APY data for the first token (currently only one token)
    const firstToken = leverageTokens[0]
    const {
      data: apyData,
      isLoading: isApyLoading,
      isError: isApyError,
    } = useLeverageTokenAPY({
      ...(firstToken?.address && { tokenAddress: firstToken.address }),
      ...(firstToken && { leverageToken: firstToken }),
      enabled: !!firstToken,
    })

    const handleTokenClick = (token: LeverageToken) => {
      // Navigate to the specific token's page using the new chain ID-based route
      navigate({
        to: '/tokens/$chainId/$id',
        params: { chainId: token.chainId.toString(), id: token.address },
      })
    }

    return (
      <div className="min-h-screen w-full overflow-hidden">
        <div className="w-100 sm:w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 sm:px-4 lg:px-8">
          {/* Featured Leverage Tokens Section */}
          <div className="overflow-hidden w-full p-1">
            <FeaturedLeverageTokens
              tokens={leverageTokens.slice(0, 3)} // Show top 3 tokens
              onTokenClick={handleTokenClick}
              apyData={apyData}
              isApyLoading={isApyLoading}
              isApyError={isApyError}
            />
          </div>

          {/* Leverage Tokens Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-hidden w-full"
          >
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">Loading leverage tokens…</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-400">
                Failed to load tokens{error?.message ? `: ${error.message}` : ''}
              </div>
            ) : (
              <LeverageTokenTable
                tokens={leverageTokens}
                onTokenClick={handleTokenClick}
                apyData={apyData}
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
