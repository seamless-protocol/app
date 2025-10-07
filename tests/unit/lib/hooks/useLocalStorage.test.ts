import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should initialize with provided initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))

      expect(result.current[0]).toBe('initial-value')
    })

    it('should initialize with stored value when localStorage has data', () => {
      localStorageMock.setItem('test-key', '"stored-value"')

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))

      expect(result.current[0]).toBe('stored-value')
    })

    it('should handle different data types', () => {
      const { result: stringResult } = renderHook(() => useLocalStorage('string-key', 'hello'))
      const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 42))
      const { result: booleanResult } = renderHook(() => useLocalStorage('boolean-key', true))
      const { result: objectResult } = renderHook(() =>
        useLocalStorage('object-key', { foo: 'bar' }),
      )
      const { result: arrayResult } = renderHook(() => useLocalStorage('array-key', [1, 2, 3]))

      expect(stringResult.current[0]).toBe('hello')
      expect(numberResult.current[0]).toBe(42)
      expect(booleanResult.current[0]).toBe(true)
      expect(objectResult.current[0]).toEqual({ foo: 'bar' })
      expect(arrayResult.current[0]).toEqual([1, 2, 3])
    })

    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      act(() => {
        result.current[1]('updated-value')
      })

      expect(result.current[0]).toBe('updated-value')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"updated-value"')
    })

    it('should handle function updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0))

      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(1)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', '1')

      act(() => {
        result.current[1]((prev) => prev * 2)
      })

      expect(result.current[0]).toBe(2)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', '2')
    })
  })

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Set invalid JSON in localStorage
      localStorageMock.setItem('test-key', 'invalid-json')

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

      expect(result.current[0]).toBe('fallback')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "test-key":',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    it('should handle JSON stringify errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Create a circular reference object that can't be stringified
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      act(() => {
        result.current[1](circularObj)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "test-key":',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    it('should handle localStorage quota exceeded errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem = vi.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      act(() => {
        result.current[1]('new-value')
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "test-key":',
        expect.any(DOMException),
      )

      // Restore original function
      localStorageMock.setItem = originalSetItem
      consoleSpy.mockRestore()
    })
  })

  describe('Cross-tab synchronization', () => {
    it('should update when storage event is fired from another tab', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      expect(result.current[0]).toBe('initial')

      // Simulate storage event from another tab by directly calling the event handler
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'test-key',
          newValue: '"updated-from-other-tab"',
          oldValue: null,
        })
        window.dispatchEvent(storageEvent)
      })

      expect(result.current[0]).toBe('updated-from-other-tab')
    })

    it('should ignore storage events for different keys', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      // Simulate storage event for different key
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'different-key',
          newValue: '"should-not-update"',
          oldValue: null,
        })
        window.dispatchEvent(storageEvent)
      })

      expect(result.current[0]).toBe('initial')
    })

    it('should ignore storage events with null newValue', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      // Simulate storage event with null value (item removed)
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'test-key',
          newValue: null,
          oldValue: null,
        })
        window.dispatchEvent(storageEvent)
      })

      expect(result.current[0]).toBe('initial')
    })

    it('should handle malformed JSON in storage events', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

      // Simulate storage event with invalid JSON
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'test-key',
          newValue: 'invalid-json',
          oldValue: null,
        })
        window.dispatchEvent(storageEvent)
      })

      expect(result.current[0]).toBe('initial')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing localStorage key "test-key":',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', ''))

      expect(result.current[0]).toBe('')

      act(() => {
        result.current[1]('non-empty')
      })

      expect(result.current[0]).toBe('non-empty')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"non-empty"')
    })

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', null))

      expect(result.current[0]).toBe(null)

      act(() => {
        result.current[1](undefined as any)
      })

      expect(result.current[0]).toBe(undefined)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', undefined)
    })

    it('should handle special characters and unicode', () => {
      const specialValue = '🚀 Hello 世界! @#$%^&*()'
      const { result } = renderHook(() => useLocalStorage('test-key', specialValue))

      expect(result.current[0]).toBe(specialValue)

      act(() => {
        result.current[1]('updated')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"updated"')
    })

    it('should handle complex object types', () => {
      interface User {
        id: number
        name: string
        preferences: {
          theme: 'light' | 'dark'
          notifications: boolean
        }
      }

      const initialUser: User = {
        id: 1,
        name: 'John Doe',
        preferences: {
          theme: 'light',
          notifications: true,
        },
      }

      const { result } = renderHook(() => useLocalStorage<User>('user', initialUser))

      expect(result.current[0]).toEqual(initialUser)

      act(() => {
        result.current[1]((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, theme: 'dark' },
        }))
      })

      expect(result.current[0].preferences.theme).toBe('dark')
    })
  })
})
