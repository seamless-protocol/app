import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { FeaturedLeverageTokens } from '@/features/leverage-tokens/components/FeaturedLeverageToken'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { LeverageTokenTable } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { useLeverageTokensTableData } from '@/features/leverage-tokens/hooks/useLeverageTokensTableData'

export const Route = createFileRoute('/tokens/')({
  component: () => {
    const navigate = useNavigate()

    // Fetch live leverage token table data
    const { data: leverageTokens = [], isLoading, isError, error } = useLeverageTokensTableData()

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
              tokens={leverageTokens.slice(0, 3)} // Show top 3 tokens
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
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">Loading leverage tokens…</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-400">
                Failed to load tokens{error?.message ? `: ${error.message}` : ''}
              </div>
            ) : (
              <LeverageTokenTable
                tokens={leverageTokens as Array<LeverageToken>}
                onTokenClick={handleTokenClick}
              />
            )}
          </motion.div>
        </div>
      </div>
    )
  },
})
