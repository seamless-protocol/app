import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/components/theme-provider'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme === 'system' ? 'system' : theme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--surface-card)',
          '--normal-text': 'var(--text-primary)',
          '--normal-border': 'var(--divider-line)',
          '--toast-description-color': 'var(--text-secondary)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
