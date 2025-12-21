import React from 'react'
import {
  CBBTCLogo,
  MorphoLogo,
  RLPLogo,
  rETHLogo,
  SeamlessLogo,
  siUSDLogo,
  USDCLogo,
  WETHLogo,
  weETHLogo,
  wstETHLogo,
} from '../../components/icons'

export function getTokenLogo(asset: string) {
  switch (asset) {
    case 'USDC':
      return USDCLogo
    case 'siUSD':
      return siUSDLogo
    case 'cbBTC':
      return CBBTCLogo
    case 'WETH':
    case 'ETH':
      return WETHLogo
    case 'weETH':
      return weETHLogo
    case 'wstETH':
      return wstETHLogo
    case 'rETH':
      return rETHLogo
    case 'RLP':
      return RLPLogo
    case 'SEAM':
      return SeamlessLogo
    case 'MORPHO':
      return MorphoLogo
    default:
      return null
  }
}

export function getTokenLogoComponent(asset: string) {
  const LogoComponent = getTokenLogo(asset)

  if (LogoComponent) {
    return React.createElement(LogoComponent, {
      className: 'w-full h-full',
    })
  }

  return React.createElement(
    'div',
    {
      className:
        'w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-foreground',
    },
    asset.charAt(0),
  )
}
