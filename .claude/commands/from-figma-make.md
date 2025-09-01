# From Figma Make

Extract and generate pixel-perfect React components from existing Figma Make designs with automated visual validation using the `complete-component-workflow.ts` script.

## Usage

```bash
/from-figma-make [figma-component-identifier] [OutputComponentName]
```

## Examples

```bash
/from-figma-make "StrategyCard" "LeverageTokenCard"
/from-figma-make "ExploreStrategies" "StrategyExplorer"
/from-figma-make "CurrentHoldings" "CurrentHoldingsCard"
```

## What it does

Executes the `scripts/complete-component-workflow.ts` automation script which:

1. **Reads component from _figma folder**
   - Searches for matching Figma Make components using the identifier
   - Extracts styling and structure from Make files
   - Converts design tokens to Tailwind classes

2. **Creates production-ready React component**
   - Uses existing UI primitives (Card, Button, etc.)
   - Follows project conventions and file structure
   - Includes proper test IDs for automation
   - Places component in appropriate feature folder based on context

3. **Generates Storybook story**
   - Places in correct feature folder structure
   - Creates multiple story variants
   - Includes proper TypeScript types

4. **Performs visual validation**
   - Captures screenshots from Figma, Storybook, and dev server
   - Generates comparison reports with pixel-perfect analysis
   - Provides actionable recommendations for fixes

5. **Iterates until perfect match**
   - Automatically applies styling fixes
   - Re-runs comparisons after each change
   - Continues until visual parity is achieved

## Requirements

- Component must exist in the _figma folder
- Figma Make files must be accessible locally
- Existing UI components available for composition
- `complete-component-workflow.ts` script must be present in scripts folder

## Output

Output location depends on the feature context:

- **Leverage tokens**: `src/features/leverage-tokens/components/[ComponentName].tsx`
- **Vaults**: `src/features/vaults/components/[ComponentName].tsx`
- **General UI**: `src/components/[ComponentName].tsx`

Plus:
- Storybook story in appropriate feature folder
- `visual-comparisons/` - Comparison screenshots and reports
- Automated fixes applied until pixel-perfect match achieved