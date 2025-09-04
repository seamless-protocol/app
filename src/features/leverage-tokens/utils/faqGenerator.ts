import type { FAQItem } from '@/components/FAQ'

interface LeverageTokenFAQParams {
  leverageRatio: number
  collateralSymbol: string
  debtSymbol: string
}

/**
 * Generates FAQ data for a leverage token based on the provided parameters
 */
export function generateLeverageTokenFAQ({
  leverageRatio,
  collateralSymbol,
  debtSymbol,
}: LeverageTokenFAQParams): Array<FAQItem> {
  return [
    {
      id: 'how-leverage-token-works',
      question: 'How does this Leverage Token work?',
      answer: `This ${leverageRatio}x leverage token amplifies the performance difference between ${collateralSymbol} and ${debtSymbol}, allowing traders to benefit from relative price movements with enhanced returns. The token automatically rebalances to maintain the target leverage ratio.`,
    },
    {
      id: 'risks',
      question: 'What are the risks involved?',
      answer: `Leverage tokens carry amplified risks including higher volatility, potential for significant losses during adverse price movements, rebalancing costs, and smart contract risks. The ${leverageRatio}x leverage means small price movements are magnified significantly.`,
    },
  ]
}
