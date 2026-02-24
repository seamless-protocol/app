import { describe, expect, it } from 'vitest'
import { classifyError } from '@/features/leverage-tokens/utils/errors'

describe('classifyError', () => {
  describe('LT_SHARE_SLIPPAGE_EXCEEDED (mint)', () => {
    it('returns LT_SHARE_SLIPPAGE_EXCEEDED when txType is mintLt and message contains 0x76baadda', () => {
      const error = {
        message:
          'The contract function "deposit" reverted. Error signature 0x76baadda. Some other text.',
      }
      expect(classifyError(error, 'mintLt')).toEqual({
        type: 'LT_SHARE_SLIPPAGE_EXCEEDED',
      })
    })

    it('does not return LT_SHARE_SLIPPAGE_EXCEEDED when txType is mintLt but message lacks 0x76baadda', () => {
      const error = { message: 'transferFrom reverted' }
      expect(classifyError(error, 'mintLt')).not.toEqual({
        type: 'LT_SHARE_SLIPPAGE_EXCEEDED',
      })
    })

    it('does not return LT_SHARE_SLIPPAGE_EXCEEDED when message contains 0x76baadda but txType is not mintLt', () => {
      const error = { message: 'Revert 0x76baadda' }
      expect(classifyError(error, 'redeemLt')).toEqual({
        type: 'LT_COLLATERAL_SLIPPAGE_EXCEEDED',
      })
      expect(classifyError(error)).not.toEqual({
        type: 'LT_SHARE_SLIPPAGE_EXCEEDED',
      })
    })
  })

  describe('LT_COLLATERAL_SLIPPAGE_EXCEEDED (redeem)', () => {
    it('returns LT_COLLATERAL_SLIPPAGE_EXCEEDED when txType is redeemLt and message contains 0x76baadda', () => {
      const error = { message: 'Reverted with 0x76baadda' }
      expect(classifyError(error, 'redeemLt')).toEqual({
        type: 'LT_COLLATERAL_SLIPPAGE_EXCEEDED',
      })
    })

    it('returns LT_COLLATERAL_SLIPPAGE_EXCEEDED when txType is redeemLt and message contains CollateralSlippageTooHigh', () => {
      const error = { message: 'CollateralSlippageTooHigh' }
      expect(classifyError(error, 'redeemLt')).toEqual({
        type: 'LT_COLLATERAL_SLIPPAGE_EXCEEDED',
      })
    })

    it('does not return LT_COLLATERAL_SLIPPAGE_EXCEEDED when txType is redeemLt but message is not CollateralSlippageTooHigh or 0x76baadda', () => {
      const error = { message: 'Some other revert' }
      expect(classifyError(error, 'redeemLt')).toEqual({
        type: 'UNKNOWN',
        message: 'Some other revert',
        originalError: error,
      })
    })

    it('does not return LT_COLLATERAL_SLIPPAGE_EXCEEDED when txType is not redeemLt', () => {
      const error = { message: '0x76baadda' }
      expect(classifyError(error, 'mintLt')).toEqual({
        type: 'LT_SHARE_SLIPPAGE_EXCEEDED',
      })
      expect(classifyError(error)).toEqual({
        type: 'UNKNOWN',
        message: '0x76baadda',
        originalError: error,
      })
    })
  })

  describe('INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT', () => {
    it('returns INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT when txType is mintLt and message contains transferFrom reverted', () => {
      const error = {
        message:
          'The contract function "deposit" reverted with the following reason:\ntransferFrom reverted\n\nContract Call:',
      }
      expect(classifyError(error, 'mintLt')).toEqual({
        type: 'INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT',
      })
    })

    it('returns INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT when txType is redeemLt and message contains transferFrom reverted', () => {
      const error = { message: 'transferFrom reverted' }
      expect(classifyError(error, 'redeemLt')).toEqual({
        type: 'INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT',
      })
    })

    it('does not return INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT when message does not contain transferFrom reverted', () => {
      const error = { message: 'Some other error' }
      expect(classifyError(error, 'mintLt')).not.toEqual({
        type: 'INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT',
      })
    })

    it('does not return INSUFFICIENT_ASSETS_FOR_FLASH_LOAN_REPAYMENT when txType is omitted', () => {
      const error = { message: 'transferFrom reverted' }
      expect(classifyError(error)).toEqual({
        type: 'UNKNOWN',
        message: 'transferFrom reverted',
        originalError: error,
      })
    })
  })
})
