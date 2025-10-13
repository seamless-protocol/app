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
  const collateralRatio = 1 / leverageRatio

  const tokenExplorerUrl = getTokenExplorerUrl(chainId, address)

  return [
    {
      id: 'how-leverage-token-works',
      question: 'How does this Leverage Token work?',
      answer: (
        <p>
          When you mint the{' '}
          <strong>
            {collateralAsset.symbol}/{debtAsset.symbol} {leverageRatio}x Leverage Token
          </strong>{' '}
          with <strong>{collateralAsset.symbol}</strong>, you receive a new token that represents a{' '}
          <strong>
            {leverageRatio}x leveraged {collateralAsset.symbol}/{debtAsset.symbol} position
          </strong>{' '}
          on <strong>Morpho</strong>. This position provides amplified exposure to the{' '}
          <strong>
            {collateralAsset.symbol}/{debtAsset.symbol} staking yield spread
          </strong>
          , offering the potential for enhanced returns compared to holding{' '}
          <strong>{collateralAsset.symbol}</strong>
          directly.
        </p>
      ),
    },
    {
      id: 'minting-asset',
      question: 'What asset can I use to mint this Leverage Token?',
      answer: (
        <p>
          Only <strong>{collateralAsset.symbol}</strong> is accepted to mint this{' '}
          <strong>LT</strong> for now. Additional functionality to mint this{' '}
          <strong>Leverage Token</strong> with other assets is coming soon. In the meantime, you can
          use the <strong>Swap/Bridge widget</strong> in the app to swap directly into{' '}
          <strong>{collateralAsset.symbol}</strong> if it's not already in your wallet.
        </p>
      ),
    },
    {
      id: 'collateral-asset-info',
      question: `What is ${collateralAsset.symbol}?`,
      answer: <p>{collateralAsset.description}</p>,
    },
    {
      id: 'usd-exposure',
      question: `Do I have leveraged exposure to ${debtAsset.symbol}'s USD price with this LT?`,
      answer: (
        <p>
          No. The <strong>LT</strong> gives you leveraged exposure to the difference between the
          yield on <strong>{collateralAsset.symbol}</strong> and the borrowing cost of{' '}
          <strong>{debtAsset.symbol}</strong>. Since <strong>{collateralAsset.symbol}</strong> and{' '}
          <strong>{debtAsset.symbol}</strong> are highly correlated, the strategy behaves similarly
          to <strong>yield farming</strong> or <strong>a carry trade</strong> rather than a
          directional <strong>{debtAsset.symbol}</strong> bet.
        </p>
      ),
    },
    {
      id: 'target-leverage-ratio',
      question: "What's the target leverage ratio for this LT?",
      answer: (
        <p>
          The strategy targets <strong>{leverageRatio}x leverage</strong>, which corresponds to a
          <strong>collateral ratio</strong> of approximately{' '}
          <strong>{collateralRatio.toFixed(4)}</strong>.
        </p>
      ),
    },
    {
      id: 'rebalance-mechanics',
      question: 'What are the rebalance mechanics for LTs?',
      answer: (
        <div>
          <p>
            Rebalancing helps the <strong>Leverage Token</strong> maintain its{' '}
            <strong>target leverage</strong>. Each token has built-in rules (called{' '}
            <strong>"rebalancing adapters"</strong>) that tell it when and how to adjust the
            position. For example, it might rebalance when leverage drifts too far from target, when
            it's close to <strong>liquidation</strong>, or through <strong>timed auctions</strong>.
            Everything happens automatically—no manual steps are required.
          </p>
          <p className="mt-3">
            <strong>Seamless contributors</strong> have created{' '}
            <strong>3 types of rebalance adapters</strong> as a starting point:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <a
                href="https://github.com/seamless-protocol/leverage-tokens/blob/main/src/rebalance/CollateralRatiosRebalanceAdapter.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
              >
                <strong>CollateralRatiosRebalanceAdapter</strong>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/seamless-protocol/leverage-tokens/blob/main/src/rebalance/DutchAuctionRebalanceAdapter.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
              >
                <strong>DutchAuctionRebalanceAdapter</strong>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/seamless-protocol/leverage-tokens/blob/main/src/rebalance/PreLiquidationRebalanceAdapter.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--link-normal)] hover:text-[var(--link-hover)] underline underline-offset-2 transition-colors"
              >
                <strong>PreLiquidationRebalanceAdapter</strong>
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
            Leverage Tokens (<strong>LTs</strong>) are fully <strong>decentralized</strong> and{' '}
            <strong>permissionless</strong>, operating solely through predefined smart contract
            rules with no human oversight or discretionary decisions. They function much like a
            passive strategy that holds assets in a fixed, rules-based allocation—maintaining a
            target leverage exactly as specified, regardless of broader market conditions. The
            contracts do not adjust based on changing trends or attempt to manage risk dynamically.
            If the set parameters ever stop matching your objectives or risk tolerance, you can{' '}
            <strong>redeem your LT shares</strong> at any time.
          </p>
          <p className="mt-3">Here are some key risks to be aware of:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Smart Contract Risk (Seamless, Morpho, {collateralAsset.symbol}):</strong> The
              strategy depends on multiple smart contracts that could contain bugs or be exploited.
            </li>
            <li>
              <strong>Lending Market Risk (Morpho):</strong> Includes volatility in borrow rates,
              liquidation risk, and integration dependencies with Chainlink oracles.
            </li>
            <li>
              <strong>Oracle Risk:</strong> The {collateralAsset.symbol}/{debtAsset.symbol} exchange
              rate is sourced from a Chainlink oracle. If this feed is delayed, incorrect, or
              manipulated, it could lead to mispriced rebalances or liquidation.
            </li>
            <li>
              <strong>Borrow Rate Risk:</strong> If the {debtAsset.symbol} borrow rate exceeds the
              yield earned by {collateralAsset.symbol}, the position becomes unprofitable.
            </li>
            <li>
              <strong>Inflexibility:</strong> LT parameters are fixed. If market conditions shift
              unfavorably, the token will continue executing its programmed logic. Users must
              actively monitor and exit if the strategy no longer serves their goals.
            </li>
            <li>
              <strong>Exit Risk:</strong> Exiting a position may require converting{' '}
              {collateralAsset.symbol} to {debtAsset.symbol}, which can involve DEX slippage or
              protocol withdrawal costs.
            </li>
            <li>
              <strong>Inherent Leverage Risk:</strong> Gains and losses are magnified. Leverage
              amplifies outcomes—both positive and negative—so careful position sizing and
              monitoring are essential.
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
          It depends on your goals. The <strong>LT</strong> passively maintains{' '}
          <strong>leverage</strong> and is best suited for users who want{' '}
          <strong>automated exposure</strong> to a <strong>yield loop</strong> between{' '}
          <strong>{collateralAsset.symbol}</strong> and <strong>{debtAsset.symbol}</strong>. You
          should monitor <strong>borrow rates</strong> and <strong>yields</strong> regularly to
          decide if it still fits your strategy.
        </p>
      ),
    },
    {
      id: 'can-lose-money',
      question: 'Can I lose money with this LT?',
      answer: (
        <p>
          Yes. Although the strategy is designed to earn a <strong>yield</strong> by leveraging{' '}
          <strong>{collateralAsset.symbol}</strong> against <strong>{debtAsset.symbol}</strong>,{' '}
          <strong>negative yield spreads</strong> (e.g., if{' '}
          <strong>{debtAsset.symbol} borrow rate</strong> &gt;{' '}
          <strong>{collateralAsset.symbol} yield</strong>) can erode value. In extreme scenarios
          like <strong>oracle malfunction</strong> or <strong>protocol exploit</strong>,{' '}
          <strong>liquidation</strong> or <strong>capital loss</strong> is possible.
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
              href="https://docs.seamlessprotocol.org"
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
