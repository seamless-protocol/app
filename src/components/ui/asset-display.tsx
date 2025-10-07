import { ExternalLink } from 'lucide-react'
import { useExplorer } from '@/lib/hooks/useExplorer'
import { getBestAssetColor } from '@/lib/utils/asset-colors'
import { cn } from '@/lib/utils/cn'
import { getTokenLogo, getTokenLogoComponent } from '@/lib/utils/token-logos'
import { Badge } from './badge'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface Asset {
  symbol: string
  name?: string
  logo?: string
}

interface AssetDisplayProps {
  // Single asset mode
  asset?: Asset
  // Multiple assets mode
  assets?: Array<Asset>
  // Display options
  name?: string // For multiple assets, show this name instead of symbols
  size?: 'sm' | 'md' | 'lg'
  showLink?: boolean
  onClick?: () => void
  className?: string
  // Badge options
  isPopular?: boolean
  showBadge?: boolean
  // Logo options
  showLogos?: boolean
  // Tooltip options
  tooltipContent?: React.ReactNode
  // Variant options
  variant?: 'default' | 'logo-only'
}

const sizeClasses = {
  sm: {
    container: 'w-5 h-5',
    logo: 16,
    text: 'text-xs',
    icon: 'h-2.5 w-2.5',
    badge: 'text-xs px-1.5 py-0.5',
  },
  md: {
    container: 'w-6 h-6',
    logo: 20,
    text: 'text-sm',
    icon: 'h-3 w-3',
    badge: 'text-xs px-2 py-0.5',
  },
  lg: {
    container: 'w-8 h-8',
    logo: 24,
    text: 'text-base',
    icon: 'h-4 w-4',
    badge: 'text-sm px-2 py-1',
  },
}

function renderAssetLogo(asset: Asset) {
  // Try to get the token logo component first
  const LogoComponent = getTokenLogo(asset.symbol)

  if (LogoComponent) {
    return getTokenLogoComponent(asset.symbol)
  }

  // Fallback to URL logo if provided
  const logoUrl = asset.logo?.trim()
  if (logoUrl) {
    return (
      <img src={logoUrl} alt={asset.symbol} className="w-full h-full rounded-full object-cover" />
    )
  }

  // Final fallback with dynamic color generation
  const bgColor = getBestAssetColor(asset.symbol)

  return (
    <div
      className={cn(
        'w-full h-full rounded-full flex items-center justify-center text-foreground font-medium text-xs',
        bgColor,
      )}
    >
      {asset.symbol.slice(0, 2)}
    </div>
  )
}

export function AssetDisplay({
  asset,
  assets = [],
  name,
  size = 'md',
  showLink = false,
  onClick,
  className,
  isPopular = false,
  showBadge = true,
  showLogos = true,
  tooltipContent,
  variant = 'default',
}: AssetDisplayProps) {
  const sizeConfig = sizeClasses[size]
  const explorer = useExplorer()

  // Determine if we're in single asset mode or multiple assets mode
  const isSingleAsset = asset && assets.length === 0
  const isMultipleAssets = assets.length > 0

  if (isSingleAsset && asset) {
    // Single asset mode
    if (variant === 'logo-only') {
      // Logo-only variant for single asset
      const logoContent = (
        <button
          type="button"
          className={cn(
            'asset-display-button flex min-h-5 items-center justify-center rounded-full border-2 border-[var(--divider-line)] bg-[var(--surface-card)] transition-colors hover:border-[color-mix(in_srgb,var(--brand-primary) 60%,var(--divider-line) 40%)]',
            sizeConfig.container,
            className,
          )}
          onClick={onClick}
          aria-label={`View ${asset.name || asset.symbol} details`}
        >
          {renderAssetLogo(asset)}
        </button>
      )

      if (tooltipContent) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>{logoContent}</TooltipTrigger>
            <TooltipContent className="border border-[var(--divider-line)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-lg shadow-black/20">
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        )
      }

      return logoContent
    }

    // Default single asset mode (original AssetDisplay behavior)
    const content = (
      <div className={cn('flex items-center space-x-2', className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full border border-[var(--divider-line)] bg-[var(--surface-card)]',
            sizeConfig.container,
          )}
        >
          {renderAssetLogo(asset)}
        </div>
        <span className={cn('font-medium text-[var(--text-secondary)]', sizeConfig.text)}>
          {asset.symbol}
        </span>
        {showLink && <ExternalLink className={cn('text-[var(--text-muted)]', sizeConfig.icon)} />}
      </div>
    )

    if (onClick) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)]"
              onClick={onClick}
            >
              {content}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="border border-[var(--divider-line)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-lg shadow-black/10">
            <p>
              View {asset.name || asset.symbol} on {explorer.name}
            </p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  if (isMultipleAssets) {
    // Multiple assets mode (TokenName behavior)
    const content = (
      <div className={cn('flex flex-col space-y-1', className)}>
        <div className="flex items-center space-x-3">
          {/* Asset Logos - only render if showLogos is true and assets exist */}
          {showLogos && assets.length > 0 && (
            <div className="flex -space-x-1">
              {assets.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 border-[var(--divider-line)] bg-[var(--surface-card)]',
                    sizeConfig.container,
                  )}
                  style={{ zIndex: assets.length - index }}
                >
                  {renderAssetLogo(asset)}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <h4 className={cn('font-medium text-[var(--text-primary)] truncate', sizeConfig.text)}>
              {name || assets.map((a) => a.symbol).join(' / ')}
            </h4>
            {showBadge && isPopular && (
              <Badge
                className={cn(
                  'bg-purple-500/20 text-purple-400 border-purple-500/30 shrink-0',
                  sizeConfig.badge,
                )}
              >
                Popular
              </Badge>
            )}
          </div>
        </div>
      </div>
    )

    // Wrap with tooltip if tooltipContent is provided
    if (tooltipContent) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent className="border border-[var(--divider-line)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-lg shadow-black/10">
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  // Fallback for invalid state
  return null
}
