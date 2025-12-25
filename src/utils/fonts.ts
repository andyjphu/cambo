// Khmer Font Collection
// Categorized by style: Traditional (ornate curves) vs Modern (clean lines)

export interface KhmerFont {
  name: string;
  family: string;
  style: 'traditional' | 'modern' | 'decorative' | 'handwritten';
  description: string;
  googleFont?: boolean;
  weights?: number[];
}

export const khmerFonts: KhmerFont[] = [
  // Traditional fonts with ornate, curved letterforms
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
  
  // Modern fonts with cleaner, simplified forms
  {
    name: 'Noto Sans Khmer',
    family: 'Noto Sans Khmer',
    style: 'modern',
    description: 'Clean sans-serif for digital readability',
    googleFont: true,
    weights: [400, 500, 600, 700],
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
  
  // Handwritten / Casual
  {
    name: 'Fasthand',
    family: 'Fasthand',
    style: 'handwritten',
    description: 'Casual handwritten style',
    googleFont: true,
    weights: [400],
  },
  
  // Additional traditional options
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
];

// Generate Google Fonts URL for all fonts
export function getGoogleFontsUrl(): string {
  const families = khmerFonts
    .filter(f => f.googleFont)
    .map(f => {
      const weights = f.weights?.join(';') || '400';
      return `family=${encodeURIComponent(f.family)}:wght@${weights}`;
    })
    .join('&');
  
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// Group fonts by style
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

