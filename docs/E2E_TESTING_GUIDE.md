# E2E Testing Guide with Playwright

## Quick Start

### Run Tests
```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test app-navigation.spec.ts

# Show test report
npx playwright show-report
```

### Test Structure
```
tests/
├── e2e/                    # E2E test files
│   └── app-navigation.spec.ts
├── setup.ts               # Test setup and mocks
└── utils.tsx              # Test utilities
```

## Writing E2E Tests

### Basic Test Template
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    // Test steps here
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

### Common Patterns

**Navigation**
```typescript
// Navigate to page
await page.goto('/#/tokens')

// Wait for page load
await page.waitForLoadState('networkidle')
```

**Element Interaction**
```typescript
// Click button
await page.locator('button:has-text("Connect Wallet")').click()

// Fill form
await page.locator('input[name="amount"]').fill('100')

// Select dropdown
await page.locator('select[name="token"]').selectOption('USDC')

// Click navigation link
await page.locator('a[href="/tokens"]').click()
```

**Assertions**
```typescript
// Check visibility
await expect(page.locator('h1')).toBeVisible()

// Check text content
await expect(page.locator('text=Welcome')).toBeVisible()

// Check count
const elements = page.locator('.item')
expect(await elements.count()).toBeGreaterThan(0)
```

### Wallet Testing
```typescript
// Check if wallet is connected
const walletInfo = page.locator('text=Connected Address:')
if (await walletInfo.isVisible()) {
  // Wallet connected - test connected state
} else {
  // Wallet not connected - test connection flow
}
```

## Configuration

The app uses hash routing (`/#/page`), so navigation tests should use:
```typescript
await page.goto('/#/tokens')  // ✅ Correct
await page.goto('/tokens')    // ❌ Wrong
```

## Best Practices

1. **Use descriptive test names** that explain what the test validates
2. **Wait for network idle** after navigation to ensure page is fully loaded
3. **Use text selectors** when possible for better readability
4. **Handle conditional states** (like wallet connection) gracefully
5. **Group related tests** in describe blocks

## Example Test for New Feature

```typescript
test.describe('New Feature', () => {
  test('should display feature when enabled', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('text=New Feature')).toBeVisible()
    await page.locator('button:has-text("Use Feature")').click()
    
    await expect(page.locator('text=Feature Result')).toBeVisible()
  })
})
```