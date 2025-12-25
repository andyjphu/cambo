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

// Apple System UI colors for syllable-based highlighting
// Each syllable gets a unique color family
// Background shades vary by component type (darker = base consonant, lighter = diacritics)
export const syllableColorPalette = [
  { // Blue
    accent: '#007AFF',
    bgDark: 'rgba(0, 122, 255, 0.25)',    // Base consonant
    bgMedium: 'rgba(0, 122, 255, 0.15)',  // Subscript/coeng
    bgLight: 'rgba(0, 122, 255, 0.08)',   // Vowel/sign
  },
  { // Green
    accent: '#34C759',
    bgDark: 'rgba(52, 199, 89, 0.25)',
    bgMedium: 'rgba(52, 199, 89, 0.15)',
    bgLight: 'rgba(52, 199, 89, 0.08)',
  },
  { // Purple
    accent: '#AF52DE',
    bgDark: 'rgba(175, 82, 222, 0.25)',
    bgMedium: 'rgba(175, 82, 222, 0.15)',
    bgLight: 'rgba(175, 82, 222, 0.08)',
  },
  { // Orange
    accent: '#FF9500',
    bgDark: 'rgba(255, 149, 0, 0.25)',
    bgMedium: 'rgba(255, 149, 0, 0.15)',
    bgLight: 'rgba(255, 149, 0, 0.08)',
  },
  { // Pink
    accent: '#FF2D55',
    bgDark: 'rgba(255, 45, 85, 0.25)',
    bgMedium: 'rgba(255, 45, 85, 0.15)',
    bgLight: 'rgba(255, 45, 85, 0.08)',
  },
  { // Indigo
    accent: '#5856D6',
    bgDark: 'rgba(88, 86, 214, 0.25)',
    bgMedium: 'rgba(88, 86, 214, 0.15)',
    bgLight: 'rgba(88, 86, 214, 0.08)',
  },
  { // Teal
    accent: '#00C7BE',
    bgDark: 'rgba(0, 199, 190, 0.25)',
    bgMedium: 'rgba(0, 199, 190, 0.15)',
    bgLight: 'rgba(0, 199, 190, 0.08)',
  },
  { // Red
    accent: '#FF3B30',
    bgDark: 'rgba(255, 59, 48, 0.25)',
    bgMedium: 'rgba(255, 59, 48, 0.15)',
    bgLight: 'rgba(255, 59, 48, 0.08)',
  },
];

export interface SyllableColor {
  accent: string;    // Accent color for borders/highlights
  bgDark: string;    // Background for base consonant
  bgMedium: string;  // Background for subscript/coeng
  bgLight: string;   // Background for vowel/sign
}

/**
 * Get syllable color scheme based on cluster index
 */
export function getSyllableColor(clusterIndex: number): SyllableColor {
  return syllableColorPalette[clusterIndex % syllableColorPalette.length];
}

/**
 * Get component BACKGROUND color within a syllable based on component type
 * Text color stays consistent (readable), background varies
 */
export function getComponentBgColor(
  clusterIndex: number, 
  componentType: keyof typeof charTypeColors
): string {
  const syllable = getSyllableColor(clusterIndex);
  
  switch (componentType) {
    case 'consonant':
    case 'indep_vowel':
      return syllable.bgDark;
    case 'subscript':
    case 'coeng':
      return syllable.bgMedium;
    case 'vowel':
    case 'sign':
    case 'numeral':
      return syllable.bgLight;
    case 'space':
      return 'transparent';
    default:
      return syllable.bgMedium;
  }
}

/**
 * Get accent color for syllable (for borders, highlights)
 */
export function getSyllableAccent(clusterIndex: number): string {
  return getSyllableColor(clusterIndex).accent;
}

