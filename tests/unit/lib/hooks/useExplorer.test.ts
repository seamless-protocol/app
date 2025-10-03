import { describe, expect, it } from 'vitest'
import {
  getAddressExplorerUrl,
  getBlockExplorerName,
  getTokenExplorerUrl,
  getTxExplorerUrl,
} from '@/lib/utils/block-explorer'

// Test the underlying utility functions that useExplorer depends on
describe('useExplorer fallbacks', () => {
  describe('getBlockExplorerName', () => {
    it('should return correct explorer names for known chains', () => {
      expect(getBlockExplorerName(1)).toBe('Etherscan')
      expect(getBlockExplorerName(8453)).toBe('Basescan')
      expect(getBlockExplorerName(11155111)).toBe('Etherscan')
      expect(getBlockExplorerName(84532)).toBe('Basescan')
    })

    it('should return default name for unknown chains', () => {
      expect(getBlockExplorerName(99999)).toBe('Block Explorer')
      expect(getBlockExplorerName(0)).toBe('Block Explorer')
    })
  })

  describe('getTxExplorerUrl', () => {
    it('should return correct transaction URLs for known chains', () => {
      expect(getTxExplorerUrl(1, '0x123')).toBe('https://etherscan.io/tx/0x123')
      expect(getTxExplorerUrl(8453, '0xabc')).toBe('https://basescan.org/tx/0xabc')
    })

    it('should lowercase transaction hashes', () => {
      expect(getTxExplorerUrl(1, '0XABC123')).toBe('https://etherscan.io/tx/0xabc123')
    })
  })

  describe('getAddressExplorerUrl', () => {
    it('should return correct address URLs for known chains', () => {
      expect(getAddressExplorerUrl(1, '0x123')).toBe('https://etherscan.io/address/0x123')
      expect(getAddressExplorerUrl(8453, '0xabc')).toBe('https://basescan.org/address/0xabc')
    })

    it('should lowercase addresses', () => {
      expect(getAddressExplorerUrl(1, '0XABC123')).toBe('https://etherscan.io/address/0xabc123')
    })
  })

  describe('getTokenExplorerUrl', () => {
    it('should return correct token URLs for known chains', () => {
      expect(getTokenExplorerUrl(1, '0x123')).toBe('https://etherscan.io/token/0x123')
      expect(getTokenExplorerUrl(8453, '0xabc')).toBe('https://basescan.org/token/0xabc')
    })

    it('should lowercase token addresses', () => {
      expect(getTokenExplorerUrl(1, '0XABC123')).toBe('https://etherscan.io/token/0xabc123')
    })
  })
})
