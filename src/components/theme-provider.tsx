import { createContext, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )
  const hasMountedRef = useRef(false)

  useEffect(() => {
    const root = window.document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

    // Briefly disable CSS transitions to avoid flicker when switching themes
    let cleanupTransitions: (() => void) | undefined
    try {
      const styleEl = window.document.createElement('style')
      styleEl.appendChild(
        window.document.createTextNode(
          '*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}',
        ),
      )
      window.document.head.appendChild(styleEl)
      // Force browser repaint
      void window.getComputedStyle(window.document.body)
      cleanupTransitions = () => {
        window.document.head.removeChild(styleEl)
      }
    } catch {
      // no-op if we cannot modify the head (SSR safety)
    }

    root.classList.remove('light', 'dark')

    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      if (cleanupTransitions) setTimeout(cleanupTransitions, hasMountedRef.current ? 1 : 0)
      hasMountedRef.current = true
      return
    }

    root.classList.add('light')
    if (cleanupTransitions) setTimeout(cleanupTransitions, hasMountedRef.current ? 1 : 0)
    hasMountedRef.current = true
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
