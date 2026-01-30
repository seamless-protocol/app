/**
 * Google Analytics 4 (GA4) - Complete integration via react-ga4
 * Includes utilities and React hooks. Initialization is done in MainLayout.
 */

import { useLocation } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import ReactGA from 'react-ga4'
import type { Address } from 'viem'

export interface TrackBestQuoteSourceParams {
  event: 'best_quote_source' | 'quote_executed'
  tokenIn: Address
  tokenOut: Address
  quoteSource: string
  amountIn: bigint
  amountInUSD: number
  amountOut: bigint
  amountOutUSD: number
}

declare global {
  interface Window {
    gtag?: (...args: Array<unknown>) => void
  }
}

/**
 * Check if GA4 is available (react-ga4 sets window.gtag after initialize)
 */
export const isGA4Available = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Track a page view event
 */
export const trackPageView = (pageTitle: string, pagePath?: string): void => {
  if (!isGA4Available()) {
    return
  }

  const measurementId = import.meta.env['VITE_GA4_MEASUREMENT_ID']
  if (!measurementId) {
    return
  }

  ReactGA.send({
    hitType: 'pageview',
    page: pagePath ?? window.location.pathname,
    title: pageTitle,
  })
}

/**
 * Track a custom event
 */
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
  if (!isGA4Available()) {
    return
  }

  ReactGA.gtag('event', eventName, {
    event_category: parameters?.['category'] ?? 'engagement',
    ...parameters,
  })
}

export const trackQuoteSource = ({
  event,
  tokenIn,
  tokenOut,
  quoteSource,
  amountIn,
  amountInUSD,
  amountOut,
  amountOutUSD,
}: TrackBestQuoteSourceParams): void => {
  // Addresses are prefixed due to GA automatically converting hex strings to numbers
  trackEvent(event, {
    category: 'quote',
    token_in: `addr_${tokenIn}`,
    token_out: `addr_${tokenOut}`,
    quote_source: quoteSource,
    amount_in: amountIn,
    amount_in_usd: amountInUSD,
    amount_out: amountOut,
    amount_out_usd: amountOutUSD,
  })
}

/**
 * DeFi-specific event tracking functions
 */
export const trackDeFiEvents = {
  /**
   * Track wallet connection
   */
  walletConnected: (walletType: string): void => {
    trackEvent('wallet_connected', {
      category: 'wallet',
      wallet_type: walletType,
    })
  },

  /**
   * Track wallet disconnection
   */
  walletDisconnected: (): void => {
    trackEvent('wallet_disconnected', {
      category: 'wallet',
    })
  },

  /**
   * Track leverage token minting
   */
  leverageTokenMinted: (tokenSymbol: string, amount: string, valueUSD: number): void => {
    trackEvent('leverage_token_minted', {
      category: 'defi_transaction',
      token_symbol: tokenSymbol,
      amount,
      value_usd: valueUSD,
      transaction_type: 'mint',
    })
  },

  /**
   * Track leverage token redemption
   */
  leverageTokenRedeemed: (tokenSymbol: string, amount: string, valueUSD: number): void => {
    trackEvent('leverage_token_redeemed', {
      category: 'defi_transaction',
      token_symbol: tokenSymbol,
      amount,
      value_usd: valueUSD,
      transaction_type: 'redeem',
    })
  },

  /**
   * Track staking actions
   */
  stakingAction: (
    action: 'stake' | 'unstake' | 'claim_rewards',
    amount: string,
    valueUSD: number,
  ): void => {
    trackEvent('staking_action', {
      category: 'defi_transaction',
      staking_action: action,
      amount,
      value_usd: valueUSD,
    })
  },

  /**
   * Track vault interactions
   */
  vaultInteraction: (
    action: 'deposit' | 'withdraw',
    vaultName: string,
    amount: string,
    valueUSD: number,
  ): void => {
    trackEvent('vault_interaction', {
      category: 'defi_transaction',
      vault_action: action,
      vault_name: vaultName,
      amount,
      value_usd: valueUSD,
    })
  },

  /**
   * Track transaction errors
   */
  transactionError: (errorType: string, transactionType: string, errorMessage: string): void => {
    trackEvent('transaction_error', {
      category: 'error',
      error_type: errorType,
      transaction_type: transactionType,
      error_message: errorMessage,
    })
  },

  /**
   * Track user navigation
   */
  navigation: (fromPage: string, toPage: string): void => {
    trackEvent('navigation', {
      category: 'engagement',
      from_page: fromPage,
      to_page: toPage,
    })
  },

  // Tier 2: Product Insights Tracking
  featureDiscovered: (featureName: string, discoveryMethod: string = 'navigation'): void => {
    trackEvent('feature_discovered', {
      category: 'product_insights',
      feature_name: featureName,
      discovery_method: discoveryMethod,
    })
  },

  funnelStep: (funnelName: string, step: string, stepNumber: number): void => {
    trackEvent('funnel_step', {
      category: 'conversion',
      funnel_name: funnelName,
      step: step,
      step_number: stepNumber,
    })
  },

  pageEngagement: (pageName: string, timeSpent: number, interactions: number = 0): void => {
    trackEvent('page_engagement', {
      category: 'user_behavior',
      page_name: pageName,
      time_spent_seconds: timeSpent,
      interactions_count: interactions,
    })
  },
}

/**
 * React hook for Google Analytics 4 (GA4) tracking
 * Provides easy access to GA4 tracking functions within React components
 */
export const useGA = () => {
  const location = useLocation()

  // Track page views when the route changes
  useEffect(() => {
    if (isGA4Available()) {
      const pageTitle = document.title || 'Seamless Protocol'
      const pagePath = location.pathname

      trackPageView(pageTitle, pagePath)
    }
  }, [location.pathname])

  // Memoized tracking functions to prevent unnecessary re-renders
  const analytics = useMemo(
    () => ({
      trackEvent,

      trackPageView: (title: string, path?: string) => {
        trackPageView(title, path)
      },

      trackQuoteSource: trackQuoteSource,

      ...trackDeFiEvents,

      isAvailable: isGA4Available,
    }),
    [],
  )

  return analytics
}

/**
 * Hook for tracking wallet-related events
 * Specialized hook for wallet connection/disconnection tracking
 */
export const useWalletGA = () => {
  const { walletConnected, walletDisconnected } = useGA()

  return {
    trackWalletConnected: walletConnected,
    trackWalletDisconnected: walletDisconnected,
  }
}

/**
 * Hook for tracking DeFi transaction events
 * Specialized hook for transaction-related tracking
 */
export const useTransactionGA = () => {
  const {
    leverageTokenMinted,
    leverageTokenRedeemed,
    stakingAction,
    vaultInteraction,
    transactionError,
  } = useGA()

  return {
    trackLeverageTokenMinted: leverageTokenMinted,
    trackLeverageTokenRedeemed: leverageTokenRedeemed,
    trackStakingAction: stakingAction,
    trackVaultInteraction: vaultInteraction,
    trackTransactionError: transactionError,
  }
}

export const useQuotesGA = () => {
  const { trackQuoteSource } = useGA()

  return {
    trackQuoteSource: trackQuoteSource,
  }
}
