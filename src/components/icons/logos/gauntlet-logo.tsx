import type { ImgHTMLAttributes } from 'react'
import gauntletLogoUrl from './gauntlet-logo.svg'

export function GauntletLogo({
  className,
  alt = 'Gauntlet',
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={gauntletLogoUrl} alt={alt} className={className} {...props} />
}
