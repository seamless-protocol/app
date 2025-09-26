import React from 'react'
import { ThemeProvider, ThemeToggle } from './ThemeDecorator'

export const withTheme = (Story: any) => (
  <ThemeProvider>
    <ThemeToggle></ThemeToggle>
    <Story />
  </ThemeProvider>
)
