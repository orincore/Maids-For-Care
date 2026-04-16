/**
 * Maids For Care Color System
 * Monochrome black and white palette
 */

export const colors = {
  // Primary — black/gray scale
  primary: {
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },

  // Accent — same gray scale
  accent: {
    50:  '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
  },

  // Semantic Colors
  background: {
    primary: '#ffffff',
    secondary: '#f4f4f5',
    tertiary: '#e4e4e7',
  },

  text: {
    primary: '#09090b',
    secondary: '#52525b',
    tertiary: '#a1a1aa',
    inverse: '#ffffff',
  },

  border: {
    light: '#e4e4e7',
    medium: '#d4d4d8',
    dark:  '#a1a1aa',
  },

  // Status Colors
  success: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50:  '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  info: {
    50:  '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
} as const;

// Utility functions for easy color access
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let result: any = colors;
  
  for (const key of keys) {
    result = result[key];
    if (result === undefined) {
      console.warn(`Color path "${path}" not found`);
      return '#000000';
    }
  }
  
  return result;
};

// CSS-in-JS helper for inline styles
export const colorStyles = {
  // Text colors
  textPrimary: { color: colors.text.primary },
  textSecondary: { color: colors.text.secondary },
  textTertiary: { color: colors.text.tertiary },
  textInverse: { color: colors.text.inverse },

  // Background colors
  bgPrimary: { backgroundColor: colors.background.primary },
  bgSecondary: { backgroundColor: colors.background.secondary },
  bgTertiary: { backgroundColor: colors.background.tertiary },
  bgBrand: { backgroundColor: colors.primary[600] },

  // Border colors
  borderLight: { borderColor: colors.border.light },
  borderMedium: { borderColor: colors.border.medium },
  borderDark: { borderColor: colors.border.dark },

  // Input and textarea styles
  input: {
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    borderColor: colors.border.medium,
  },
  inputFocus: {
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    borderColor: colors.primary[950],
    outline: 'none',
    boxShadow: `0 0 0 2px ${colors.primary[950]}20`,
  },
  placeholder: {
    color: colors.text.tertiary,
  },

  // Button styles
  buttonPrimary: {
    backgroundColor: colors.primary[950],
    color: colors.text.inverse,
    borderColor: colors.primary[950],
  },
  buttonSecondary: {
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    borderColor: colors.border.medium,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    color: colors.text.primary,
    borderColor: 'transparent',
  },
} as const;

// Utility function for consistent input styling
export const getInputStyles = () => ({
  backgroundColor: colors.background.primary,
  color: colors.text.primary,
  borderColor: colors.border.medium,
});

// Utility function for consistent input class names
export const getInputClasses = () => 
  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';

// Common color combinations
export const colorCombinations = {
  // Button variants
  button: {
    primary: {
      bg: colors.primary[950], // Pure black
      text: colors.text.inverse,
      hover: colors.primary[800],
      border: colors.primary[950],
    },
    secondary: {
      bg: colors.background.primary,
      text: colors.text.primary,
      hover: colors.background.secondary,
      border: colors.border.medium,
    },
    ghost: {
      bg: 'transparent',
      text: colors.text.primary,
      hover: colors.background.secondary,
      border: 'transparent',
    },
  },

  // Card variants
  card: {
    default: {
      bg: colors.background.primary,
      border: colors.border.light,
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },
    elevated: {
      bg: colors.background.primary,
      border: colors.border.light,
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
  },

  // Navigation
  nav: {
    bg: colors.background.primary,
    border: colors.border.light,
    text: colors.text.primary,
    textHover: colors.text.primary,
    bgHover: colors.background.secondary,
  },

  // Footer
  footer: {
    bg: colors.primary[950], // Pure black
    text: colors.text.inverse,
    textSecondary: colors.primary[400],
    border: colors.primary[800],
  },
} as const;

export default colors;