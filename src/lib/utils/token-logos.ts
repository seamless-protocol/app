import React from 'react'
import { CBBTCLogo, rETHLogo, USDCLogo, WETHLogo, weETHLogo } from '../../components/icons'

export function getTokenLogo(asset: string) {
  switch (asset) {
    case 'USDC':
      return USDCLogo
    case 'cbBTC':
      return CBBTCLogo
    case 'WETH':
      return WETHLogo
    case 'weETH':
      return weETHLogo
    case 'rETH':
      return rETHLogo
    default:
      return null
  }
}

export function getTokenLogoComponent(asset: string, size: number = 20) {
  const LogoComponent = getTokenLogo(asset)

  if (LogoComponent) {
    const sizeClass =
      size === 16
        ? 'w-4 h-4'
        : size === 20
          ? 'w-5 h-5'
          : size === 24
            ? 'w-6 h-6'
            : size === 32
              ? 'w-8 h-8'
              : 'w-5 h-5'

    return React.createElement(LogoComponent, {
      className: sizeClass,
    })
  }

  return React.createElement(
    'div',
    {
      className:
        'w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white',
    },
    asset.charAt(0),
  )
}
