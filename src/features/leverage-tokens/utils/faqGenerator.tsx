import type { FAQItem } from '@/components/FAQ'
import { getTokenExplorerUrl } from '@/lib/utils/block-explorer'
import type { LeverageTokenConfig } from '../leverageTokens.config'

interface LeverageTokenFAQParams {
  tokenConfig: LeverageTokenConfig
}

/**
 * Generates FAQ data for a leverage token based on the provided parameters
 */
export function generateLeverageTokenFAQ({ tokenConfig }: LeverageTokenFAQParams): Array<FAQItem> {
  const { leverageRatio, collateralAsset, debtAsset, address, chainId } = tokenConfig
  const collateralRatio = leverageRatio / (leverageRatio - 1)

  const tokenExplorerUrl = getTokenExplorerUrl(chainId, address)

  return [
    {
      id: 'how-leverage-token-works',
      question: 'How does this Leverage Token work?',
      answer: (
        <p>
          When you mint the {collateralAsset.symbol}/{debtAsset.symbol} {leverageRatio}x Leverage
          Token with {collateralAsset.symbol}, you receive a new token that represents a{' '}
          {leverageRatio}x leveraged {collateralAsset.symbol}/{debtAsset.symbol} position on Morpho.
          This position provides amplified exposure to the {collateralAsset.symbol}/
          {debtAsset.symbol} staking yield spread, offering the potential for enhanced returns
          compared to holding {collateralAsset.symbol} directly.
          <br />
          {tokenConfig.apyConfig?.pointsMultiplier && (
            <>
              <br />
              This LT provides amplified exposure to to the {collateralAsset.symbol}/
              {debtAsset.symbol} staking yield spread as well as{' '}
              {tokenConfig.apyConfig.pointsMultiplier}x multiplier on{' '}
              {collateralAsset.protocol?.name} points.
            </>
          )}
        </p>
      ),
    },
    {
      id: 'minting-asset',
      question: 'What asset can I use to mint this Leverage Token?',
      answer: (
        <p>
          Only {collateralAsset.symbol} is accepted to mint this LT for now. Additional
          functionality to mint this Leverage Token with other assets is coming soon. In the
          meantime, you can use the Swap/Bridge widget in the app to swap directly into{' '}
          {collateralAsset.symbol} if it's not already in your wallet.
        </p>
      ),
    },
    {
      id: 'collateral-asset-info',
      question: `What is ${collateralAsset.symbol}?`,
      answer: <p>{collateralAsset.description}</p>,
    },
    ...(tokenConfig.apyConfig?.pointsMultiplier
      ? [
          {
            id: 'points-multiplier-info',
            question: 'Are there points involved with this LT?',
            answer: (
              <p>
                Yes. When you supply {collateralAsset.symbol} into the {collateralAsset.symbol}/
                {debtAsset.symbol} {leverageRatio}x Leverage Token, you earn{' '}
                {collateralAsset.protocol?.name} Points, which will convert into a future{' '}
                {collateralAsset.protocol?.name} airdrop. With this Leverage Token, users earn a{' '}
                {tokenConfig.apyConfig.pointsMultiplier}x multiple on{' '}
                {collateralAsset.protocol?.name} Points. Example: If you deposit $10,000 s
                {collateralAsset.symbol} into this LT, your effective leveraged position is $
                {(leverageRatio * 10000).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {collateralAsset.symbol} — and you'll earn points as if you held that full amount.
                See related resources links for more info on {collateralAsset.protocol?.name}{' '}
                points.
              </p>
            ),
          },
        ]
      : []),
    {
      id: 'what-are-the-fees-for-this-lt',
      question: 'What are the fees for this LT?',
      answer: (
        <p>
          There are currently no Seamless Protocol fees on this Leverage Token. Underlying protocol
          fees may apply, see related resources links for more info.
        </p>
      ),
    },
    ...(debtAsset.symbol !== 'USDC'
      ? [
          {
            id: 'usd-exposure',
            question: `Do I have leveraged exposure to ${collateralAsset.symbol}'s USD price with this LT?`,
            answer: (
              <p>
                No. The LT gives you leveraged exposure to the difference between the yield on{' '}
                {collateralAsset.symbol} and the borrowing cost of {debtAsset.symbol}. Since{' '}
                {collateralAsset.symbol} and {debtAsset.symbol} are highly correlated, the strategy
                behaves similarly to yield farming or a carry trade rather than a directional{' '}
                {debtAsset.symbol} bet.
              </p>
            ),
          },
        ]
      : []),
    {
      id: 'target-leverage-ratio',
      question: "What's the target leverage ratio for this LT?",
      answer: (
        <p>
          The strategy targets {leverageRatio}x leverage, which corresponds to a collateral ratio of
          approximately {collateralRatio.toFixed(4)}.
        </p>
      ),
    },
    {
      id: 'rebalance-mechanics',
      question: 'What are the rebalance mechanics for LTs?',
      answer: (
        <div>
          <p>
            Rebalancing helps the Leverage Token maintain its target leverage. Each token has
            built-in rules (called "rebalancing adapters") that tell it when and how to adjust the
            position. For example, it might rebalance when leverage drifts too far from target, when
            it's close to liquidation, or through timed auctions. Everything happens
            automatically—no manual steps are required.
          </p>
          <p className="mt-3">
            Seamless contributors have created 3 types of rebalance adapters as a starting point:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <a
                href="https://github.com/seamless-protocol/leverage-tokens/blob/main/src/rebalance/CollateralRatiosRebalanceAdapter.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
              >
                CollateralRatiosRebalanceAdapter
              </a>
            </li>
            <li>
              <a
                href="https://github.com/seamless-protocol/leverage-tokens/blob/main/src/rebalance/DutchAuctionRebalanceAdapter.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
              >
                DutchAuctionRebalanceAdapter
              </a>
            </li>
            <li>
              <a
                href="https://github.com/seamless-protocol/leverage-tokens/blob/main/src/rebalance/PreLiquidationRebalanceAdapter.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
              >
                PreLiquidationRebalanceAdapter
              </a>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'risks',
      question: 'What are the risks involved?',
      answer: (
        <div>
          <p>
            Leverage Tokens (LTs) are fully decentralized and permissionless, operating solely
            through predefined smart contract rules with no human oversight or discretionary
            decisions. They function much like a passive strategy that holds assets in a fixed,
            rules-based allocation—maintaining a target leverage exactly as specified, regardless of
            broader market conditions. The contracts do not adjust based on changing trends or
            attempt to manage risk dynamically. If the set parameters ever stop matching your
            objectives or risk tolerance, you can redeem your LT shares at any time.
          </p>
          <p className="mt-3">Here are some key risks to be aware of:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              Smart Contract Risk (Seamless, Morpho, {collateralAsset.symbol}): The strategy depends
              on multiple smart contracts that could contain bugs or be exploited.
            </li>
            <li>
              Lending Market Risk (Morpho): Includes volatility in borrow rates, liquidation risk,
              and integration dependencies with oracles.
            </li>
            <li>
              Oracle Risk: The {collateralAsset.symbol}/{debtAsset.symbol} exchange rate is sourced
              from the underlying lending market's price oracle. If this feed is delayed, incorrect,
              or manipulated, it could lead to mispriced rebalances or liquidation.
            </li>
            <li>
              Borrow Rate Risk: If the {debtAsset.symbol} borrow rate exceeds the yield earned by
              {collateralAsset.symbol}, the position becomes unprofitable. See related resources
              links for more info on the underlying lending market (i.e.: Morpho).
            </li>
            <li>
              Inflexibility: LT parameters are fixed. If market conditions shift unfavorably, the
              token will continue executing its programmed logic, i.e.: stay within it's configured
              leverage band by rebalancing. Users must actively monitor and exit if the strategy no
              longer serves their goals.
            </li>
            <li>
              Exit Risk: Exiting a position may require converting {collateralAsset.symbol} to{' '}
              {debtAsset.symbol}, which can involve DEX slippage or {collateralAsset.symbol}
              withdrawal costs. See related resources links for more info on{' '}
              {collateralAsset.symbol}.
            </li>
            <li>
              Inherent Leverage Risk: Gains and losses are magnified. Leverage amplifies
              outcomes—both positive and negative—so careful position sizing and monitoring are
              essential.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'strategy-duration',
      question: 'Is this a short-term or long-term strategy?',
      answer: (
        <p>
          It depends on your goals. The LT passively maintains leverage and is best suited for users
          who want automated exposure to a yield loop between {collateralAsset.symbol} and{' '}
          {debtAsset.symbol}. You should monitor borrow rates and yields regularly to decide if it
          still fits your strategy.
        </p>
      ),
    },
    {
      id: 'can-lose-money',
      question: 'Can I lose money with this LT?',
      answer: (
        <p>
          Yes. Although the strategy is designed to earn a yield by leveraging{' '}
          {collateralAsset.symbol} against {debtAsset.symbol}, negative yield spreads (e.g., if{' '}
          {debtAsset.symbol} borrow rate &gt; {collateralAsset.symbol} yield) can erode value. In
          extreme scenarios like oracle malfunction or protocol exploit, liquidation or capital loss
          is possible.
        </p>
      ),
    },
    {
      id: 'learn-more',
      question: 'Where can I track performance and learn more?',
      answer: (
        <div className="space-y-2">
          <div>
            <a
              href="https://docs.seamlessprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
            >
              GitBook Documentation
            </a>
          </div>
          <div>
            <a
              href={tokenExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
            >
              Block Explorer
            </a>
          </div>
        </div>
      ),
    },
  ]
}
