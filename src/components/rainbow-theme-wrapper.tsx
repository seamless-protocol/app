import { darkTheme, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { type ReactNode, useEffect, useState } from 'react'
import { useTheme } from './theme-provider'

interface RainbowThemeWrapperProps {
  children: ReactNode
}

export function RainbowThemeWrapper({ children }: RainbowThemeWrapperProps) {
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Handle system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      }

      // Set initial value
      handleChange()

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setResolvedTheme(theme as 'light' | 'dark')
      return undefined
    }
  }, [theme])

  // Custom theme configuration to better match our app
  const customLightTheme = lightTheme({
    accentColor: '#0ea5e9', // Sky-500
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
  })

  const customDarkTheme = darkTheme({
    accentColor: '#0ea5e9', // Sky-500
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
  })

  return (
    <RainbowKitProvider
      modalSize="compact"
      showRecentTransactions={true}
      theme={resolvedTheme === 'dark' ? customDarkTheme : customLightTheme}
    >
      {children}
    </RainbowKitProvider>
  )
}
