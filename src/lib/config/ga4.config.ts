/**
 * Google Analytics 4 (GA4) - Complete integration
 * Includes initialization, utilities, and React hooks
 */

import { useLocation } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
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

// Extend the global Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, unknown>,
    ) => void
    dataLayer: Array<unknown>
  }
}

/**
 * Check if GA4 is available in the current environment
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

  window.gtag('config', measurementId, {
    page_title: pageTitle,
    page_location: pagePath || window.location.href,
  })
}

/**
 * Track a custom event
 */
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
  if (!isGA4Available()) {
    return
  }

  window.gtag('event', eventName, {
    event_category: parameters?.['category'] || 'engagement',
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
  console.log(
    '[GA4] trackQuoteSource',
    event,
    tokenIn,
    tokenOut,
    quoteSource,
    amountIn,
    amountInUSD,
    amountOut,
    amountOutUSD,
  )
  trackEvent(event, {
    category: 'quote',
    token_in: tokenIn,
    token_out: tokenOut,
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
      category: 'user_engagement',
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

export function initGA4() {
  const measurementId = import.meta.env['VITE_GA4_MEASUREMENT_ID']

  if (!measurementId) {
    console.log('[GA4] No Measurement ID provided, skipping initialization')
    return
  }

  try {
    // Load the GA4 script dynamically
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    // Initialize the data layer and gtag function
    window.dataLayer = window.dataLayer || []

    function gtag(...args: Array<unknown>) {
      window.dataLayer.push(args)
    }

    // Make gtag available globally
    window.gtag = gtag

    // Initialize GA4
    gtag('js', new Date())
    gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      // Add environment context for better analytics
      environment: import.meta.env.MODE,
    })

    console.log('[GA4] Initialized successfully with Measurement ID:', measurementId)
  } catch (error) {
    console.error('[GA4] Failed to initialize:', error)
  }
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
      // Basic event tracking
      trackEvent,

      // Page view tracking
      trackPageView: (title: string, path?: string) => {
        trackPageView(title, path)
      },

      // Quote tracking
      trackQuoteSource: trackQuoteSource,

      // DeFi-specific event tracking (direct access to trackDeFiEvents)
      ...trackDeFiEvents,

      // Utility functions
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
