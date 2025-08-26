# Seamless Protocol dApp - Accessibility Guidelines

## Overview
This document outlines the comprehensive accessibility implementation for the Seamless Protocol dApp, ensuring WCAG 2.1 AA compliance and providing an inclusive user experience for all users, including those with disabilities.

## Implemented Accessibility Features

### 1. Skip Navigation
- **Skip Links**: Added skip links that allow keyboard users to bypass repetitive navigation
- **Implementation**: `SkipNavigation` component with "Skip to main content" and "Skip to navigation" options
- **Activation**: Links become visible when focused via Tab key

### 2. Semantic HTML Structure
- **Landmarks**: Proper use of `<main>`, `<header>`, `<aside>`, `<nav>` elements
- **Roles**: Explicit ARIA roles where semantic HTML isn't sufficient
- **Structure**: Logical heading hierarchy (h1, h2, h3, etc.)

### 3. ARIA Attributes
- **Labels**: `aria-label` for buttons without visible text
- **Descriptions**: `aria-describedby` for additional context
- **States**: `aria-expanded`, `aria-selected`, `aria-current` for interactive elements
- **Live Regions**: `aria-live` for dynamic content announcements
- **Hidden Elements**: `aria-hidden="true"` for decorative icons

### 4. Keyboard Navigation
- **Full Keyboard Support**: All interactive elements accessible via keyboard
- **Focus Management**: Proper focus indicators and logical tab order
- **Keyboard Shortcuts**: Alt+1-6 for page navigation, Alt+M for mobile menu
- **Focus Trap**: Implemented for modals and dialogs
- **Arrow Key Navigation**: For dropdown menus and tab interfaces

### 5. Screen Reader Support
- **Live Announcements**: Dynamic content changes announced to screen readers
- **Context Information**: Descriptive labels and help text
- **Status Updates**: Network switching and page navigation announcements
- **Error Messages**: Clear error descriptions and recovery instructions

### 6. Visual Accessibility
- **High Contrast**: Dark theme with sufficient color contrast ratios
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Color Independence**: Information not conveyed by color alone
- **Text Scaling**: Responsive design supports text scaling up to 200%

### 7. Mobile Accessibility
- **Touch Targets**: Minimum 44px touch targets for mobile devices
- **Gesture Alternatives**: All gesture-based interactions have alternatives
- **Orientation Support**: Works in both portrait and landscape modes
- **Zoom Support**: Content remains accessible when zoomed to 500%

## Component-Specific Accessibility

### Navigation Component
- **Landmark Role**: `role="navigation"`
- **Current Page**: `aria-current="page"` for active navigation items
- **Keyboard Shortcuts**: Alt+number shortcuts documented in tooltips
- **Mobile Menu**: Proper focus management and ARIA attributes

### Modal Components
- **Focus Trap**: Focus contained within modal when open
- **Initial Focus**: Focus set to first interactive element
- **Escape Key**: ESC key closes modal
- **Background**: Clicking outside modal closes it
- **ARIA Dialog**: Proper dialog role and labeling

### Form Components
- **Labels**: All form inputs have associated labels
- **Error Handling**: Clear error messages with ARIA attributes
- **Validation**: Real-time validation feedback
- **Required Fields**: Marked with asterisks and ARIA attributes

### Charts and Data Visualization
- **Alternative Text**: Descriptive text for chart data
- **Data Tables**: Accessible table markup for tabular data
- **Color Coding**: Patterns and labels supplement color coding
- **Keyboard Navigation**: Arrow keys for chart interaction where applicable

## Accessibility Testing Checklist

### Automated Testing
- [ ] Run axe-core accessibility scanner
- [ ] Use WAVE browser extension
- [ ] Check color contrast ratios (minimum 4.5:1)
- [ ] Validate HTML structure

### Manual Testing
- [ ] Navigate entire app using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Test with high contrast mode
- [ ] Zoom to 200% and verify usability

### User Testing
- [ ] Test with users who have disabilities
- [ ] Gather feedback on screen reader experience
- [ ] Validate keyboard navigation patterns
- [ ] Check mobile accessibility on real devices

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| Tab | Navigate forward through interactive elements |
| Shift+Tab | Navigate backward through interactive elements |
| Enter/Space | Activate buttons and links |
| Escape | Close modals, dropdowns, and overlays |
| Alt+1 | Navigate to Portfolio |
| Alt+2 | Navigate to Explore Strategies |
| Alt+3 | Navigate to Manage Positions |
| Alt+4 | Navigate to Analytics |
| Alt+5 | Navigate to Staking |
| Alt+6 | Navigate to Governance |
| Alt+M | Toggle mobile navigation menu |
| Arrow Keys | Navigate within dropdowns and tabs |
| Home/End | Jump to first/last item in lists |

## Screen Reader Announcements

### Page Navigation
- Announces when user navigates to new page
- Includes page title and description
- Provides context about current location

### Status Changes
- Network switching progress and results
- Wallet connection status changes
- Form validation feedback
- Loading states and completion

### Error Handling
- Clear error descriptions
- Suggested recovery actions
- Non-intrusive error notifications

## Best Practices for Development

### HTML Structure
```html
<!-- Use semantic HTML -->
<main role="main" aria-labelledby="page-title">
  <h1 id="page-title">Page Title</h1>
  <section aria-labelledby="section-title">
    <h2 id="section-title">Section Title</h2>
  </section>
</main>
```

### Button Accessibility
```tsx
<Button
  onClick={handleClick}
  aria-label="Descriptive action"
  aria-describedby="help-text"
  disabled={isLoading}
>
  {isLoading ? 'Loading...' : 'Action'}
</Button>
```

### Form Accessibility
```tsx
<div>
  <Label htmlFor="input-id" className="required">
    Field Name *
  </Label>
  <Input
    id="input-id"
    aria-describedby="input-error input-help"
    aria-invalid={hasError}
    required
  />
  <div id="input-help">Help text</div>
  {hasError && (
    <div id="input-error" role="alert">
      Error message
    </div>
  )}
</div>
```

### Live Regions
```tsx
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

## Maintenance Guidelines

### Regular Audits
- Run accessibility tests monthly
- Update documentation when adding features
- Monitor user feedback for accessibility issues
- Keep up with WCAG updates and best practices

### New Component Requirements
- All new components must pass accessibility audit
- Include keyboard navigation support
- Provide proper ARIA attributes
- Test with screen readers before deployment

### Code Review Checklist
- [ ] Semantic HTML used appropriately
- [ ] ARIA attributes included where needed
- [ ] Keyboard navigation implemented
- [ ] Focus management handled properly
- [ ] Color contrast meets standards
- [ ] Screen reader testing completed

## Resources

### Testing Tools
- [axe-core](https://github.com/dequelabs/axe-core) - Automated accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Colour Contrast Analyser](https://www.paciellogroup.com/resources/contrastanalyser/) - Color contrast checking
- [NVDA](https://www.nvaccess.org/) - Free screen reader for testing

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Support

For accessibility-related questions or issues:
1. Review this documentation
2. Test with accessibility tools
3. Consult WCAG 2.1 guidelines
4. Seek feedback from users with disabilities