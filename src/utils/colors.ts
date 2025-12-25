// Apple System UI Color Palette (adapted for web)
// These colors are inspired by Apple's Human Interface Guidelines

export const appleColors = {
  // Primary Colors
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  mint: '#00C7BE',
  teal: '#30B0C7',
  cyan: '#32ADE6',
  blue: '#007AFF',
  indigo: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  brown: '#A2845E',
  
  // Grays
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  
  // System colors
  systemBackground: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  tertiaryBackground: '#FFFFFF',
  
  // Label colors
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  quaternaryLabel: '#3C3C434D',
};

// Rainbow color sequence for Khmer character types
export const rainbowPalette = [
  appleColors.red,
  appleColors.orange,
  appleColors.yellow,
  appleColors.green,
  appleColors.teal,
  appleColors.blue,
  appleColors.indigo,
  appleColors.purple,
  appleColors.pink,
];

// Softer pastel versions for backgrounds
export const softRainbowPalette = [
  '#FFEBEE', // soft red
  '#FFF3E0', // soft orange
  '#FFFDE7', // soft yellow
  '#E8F5E9', // soft green
  '#E0F7FA', // soft teal
  '#E3F2FD', // soft blue
  '#EDE7F6', // soft indigo
  '#F3E5F5', // soft purple
  '#FCE4EC', // soft pink
];

// Color assignments for different Khmer character types
export const charTypeColors = {
  consonant: appleColors.blue,
  subscript: appleColors.purple,
  vowel: appleColors.green,
  indep_vowel: appleColors.teal,
  sign: appleColors.orange,
  numeral: appleColors.pink,
  punctuation: appleColors.gray,
  coeng: appleColors.indigo,
  space: 'transparent',
  other: appleColors.gray2,
};

// Soft background colors for character types
export const charTypeBgColors = {
  consonant: '#E3F2FD',
  subscript: '#F3E5F5',
  vowel: '#E8F5E9',
  indep_vowel: '#E0F7FA',
  sign: '#FFF3E0',
  numeral: '#FCE4EC',
  punctuation: '#F5F5F5',
  coeng: '#EDE7F6',
  space: 'transparent',
  other: '#FAFAFA',
};

/**
 * Get a rainbow color based on index
 */
export function getRainbowColor(index: number): string {
  return rainbowPalette[index % rainbowPalette.length];
}

/**
 * Get a soft rainbow color based on index
 */
export function getSoftRainbowColor(index: number): string {
  return softRainbowPalette[index % softRainbowPalette.length];
}

