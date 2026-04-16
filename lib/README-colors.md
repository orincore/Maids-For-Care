# Maids For Care Color System

This document explains how to use the centralized color system in the Maids For Care application.

## Overview

The color system is defined in `lib/colors.ts` and provides a consistent way to manage colors throughout the application. The primary color is **pure black (#000000)** instead of the previous gray-based colors.

**IMPORTANT**: All text inputs and textareas now use pure black text on white backgrounds for maximum visibility and readability.

## Usage

### Import the colors

```typescript
import { colors, colorStyles, colorCombinations, getInputStyles } from '@/lib/colors';
```

### Using colors in inline styles

```typescript
// Direct color access
<div style={{ backgroundColor: colors.primary[950], color: colors.text.inverse }}>
  Pure black background with white text
</div>

// Using predefined styles
<div style={colorStyles.bgBlack}>
  <span style={colorStyles.textInverse}>White text on black background</span>
</div>
```

### Input and Textarea Styling

```typescript
// Using the input utility function
<input style={getInputStyles()} />

// Using predefined input styles
<input style={colorStyles.input} />

// Manual styling for inputs
<input style={{
  backgroundColor: colors.background.primary,
  color: colors.text.primary,
  borderColor: colors.border.medium,
}} />
```

### Using color combinations

```typescript
// Button styling
<button style={colorCombinations.button.primary.bg}>
  Primary Button
</button>

// Navigation styling
<nav style={{ backgroundColor: colorCombinations.nav.bg }}>
  Navigation
</nav>
```

## Color Palette

### Primary Colors (Grayscale to Pure Black)
- `colors.primary[50]` - Lightest gray (#f8f9fa)
- `colors.primary[100]` - Very light gray (#f1f3f4)
- `colors.primary[200]` - Light gray (#e8eaed)
- `colors.primary[300]` - Medium light gray (#dadce0)
- `colors.primary[400]` - Medium gray (#bdc1c6)
- `colors.primary[500]` - Gray (#9aa0a6)
- `colors.primary[600]` - Medium dark gray (#80868b)
- `colors.primary[700]` - Dark gray (#5f6368)
- `colors.primary[800]` - Very dark gray (#3c4043)
- `colors.primary[900]` - Almost black (#202124)
- `colors.primary[950]` - **Pure black (#000000)** ⭐ Main brand color

### Text Colors
- `colors.text.primary` - Pure black for main text (#000000)
- `colors.text.secondary` - Gray for secondary text (#5f6368)
- `colors.text.tertiary` - Light gray for tertiary text (#9aa0a6)
- `colors.text.inverse` - White for text on dark backgrounds (#ffffff)

### Background Colors
- `colors.background.primary` - White (#ffffff)
- `colors.background.secondary` - Very light gray (#f8f9fa)
- `colors.background.tertiary` - Light gray (#f1f3f4)

### Status Colors
- Success: Green variants (`colors.success[50-900]`)
- Warning: Orange variants (`colors.warning[50-900]`)
- Error: Red variants (`colors.error[50-900]`)
- Info: Blue variants (`colors.info[50-900]`)

## Quick Reference Styles

### Buttons
```typescript
// Primary button (black background, white text)
style={colorStyles.buttonPrimary}

// Secondary button (white background, black text, gray border)
style={colorStyles.buttonSecondary}

// Ghost button (transparent background, black text)
style={colorStyles.buttonGhost}
```

### Text
```typescript
// Primary text (pure black)
style={colorStyles.textPrimary}

// Secondary text (gray)
style={colorStyles.textSecondary}

// White text (for dark backgrounds)
style={colorStyles.textInverse}
```

### Inputs and Textareas
```typescript
// Standard input styling (white background, black text)
style={colorStyles.input}

// Using utility function
style={getInputStyles()}

// Input classes
className={getInputClasses()}
```

### Backgrounds
```typescript
// Pure black background
style={colorStyles.bgBlack}

// White background
style={colorStyles.bgPrimary}

// Light gray background
style={colorStyles.bgSecondary}
```

## Global CSS Overrides

The application includes global CSS rules in `app/globals.css` to ensure all inputs and textareas are always visible:

```css
/* All inputs use black text on white background */
input, textarea, select {
  color: #000000 !important;
  background-color: #ffffff !important;
}

/* Placeholders are light gray */
input::placeholder, textarea::placeholder {
  color: #9aa0a6 !important;
}
```

## Examples

### Navigation Bar
```typescript
<nav style={{ 
  backgroundColor: colors.background.primary,
  borderColor: colors.border.light 
}}>
  <button style={{
    color: colors.text.primary,
    backgroundColor: 'transparent'
  }}>
    Menu Item
  </button>
</nav>
```

### Footer
```typescript
<footer style={{ 
  backgroundColor: colors.primary[950], // Pure black
  color: colors.text.inverse // White text
}}>
  <p style={{ color: colors.primary[400] }}>
    Secondary text in footer
  </p>
</footer>
```

### Forms
```typescript
<form>
  <input 
    type="text"
    style={getInputStyles()}
    className={getInputClasses()}
    placeholder="Enter text here"
  />
  <textarea 
    style={getInputStyles()}
    className={getInputClasses()}
    placeholder="Enter description"
  />
</form>
```

### Cards
```typescript
<div style={{
  backgroundColor: colors.background.primary,
  borderColor: colors.border.light,
  boxShadow: colorCombinations.card.default.shadow
}}>
  Card content
</div>
```

## Migration Notes

When updating existing components:

1. Replace `bg-gray-900` with `colors.primary[950]` (pure black)
2. Replace `text-gray-900` with `colors.text.primary`
3. Replace `text-gray-600` with `colors.text.secondary`
4. Replace `bg-white` with `colors.background.primary`
5. Replace `bg-gray-50` with `colors.background.secondary`
6. **For inputs/textareas**: Use `getInputStyles()` or `colorStyles.input`

## Best Practices

1. **Always use the color system** instead of hardcoded colors
2. **Use semantic color names** (text.primary, background.secondary) rather than numeric values when possible
3. **Test input visibility** - all text should be clearly readable
4. **Use colorStyles** for common patterns to maintain consistency
5. **Document custom color combinations** if you create new ones

## Accessibility

The color system is designed with accessibility in mind:
- Pure black (#000000) provides maximum contrast with white text
- Gray levels are carefully chosen for readability
- Status colors meet WCAG contrast requirements
- **All form inputs use high contrast black text on white backgrounds**

Always test your color combinations for accessibility compliance.