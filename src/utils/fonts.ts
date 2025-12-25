// Khmer Font Collection
// Categorized by style: Traditional (ornate curves) vs Modern (clean lines)
//
// LAZY LOADING STRATEGY:
// - Noto Sans Khmer is loaded by default in index.css
// - Other fonts are loaded on-demand when selected via loadFont()
// - This saves ~400-500KB on initial page load

export interface KhmerFont {
  name: string;
  family: string;
  style: 'traditional' | 'modern' | 'decorative' | 'handwritten';
  description: string;
  googleFont?: boolean;
  weights?: number[];
  loaded?: boolean;
}

// Font registry - all available fonts
export const khmerFonts: KhmerFont[] = [
  // Modern fonts (clean, good for digital)
  {
    name: 'Noto Sans Khmer',
    family: 'Noto Sans Khmer',
    style: 'modern',
    description: 'Clean sans-serif for digital readability',
    googleFont: true,
    weights: [400, 500, 600, 700],
    loaded: true, // Loaded by default
  },
  {
    name: 'Kantumruy Pro',
    family: 'Kantumruy Pro',
    style: 'modern',
    description: 'Geometric modern with clean lines',
    googleFont: true,
    weights: [400, 500, 600, 700],
  },
  {
    name: 'Content',
    family: 'Content',
    style: 'modern',
    description: 'Optimized for body text, balanced proportions',
    googleFont: true,
    weights: [400, 700],
  },

  // Traditional fonts (ornate, curved)
  {
    name: 'Noto Serif Khmer',
    family: 'Noto Serif Khmer',
    style: 'traditional',
    description: 'Elegant serif with traditional curved strokes',
    googleFont: true,
    weights: [400, 500, 600, 700],
  },
  {
    name: 'Battambang',
    family: 'Battambang',
    style: 'traditional',
    description: 'Classic Khmer style with pronounced curves',
    googleFont: true,
    weights: [400, 700],
  },
  {
    name: 'Hanuman',
    family: 'Hanuman',
    style: 'traditional',
    description: 'Traditional with strong vertical emphasis',
    googleFont: true,
    weights: [400, 700],
  },
  {
    name: 'Suwannaphum',
    family: 'Suwannaphum',
    style: 'traditional',
    description: 'Elegant traditional with refined curves',
    googleFont: true,
    weights: [400, 700],
  },
  {
    name: 'Odor Mean Chey',
    family: 'Odor Mean Chey',
    style: 'traditional',
    description: 'Traditional with distinctive character',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Siemreap',
    family: 'Siemreap',
    style: 'traditional',
    description: 'Named after Siem Reap, classic style',
    googleFont: true,
    weights: [400],
  },

  // Decorative fonts (display, headlines)
  {
    name: 'Moul',
    family: 'Moul',
    style: 'decorative',
    description: 'Ornate ceremonial style, temple inscriptions',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Koulen',
    family: 'Koulen',
    style: 'decorative',
    description: 'Bold display font with Angkorian influence',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Bokor',
    family: 'Bokor',
    style: 'decorative',
    description: 'Display font with strong presence',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Dangrek',
    family: 'Dangrek',
    style: 'decorative',
    description: 'Bold display, mountain-inspired',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Taprom',
    family: 'Taprom',
    style: 'decorative',
    description: 'Temple-inspired, Ta Prohm aesthetic',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Metal',
    family: 'Metal',
    style: 'decorative',
    description: 'Heavy display, industrial feel',
    googleFont: true,
    weights: [400],
  },
  {
    name: 'Preahvihear',
    family: 'Preahvihear',
    style: 'decorative',
    description: 'Preah Vihear temple-inspired display',
    googleFont: true,
    weights: [400],
  },

  // Handwritten / Casual
  {
    name: 'Fasthand',
    family: 'Fasthand',
    style: 'handwritten',
    description: 'Casual handwritten style',
    googleFont: true,
    weights: [400],
  },
];

// Track which fonts have been loaded
const loadedFonts = new Set<string>(['Noto Sans Khmer']);

/**
 * Load a font on demand
 * Returns a promise that resolves when the font is ready
 */
export async function loadFont(font: KhmerFont): Promise<void> {
  if (loadedFonts.has(font.family)) {
    return; // Already loaded
  }

  if (!font.googleFont) {
    return; // Not a Google font, assume it's available
  }

  const weights = font.weights?.join(';') || '400';
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@${weights}&display=swap`;

  // Check if link already exists
  const existingLink = document.querySelector(`link[href="${url}"]`);
  if (existingLink) {
    loadedFonts.add(font.family);
    return;
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    link.onload = () => {
      loadedFonts.add(font.family);
      // Mark as loaded in the registry
      const idx = khmerFonts.findIndex(f => f.family === font.family);
      if (idx !== -1) {
        khmerFonts[idx].loaded = true;
      }
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load font: ${font.family}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Check if a font is loaded
 */
export function isFontLoaded(font: KhmerFont): boolean {
  return loadedFonts.has(font.family);
}

/**
 * Group fonts by style
 */
export function getFontsByStyle(): Record<string, KhmerFont[]> {
  return khmerFonts.reduce((acc, font) => {
    if (!acc[font.style]) acc[font.style] = [];
    acc[font.style].push(font);
    return acc;
  }, {} as Record<string, KhmerFont[]>);
}

// Style labels for UI
export const styleLabels: Record<string, string> = {
  traditional: 'Traditional',
  modern: 'Modern',
  decorative: 'Decorative',
  handwritten: 'Handwritten',
};
