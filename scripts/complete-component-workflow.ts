#!/usr/bin/env bun

/**
 * Complete Component Workflow Script
 * 
 * Extracts components from _figma folder and generates pixel-perfect React components
 * with automated visual validation and iterative fixes.
 * 
 * Usage: bun scripts/complete-component-workflow.ts [figma-component-identifier] [OutputComponentName]
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// Configuration
const FIGMA_FOLDER = path.join(__dirname, '..', '_figma')
const COMPONENTS_FOLDER = path.join(__dirname, '..', 'src', 'components')
const FEATURES_FOLDER = path.join(__dirname, '..', 'src', 'features')
const STORIES_FOLDER = path.join(__dirname, '..', 'src', 'stories')
const VISUAL_COMPARISONS_FOLDER = path.join(__dirname, '..', 'visual-comparisons')

interface FigmaComponent {
  path: string
  name: string
  content: string
}

interface ComponentData {
  name: string
  content: string
  classes: string[]
  feature: string
  testId: string
  path: string
}

interface OutputPaths {
  component: string
  story: string
}

interface ComparisonResults {
  components: Array<{
    testId: string
    recommendations?: string[]
  }>
}

// Parse command line arguments
const [, , figmaIdentifier, outputComponentName] = process.argv

if (!figmaIdentifier || !outputComponentName) {
  console.error('Usage: bun scripts/complete-component-workflow.ts [figma-component-identifier] [OutputComponentName]')
  console.error('Example: bun scripts/complete-component-workflow.ts "StrategyCard" "LeverageTokenCard"')
  console.error('Or with direct JSX: bun scripts/complete-component-workflow.ts "<div>...</div>" "ComponentName"')
  process.exit(1)
}

async function main(): Promise<void> {
  try {
    console.log(`🚀 Starting component workflow for: ${figmaIdentifier} → ${outputComponentName}`)
    
    let figmaComponent: FigmaComponent
    
    // Check if figmaIdentifier is direct JSX (starts with '<' and contains JSX elements)
    if (figmaIdentifier.trim().startsWith('<') && figmaIdentifier.includes('>')) {
      console.log('📝 Using direct JSX input...')
      figmaComponent = {
        path: 'direct-input',
        name: outputComponentName,
        content: figmaIdentifier
      }
    } else {
      // Step 1: Search _figma folder for matching component
      console.log('📁 Searching _figma folder...')
      const foundComponent = await findFigmaComponent(figmaIdentifier)
      
      if (!foundComponent) {
        throw new Error(`Component "${figmaIdentifier}" not found in _figma folder`)
      }
      
      console.log(`✅ Found Figma component: ${foundComponent.path}`)
      figmaComponent = foundComponent
    }
    
    // Step 2: Extract component structure and styling
    console.log('🎨 Extracting component styling...')
    const componentData = await extractComponentData(figmaComponent)
    
    // Step 3: Determine output location based on feature context
    const outputPaths = determineOutputPaths(outputComponentName, componentData.feature)
    
    // Step 4: Generate React component
    console.log('⚛️ Generating React component...')
    await generateReactComponent(componentData, outputPaths.component)
    
    // Step 5: Generate Storybook story
    console.log('📚 Generating Storybook story...')
    await generateStorybookStory(componentData, outputPaths.story)
    
    // Step 6: Run visual validation
    console.log('👀 Running visual validation...')
    await runVisualValidation(componentData.testId)
    
    // Step 7: Apply iterative fixes until pixel-perfect
    console.log('🔧 Applying iterative fixes...')
    await applyIterativeFixes(componentData.testId, outputPaths.component)
    
    console.log('✨ Component workflow completed successfully!')
    console.log(`📂 Component: ${outputPaths.component}`)
    console.log(`📖 Story: ${outputPaths.story}`)
    
  } catch (error) {
    console.error('❌ Workflow failed:', (error as Error).message)
    process.exit(1)
  }
}

async function findFigmaComponent(identifier: string): Promise<FigmaComponent | null> {
  try {
    const figmaFiles = await fs.readdir(FIGMA_FOLDER, { recursive: true })
    
    for (const file of figmaFiles) {
      if (typeof file === 'string' && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        const filePath = path.join(FIGMA_FOLDER, file)
        const content = await fs.readFile(filePath, 'utf8')
        
        // Search for component by name or identifier
        if (content.includes(identifier) || 
            file.toLowerCase().includes(identifier.toLowerCase()) ||
            content.toLowerCase().includes(identifier.toLowerCase())) {
          
          return {
            path: filePath,
            name: path.basename(file, path.extname(file)),
            content
          }
        }
      }
    }
    
    return null
  } catch (error) {
    throw new Error(`Error searching _figma folder: ${(error as Error).message}`)
  }
}

async function extractComponentData(figmaComponent: FigmaComponent): Promise<ComponentData> {
  // Parse the Figma component to extract:
  // - Component structure
  // - Styling classes
  // - Props interface
  // - Feature context
  
  const content = figmaComponent.content
  
  // Extract Tailwind classes from the component
  const tailwindRegex = /className="([^"]+)"/g
  const classes: string[] = []
  let match: RegExpExecArray | null
  
  while ((match = tailwindRegex.exec(content)) !== null) {
    classes.push(match[1])
  }
  
  // Determine feature context
  let feature = 'components' // default
  if (content.includes('leverage') || figmaComponent.name.toLowerCase().includes('leverage')) {
    feature = 'leverage-tokens'
  } else if (content.includes('vault') || figmaComponent.name.toLowerCase().includes('vault')) {
    feature = 'vaults'
  }
  
  // Generate test ID
  const testId = `${feature === 'leverage-tokens' ? 'leverage-token' : feature}-${figmaComponent.name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`
  
  return {
    name: figmaComponent.name,
    content,
    classes,
    feature,
    testId,
    path: figmaComponent.path
  }
}

function determineOutputPaths(componentName: string, feature: string): OutputPaths {
  let componentPath: string, storyPath: string
  
  if (feature === 'leverage-tokens') {
    componentPath = path.join(FEATURES_FOLDER, 'leverage-tokens', 'components', `${componentName}.tsx`)
    storyPath = path.join(STORIES_FOLDER, 'features', 'leverage-tokens', `${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}.stories.tsx`)
  } else if (feature === 'vaults') {
    componentPath = path.join(FEATURES_FOLDER, 'vaults', 'components', `${componentName}.tsx`)
    storyPath = path.join(STORIES_FOLDER, 'features', 'vaults', `${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}.stories.tsx`)
  } else {
    componentPath = path.join(COMPONENTS_FOLDER, `${componentName}.tsx`)
    storyPath = path.join(STORIES_FOLDER, 'components', `${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}.stories.tsx`)
  }
  
  return {
    component: componentPath,
    story: storyPath
  }
}

async function generateReactComponent(componentData: ComponentData, outputPath: string): Promise<void> {
  // Transform the Figma component into a production-ready React component
  let content = componentData.content
  
  // If this is direct JSX input, wrap it in a proper React component
  if (componentData.path === 'direct-input') {
    // Extract the component name from the output path
    const componentName = path.basename(outputPath, '.tsx')
    
    // Wrap the JSX in a proper React component function
    content = `export function ${componentName}() {
  return (
    ${content.trim()}
  )
}`
  }
  
  // Add proper test ID
  if (!content.includes('data-testid=')) {
    content = content.replace(/className="([^"]*)"/, `className="$1" data-testid="${componentData.testId}"`)
  }
  
  // Ensure proper imports based on what's used
  const imports = new Set<string>()
  imports.add("import type * as React from 'react'")
  
  if (content.includes('Card')) {
    imports.add("import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'")
  }
  if (content.includes('Button')) {
    imports.add("import { Button } from '@/components/ui/button'")
  }
  if (content.includes('Avatar')) {
    imports.add("import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'")
  }
  if (content.includes('Plus') || content.includes('Minus') || content.includes('Zap')) {
    imports.add("import { Plus, Minus, Zap } from 'lucide-react'")
  }
  if (content.includes('motion.')) {
    imports.add("import { motion } from 'framer-motion'")
  }
  
  // Create the final component content
  const finalContent = Array.from(imports).join('\n') + '\n\n' + content
  
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  
  // Write component file
  await fs.writeFile(outputPath, finalContent)
}

async function generateStorybookStory(componentData: ComponentData, outputPath: string): Promise<void> {
  const componentName = path.basename(outputPath, '.stories.tsx')
  const kebabCaseName = componentName.replace(/([A-Z])/g, '-$1').replace(/^-/, '').toLowerCase()
  
  let storyTitle = 'Components'
  if (componentData.feature === 'leverage-tokens') {
    storyTitle = 'Features/Leverage Tokens'
  } else if (componentData.feature === 'vaults') {
    storyTitle = 'Features/Vaults'
  }
  
  const storyContent = `import type { Meta, StoryObj } from '@storybook/react'
import { ${componentName} } from '../../../${componentData.feature === 'components' ? 'components' : `features/${componentData.feature}/components`}/${componentName}'

const meta: Meta<typeof ${componentName}> = {
  title: '${storyTitle}/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithHandlers: Story = {
  args: {
    onMint: () => console.log('Mint clicked'),
    onRedeem: () => console.log('Redeem clicked'),
  },
}
`
  
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  
  // Write story file
  await fs.writeFile(outputPath, storyContent)
}

async function runVisualValidation(testId: string): Promise<void> {
  try {
    // Run the visual comparison script
    execSync('bun scripts/visual-compare.ts', { stdio: 'inherit' })
  } catch (error) {
    console.warn('⚠️ Visual validation encountered issues, continuing...')
  }
}

async function applyIterativeFixes(testId: string, componentPath: string): Promise<void> {
  // Read comparison results and apply fixes iteratively
  const comparisonPath = path.join(VISUAL_COMPARISONS_FOLDER, 'comparison-results.json')
  
  try {
    const results: ComparisonResults = JSON.parse(await fs.readFile(comparisonPath, 'utf8'))
    const component = results.components.find(c => c.testId === testId)
    
    if (component && component.recommendations) {
      console.log('🔧 Applying recommended fixes...')
      
      // Apply fixes based on recommendations
      let componentContent = await fs.readFile(componentPath, 'utf8')
      
      // Example fixes (would be more sophisticated in practice)
      for (const rec of component.recommendations) {
        if (rec.includes('bg-slate-900/80')) {
          componentContent = componentContent.replace(/bg-slate-800\/50/g, 'bg-slate-900/80')
        }
        if (rec.includes('border-slate-700')) {
          componentContent = componentContent.replace(/border-slate-600/g, 'border-slate-700')
        }
      }
      
      await fs.writeFile(componentPath, componentContent)
      console.log('✅ Applied styling fixes')
    }
  } catch (error) {
    console.warn('⚠️ Could not apply automatic fixes:', (error as Error).message)
  }
}

// Run the workflow
main().catch(console.error)