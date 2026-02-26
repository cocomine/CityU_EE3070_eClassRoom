const lightColors = {
    // Base colors
    background: '#FFFFFF',
    foreground: '#000000',

    // Card colors
    card: '#aeaeaf',
    cardForeground: '#000000',

    // Popover colors
    popover: '#aeaeaf',
    popoverForeground: '#000000',

    // Primary colors
    primary: '#77BEF0',
    primaryForeground: '#171c1e',

    // Secondary colors
    secondary: '#F2F2F7',
    secondaryForeground: '#18181b',

    // Muted colors
    muted: '#78788033',
    mutedForeground: '#71717a',

    // Accent colors
    accent: '#FFCB61',
    accentForeground: '#27221e',

    // Destructive colors
    destructive: '#ef4444',
    destructiveForeground: '#FFFFFF',

    // Border and input
    border: '#77BEF0',
    input: '#ccdfed',
    ring: '#7a8a9a',

    // Text colors
    text: '#000000',
    textMuted: '#71717a',

    // Legacy support for existing components
    tint: '#18181b',
    icon: '#71717a',
    tabIconDefault: '#71717a',
    tabIconSelected: '#18181b',

    // Default buttons, links, Send button, selected tabs
    blue: '#007AFF',

    // Success states, FaceTime buttons, completed tasks
    green: '#34C759',

    // Delete buttons, error states, critical alerts
    red: '#FF3B30',

    // VoiceOver highlights, warning states
    orange: '#FF9500',

    // Notes app accent, Reminders highlights
    yellow: '#FFCC00',

    // Pink accent color for various UI elements
    pink: '#FF2D92',

    // Purple accent for creative apps and features
    purple: '#AF52DE',

    // Teal accent for communication features
    teal: '#5AC8FA',

    // Indigo accent for system features
    indigo: '#5856D6',
};

const darkColors = {
    // Base colors
    background: '#171717',
    foreground: '#FFFFFF',

    // Card colors
    card: '#424242',
    cardForeground: '#FFFFFF',

    // Popover colors
    popover: '#424242',
    popoverForeground: '#FFFFFF',

    // Primary colors
    primary: '#77BEF0',
    primaryForeground: '#171c1e',

    // Secondary colors
    secondary: '#1C1C1E',
    secondaryForeground: '#FFFFFF',

    // Muted colors
    muted: '#78788033',
    mutedForeground: '#a1a1aa',

    // Accent colors
    accent: '#FFCB61',
    accentForeground: '#27221e',

    // Destructive colors
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Border and input - using alpha values for better blending
    border: '#77BEF0',
    input: 'rgba(119,190,240,0.15)',
    ring: '#4e5a61',

    // Text colors
    text: '#FFFFFF',
    textMuted: '#a1a1aa',

    // Legacy support for existing components
    tint: '#FFFFFF',
    icon: '#a1a1aa',
    tabIconDefault: '#a1a1aa',
    tabIconSelected: '#FFFFFF',

    // Default buttons, links, Send button, selected tabs
    blue: '#0A84FF',

    // Success states, FaceTime buttons, completed tasks
    green: '#30D158',

    // Delete buttons, error states, critical alerts
    red: '#FF453A',

    // VoiceOver highlights, warning states
    orange: '#FF9F0A',

    // Notes app accent, Reminders highlights
    yellow: '#FFD60A',

    // Pink accent color for various UI elements
    pink: '#FF375F',

    // Purple accent for creative apps and features
    purple: '#BF5AF2',

    // Teal accent for communication features
    teal: '#64D2FF',

    // Indigo accent for system features
    indigo: '#5E5CE6',
};

export const Colors = {
    light: lightColors,
    dark: darkColors,
};

// Export individual color schemes for easier access
export { darkColors, lightColors };

// Utility type for color keys
export type ColorKeys = keyof typeof lightColors;