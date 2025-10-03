# Google Analytics 4 (GA4) Integration Guide

This guide covers the complete setup and testing of Google Analytics 4 for the Seamless Protocol application.


## 📊 What We Track

### ✅ **Page Views** (Automatic)
- Landing page (`/tokens`)
- Portfolio page (`/portfolio`) 
- Leverage token detail pages (`/tokens/{chainId}/{tokenAddress}`)
- Vaults page (`/vaults`)

### ✅ **User Actions**
- **Wallet connections** - Track when users connect/disconnect wallets
- **Mint transactions** - Track successful leverage token minting (with token symbol, amount, USD value)
- **Redeem transactions** - Track successful leverage token redeeming (with token symbol, amount, USD value)
- **Transaction errors** - Track failed transactions (with error type and message)

### ✅ **Navigation**
- **Cross-page navigation** - Track how users move between different sections
- **User journey mapping** - See complete user paths through the app

### ✅ **Product Insights** (Tier 2)
- **Feature discovery** - Track when users discover new features
- **Conversion funnels** - Track user progression through mint/redeem flows
- **Page engagement** - Track time spent and interactions on key pages

### ❌ **What We DON'T Track**
- Every button click
- UI state changes  
- Tab switches
- Generic interactions

## 🚀 Practical Implementation in Existing Components

### **1. WalletConnectButton.tsx** - Add wallet tracking
```tsx
// Add to existing WalletConnectButton component
import { useWalletGA } from '@/lib/config/ga4.config'

export function WalletConnectButton() {
  const { trackWalletConnected, trackWalletDisconnected } = useWalletGA()
  
  // Add tracking to existing connect/disconnect handlers
  const handleConnect = (walletType: string) => {
    // ... existing connection logic
    trackWalletConnected(walletType) // ✅ Add this line
  }
  
  const handleDisconnect = () => {
    // ... existing disconnect logic  
    trackWalletDisconnected() // ✅ Add this line
  }
}
```

### **2. LeverageTokenTable.tsx** - Add transaction tracking
```tsx
// Add to existing leverage token components
import { useTransactionGA } from '@/lib/config/ga4.config'

export function LeverageTokenTable() {
  const { trackLeverageTokenMinted, trackTransactionError } = useTransactionGA()
  
  const handleMint = async (tokenSymbol: string, amount: string) => {
    try {
      // ... existing minting logic
      trackLeverageTokenMinted(tokenSymbol, amount, usdValue) // ✅ Add this line
    } catch (error) {
      trackTransactionError('mint_failed', 'leverage_token', error.message) // ✅ Add this line
    }
  }
}
```

### **3. Portfolio.tsx** - Add navigation tracking
```tsx
// Add to existing route components
import { useGA } from '@/lib/config/ga4.config'

export function Portfolio() {
  const analytics = useGA()
  
  // Track when user enters portfolio page
  useEffect(() => {
    analytics.trackPageView('Portfolio', '/portfolio') // ✅ Add this line
  }, [])
}
```

### **4. Staking.tsx** - Add staking tracking
```tsx
// Add to existing staking components
import { useTransactionGA } from '@/lib/config/ga4.config'

export function Staking() {
  const { trackStakingAction, trackTransactionError } = useTransactionGA()
  
  const handleStake = async (amount: string) => {
    try {
      // ... existing staking logic
      trackStakingAction('stake', amount, usdValue) // ✅ Add this line
    } catch (error) {
      trackTransactionError('stake_failed', 'staking', error.message) // ✅ Add this line
    }
  }
}
```