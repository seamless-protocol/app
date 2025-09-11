// UI-level constants for leverage token features
// Keep magic values centralized here for easier tuning and future per-token overrides

// Minimum mint amount displayed in token units (string to preserve precision in inputs)
export const MIN_MINT_AMOUNT_DISPLAY = '0.01'

// Default slippage tolerance shown in the UI (percent as string)
export const DEFAULT_SLIPPAGE_PERCENT_DISPLAY = '0.5'

// Preset slippage options (percent strings) shown in the advanced UI
export const SLIPPAGE_PRESETS_PERCENT_DISPLAY = ['0.1', '0.5', '1.0'] as const
