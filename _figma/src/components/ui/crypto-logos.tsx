"use client"

import React from "react"

interface LogoProps {
  className?: string
  size?: number
}

// Bitcoin Logo
export const BitcoinLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path fill="#FFF" fillRule="nonzero" d="m23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.181-.045-1.130 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/>
    </g>
  </svg>
)

// Ethereum Logo
export const EthereumLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <g fill="#FFF" fillRule="nonzero">
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602"/>
        <path d="M16.498 27.995v-6.028L9 17.617z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2"/>
        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602"/>
      </g>
    </g>
  </svg>
)

// USDC Logo - Standard DeFi version with characteristic design
export const USDCLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <circle cx="16" cy="16" r="12.5" fill="none" stroke="#FFF" strokeWidth="1"/>
      <path 
        fill="#FFF" 
        d="M13.294 18.343c0 .747.596 1.353 1.331 1.353.736 0 1.332-.606 1.332-1.353v-.667h1.065v.694c0 1.306-1.072 2.373-2.397 2.373s-2.397-1.067-2.397-2.373v-4.686c0-1.306 1.072-2.374 2.397-2.374s2.397 1.068 2.397 2.374v.693h-1.065v-.667c0-.747-.596-1.353-1.332-1.353-.735 0-1.331.606-1.331 1.353v4.633z"
      />
      <path fill="#FFF" d="M11.5 15h9v1h-9v-1z"/>
      <path fill="#FFF" d="M11.5 17h9v1h-9v-1z"/>
      <text 
        x="16" 
        y="24" 
        textAnchor="middle" 
        fill="#FFF" 
        fontSize="6" 
        fontFamily="Arial, sans-serif" 
        fontWeight="bold"
      >
        USD
      </text>
    </g>
  </svg>
)

// USDT Logo
export const USDTLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
    </g>
  </svg>
)

// DAI Logo
export const DAILogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#F5AC37"/>
      <path fill="#FFF" d="M9.277 8h6.552c3.985 0 7.006 2.116 8.13 5.194H26v1.861h-1.611c.031.313.047.628.047.945s-.016.632-.047.945H26v1.861h-2.041C22.935 21.884 19.914 24 15.83 24H9.277v-1.861H7v-1.86h2.277v-1.89H7v-1.86h2.277V8zm1.831 10.139h4.999c3.049 0 5.334-1.315 6.068-3.278H11.108v3.278zm0-5.139h11.089c-.734-1.963-3.019-3.278-6.068-3.278h-4.999V13h-.022z"/>
    </g>
  </svg>
)

// WBTC Logo
export const WBTCLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none">
      <circle cx="16" cy="16" r="16" fill="#F09242"/>
      <path fill="#FFF" d="M11.734 14.033c.094-1.087.568-1.674 1.421-1.762.474-.049.901.07 1.28.355.38.285.62.662.722 1.13.04.184.04.386 0 .605-.112.607-.422 1.038-.93 1.295a2.12 2.12 0 01-.705.231l-.036-.003c.016.017.035.032.055.045.474.305.756.731.847 1.279.06.36.037.714-.069 1.06-.203.664-.588 1.105-1.155 1.322-.335.128-.687.171-1.057.129-.682-.077-1.194-.361-1.537-.85-.26-.371-.379-.789-.357-1.255.013-.282.068-.556.164-.822h.94c-.07.263-.102.53-.094.801.008.271.076.521.205.75.237.42.586.66 1.047.721.461.06.876-.05 1.245-.332.307-.235.485-.553.533-.953.035-.29.014-.577-.063-.86-.11-.407-.334-.706-.674-.896-.34-.19-.717-.242-1.132-.155-.07.015-.138.035-.205.059v-.75c.067.024.135.044.205.059.39.081.748.027 1.074-.162.326-.19.537-.467.634-.833.069-.26.076-.52.021-.781-.055-.26-.167-.496-.336-.708-.298-.374-.687-.564-1.168-.57-.481-.005-.884.17-1.21.528-.186.204-.316.447-.39.729-.044.169-.063.343-.057.52h-.94c-.028-.235.001-.47.087-.705zM16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z"/>
      <path fill="#F09242" d="M16 5.5c-5.79 0-10.5 4.71-10.5 10.5S10.21 26.5 16 26.5 26.5 21.79 26.5 16 21.79 5.5 16 5.5z"/>
    </g>
  </svg>
)

// cbBTC Logo (similar to Bitcoin but with Coinbase blue)
export const cbBTCLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <path fill="#FFF" fillRule="nonzero" d="m23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.181-.045-1.130 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/>
      <circle cx="24" cy="8" r="4" fill="#0052FF" stroke="#FFF" strokeWidth="2"/>
    </g>
  </svg>
)

// weETH Logo (wrapped eETH - purple/blue gradient)
export const weETHLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="weethGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#06B6D4"/>
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="url(#weethGradient)"/>
      <g fill="#FFF" fillRule="nonzero">
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".8"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".8"/>
        <path d="M16.498 27.995v-6.028L9 17.617z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".3"/>
        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".8"/>
      </g>
    </g>
  </svg>
)

// stETH Logo (Lido blue)
export const stETHLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#00A3FF"/>
      <g fill="#FFF" fillRule="nonzero">
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602"/>
        <path d="M16.498 27.995v-6.028L9 17.617z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2"/>
        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602"/>
      </g>
    </g>
  </svg>
)

// rETH Logo (Rocket Pool orange/red)
export const rETHLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#FF6B35"/>
      <g fill="#FFF">
        <path d="M16 3l9 6-9 5.5L7 9l9-6zm0 14L7 12v8l9 5.5V17zm9-5v8l-9 5.5V17l9-5z"/>
        <path d="M16 8.5L12 11v6l4 2.5 4-2.5v-6l-4-2.5z" fillOpacity=".8"/>
      </g>
    </g>
  </svg>
)

// cbETH Logo (Coinbase Ethereum)
export const cbETHLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <g fill="#FFF" fillRule="nonzero">
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602"/>
        <path d="M16.498 27.995v-6.028L9 17.617z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2"/>
        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602"/>
      </g>
      <circle cx="24" cy="8" r="4" fill="#0052FF" stroke="#FFF" strokeWidth="2"/>
    </g>
  </svg>
)

// wstETH Logo (wrapped stETH - darker blue)
export const wstETHLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#4B9FE6"/>
      <g fill="#FFF" fillRule="nonzero">
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602"/>
        <path d="M16.498 27.995v-6.028L9 17.617z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2"/>
        <path d="M9 16.20l7.498 4.353v-7.701z" fillOpacity=".602"/>
      </g>
      <circle cx="8" cy="8" r="3" fill="#4B9FE6" stroke="#FFF" strokeWidth="1.5"/>
    </g>
  </svg>
)

// GHO Logo (Aave ghost purple)
export const GHOLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#B6509E"/>
      <path fill="#FFF" d="M16 4c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 18c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm-4-6c0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4-4-1.791-4-4zm2-6c0-1.105.895-2 2-2s2 .895 2 2-.895 2-2 2-2-.895-2-2z"/>
    </g>
  </svg>
)

// SEAM Logo (Seamless Protocol brand purple)
export const SEAMLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="seamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A16CFE"/>
        <stop offset="100%" stopColor="#EC4899"/>
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="url(#seamGradient)"/>
      <path fill="#FFF" d="M8 12h4v2H8v-2zm0 4h6v2H8v-2zm0 4h8v2H8v-2zm12-8h4v2h-4v-2zm0 4h2v2h-2v-2zm0 4h4v2h-4v-2zM16 8h8v2h-8V8z"/>
    </g>
  </svg>
)

// Helper function to get logo component by symbol
export const getCryptoLogo = (symbol: string) => {
  const logos: Record<string, React.FC<LogoProps>> = {
    'BTC': BitcoinLogo,
    'ETH': EthereumLogo,
    'WETH': EthereumLogo,
    'USDC': USDCLogo,
    'USDT': USDTLogo,
    'DAI': DAILogo,
    'WBTC': WBTCLogo,
    'cbBTC': cbBTCLogo,
    'weETH': weETHLogo,
    'stETH': stETHLogo,
    'rETH': rETHLogo,
    'cbETH': cbETHLogo,
    'wstETH': wstETHLogo,
    'GHO': GHOLogo,
    'SEAM': SEAMLogo
  }
  
  return logos[symbol.toUpperCase()] || BitcoinLogo // Default fallback
}