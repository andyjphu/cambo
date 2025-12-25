/**
 * ALA-LC (American Library Association - Library of Congress) Romanization for Khmer
 * Based on the official ALA-LC Romanization Tables for Khmer
 * https://www.loc.gov/catdir/cpso/romanization/khmer.pdf
 * 
 * This implementation provides phonetic romanization with stress markers.
 */

import type { KhmerComponent, KhmerCharType } from './khmerParser';

// Consonant romanization (ALA-LC standard)
export const consonantRomanization: Record<string, { 
  initial: string; 
  final: string; 
  series: 1 | 2;
  name: string;
}> = {
  'ក': { initial: 'k', final: 'k', series: 1, name: 'ka' },
  'ខ': { initial: 'kh', final: 'k', series: 1, name: 'kha' },
  'គ': { initial: 'k', final: 'k', series: 2, name: 'ko' },
  'ឃ': { initial: 'kh', final: 'k', series: 2, name: 'kho' },
  'ង': { initial: 'ng', final: 'ng', series: 2, name: 'ngo' },
  'ច': { initial: 'ch', final: 'ch', series: 1, name: 'cha' },
  'ឆ': { initial: 'chh', final: 'ch', series: 1, name: 'chha' },
  'ជ': { initial: 'ch', final: 'ch', series: 2, name: 'cho' },
  'ឈ': { initial: 'chh', final: 'ch', series: 2, name: 'chho' },
  'ញ': { initial: 'ñ', final: 'nh', series: 2, name: 'nyo' },
  'ដ': { initial: 'd', final: 't', series: 1, name: 'da' },
  'ឋ': { initial: 'th', final: 't', series: 1, name: 'tha' },
  'ឌ': { initial: 'd', final: 't', series: 2, name: 'do' },
  'ឍ': { initial: 'th', final: 't', series: 2, name: 'tho' },
  'ណ': { initial: 'n', final: 'n', series: 1, name: 'na' },
  'ត': { initial: 't', final: 't', series: 1, name: 'ta' },
  'ថ': { initial: 'th', final: 't', series: 1, name: 'tha' },
  'ទ': { initial: 't', final: 't', series: 2, name: 'to' },
  'ធ': { initial: 'th', final: 't', series: 2, name: 'tho' },
  'ន': { initial: 'n', final: 'n', series: 2, name: 'no' },
  'ប': { initial: 'b', final: 'p', series: 1, name: 'ba' },
  'ផ': { initial: 'ph', final: 'p', series: 1, name: 'pha' },
  'ព': { initial: 'p', final: 'p', series: 2, name: 'po' },
  'ភ': { initial: 'ph', final: 'p', series: 2, name: 'pho' },
  'ម': { initial: 'm', final: 'm', series: 2, name: 'mo' },
  'យ': { initial: 'y', final: 'y', series: 2, name: 'yo' },
  'រ': { initial: 'r', final: 'r', series: 2, name: 'ro' },
  'ល': { initial: 'l', final: 'l', series: 2, name: 'lo' },
  'វ': { initial: 'v', final: 'o', series: 2, name: 'vo' },
  'ស': { initial: 's', final: 's', series: 1, name: 'sa' },
  'ហ': { initial: 'h', final: 'h', series: 1, name: 'ha' },
  'ឡ': { initial: 'l', final: 'l', series: 1, name: 'la' },
  'អ': { initial: "'", final: '', series: 1, name: 'a' },
};

// Vowel romanization based on series (1 = "a" series, 2 = "o" series)
export const vowelRomanization: Record<string, { 
  series1: string; 
  series2: string;
  name: string;
}> = {
  // Inherent vowel (no written vowel)
  '': { series1: 'â', series2: 'ô', name: 'inherent' },
  'ា': { series1: 'ā', series2: 'ā', name: 'aa' },
  'ិ': { series1: 'ĕ', series2: 'ĭ', name: 'i' },
  'ី': { series1: 'ei', series2: 'ī', name: 'ii' },
  'ឹ': { series1: 'œ̆', series2: 'œ̆', name: 'oe-short' },
  'ឺ': { series1: 'œ', series2: 'œ', name: 'oe' },
  'ុ': { series1: 'ŏ', series2: 'ŭ', name: 'u-short' },
  'ូ': { series1: 'o', series2: 'ū', name: 'uu' },
  'ួ': { series1: 'uă', series2: 'uŏ', name: 'ua' },
  'ើ': { series1: 'aeu', series2: 'eu', name: 'aeu' },
  'ឿ': { series1: 'œă', series2: 'œă', name: 'oea' },
  'ៀ': { series1: 'iĕ', series2: 'iĕ', name: 'ie' },
  'េ': { series1: 'é', series2: 'é', name: 'e' },
  'ែ': { series1: 'ê', series2: 'ê', name: 'ae' },
  'ៃ': { series1: 'ai', series2: 'ey', name: 'ai' },
  'ោ': { series1: 'au', series2: 'o', name: 'ao' },
  'ៅ': { series1: 'au', series2: 'ŏu', name: 'av' },
};

// Sign effects on romanization
export const signEffects: Record<string, {
  effect: 'nasal' | 'stop' | 'aspirate' | 'register' | 'none';
  append?: string;
  romanized: string;
  phonetic: string;
  name: string;
  description: string;
}> = {
  'ំ': { 
    effect: 'nasal', 
    append: 'm', 
    romanized: 'm',
    phonetic: 'M',
    name: 'nikahit',
    description: 'Nasal final - adds "m" sound to end of syllable' 
  },
  'ះ': { 
    effect: 'aspirate', 
    append: 'h', 
    romanized: 'h',
    phonetic: 'H',
    name: 'reahmuk',
    description: 'Aspirated final - adds breathy "h" to end of syllable' 
  },
  '់': { 
    effect: 'stop', 
    romanized: '̆',
    phonetic: '(short)',
    name: 'bantoc',
    description: 'Vowel shortener - makes the vowel short/clipped' 
  },
  '៉': { 
    effect: 'register', 
    romanized: '°',
    phonetic: '(1st)',
    name: 'musĕkâtônd',
    description: 'Series shifter - converts 2nd series consonant to 1st series sound' 
  },
  '៊': { 
    effect: 'register', 
    romanized: '°',
    phonetic: '(2nd)',
    name: 'trĕysâp',
    description: 'Series shifter - converts 1st series consonant to 2nd series sound' 
  },
  '្': { 
    effect: 'none', 
    romanized: '͓',
    phonetic: '(sub)',
    name: 'coeng',
    description: 'Subscript marker - indicates next consonant is pronounced as a cluster' 
  },
};

export interface RomanizationResult {
  romanized: string;
  phonetic: string; // Simplified English-friendly pronunciation
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

/**
 * Romanize a Khmer cluster (syllable) using ALA-LC rules
 */
export function romanizeCluster(components: KhmerComponent[]): RomanizationResult {
  const warnings: string[] = [];
  let romanized = '';
  let phonetic = '';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  // Find the base consonant and determine series
  let baseSeries: 1 | 2 = 1;
  let hasExplicitVowel = false;
  let hasRegisterShift = false;
  let hasFinal = false;
  
  // First pass: analyze structure
  for (const comp of components) {
    if (comp.type === 'consonant') {
      const info = consonantRomanization[comp.char];
      if (info) {
        baseSeries = info.series;
      }
    }
    if (comp.type === 'vowel') {
      hasExplicitVowel = true;
    }
    if (comp.type === 'sign') {
      if (comp.char === '៉') {
        hasRegisterShift = true;
        baseSeries = 1;
      } else if (comp.char === '៊') {
        hasRegisterShift = true;
        baseSeries = 2;
      }
    }
    if (comp.type === 'subscript') {
      hasFinal = true;
    }
  }
  
  // Second pass: build romanization
  let consonantCount = 0;
  let vowelPart = '';
  let signParts: string[] = [];
  
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    
    if (comp.type === 'consonant') {
      const info = consonantRomanization[comp.char];
      if (info) {
        if (consonantCount === 0) {
          romanized += info.initial;
          phonetic += toPhonetic(info.initial);
        }
        consonantCount++;
      } else {
        warnings.push(`Unknown consonant: ${comp.char}`);
        confidence = 'low';
      }
    }
    
    if (comp.type === 'subscript') {
      const info = consonantRomanization[comp.char];
      if (info) {
        // Subscript consonants usually lose their inherent vowel
        romanized += info.initial;
        phonetic += toPhonetic(info.initial);
      }
    }
    
    if (comp.type === 'vowel') {
      const vInfo = vowelRomanization[comp.char];
      if (vInfo) {
        vowelPart = baseSeries === 1 ? vInfo.series1 : vInfo.series2;
      } else {
        warnings.push(`Unknown vowel: ${comp.char}`);
        confidence = 'medium';
      }
    }
    
    if (comp.type === 'sign') {
      const sInfo = signEffects[comp.char];
      if (sInfo) {
        if (sInfo.append) {
          signParts.push(sInfo.append);
        }
        if (sInfo.effect === 'stop') {
          // Bantoc shortens the vowel - we'll handle this by not lengthening
        }
      }
    }
  }
  
  // Add vowel (or inherent vowel if none explicit)
  if (!hasExplicitVowel && consonantCount > 0) {
    const inherent = vowelRomanization[''];
    vowelPart = baseSeries === 1 ? inherent.series1 : inherent.series2;
    if (!hasFinal) {
      warnings.push('Using inherent vowel - pronunciation may vary');
      if (confidence === 'high') confidence = 'medium';
    }
  }
  
  romanized += vowelPart;
  phonetic += toPhoneticVowel(vowelPart);
  
  // Add sign effects
  for (const sign of signParts) {
    romanized += sign;
    phonetic += sign;
  }
  
  // Clean up phonetic for readability
  phonetic = cleanPhonetic(phonetic);
  
  return {
    romanized: romanized || '?',
    phonetic: phonetic || '?',
    confidence,
    warnings,
  };
}

/**
 * Convert ALA-LC romanization to simple English phonetic
 */
function toPhonetic(consonant: string): string {
  const map: Record<string, string> = {
    'k': 'k',
    'kh': 'kh',
    'ng': 'ng',
    'ch': 'ch',
    'chh': 'chh',
    'ñ': 'ny',
    'd': 'd',
    'th': 'th',
    't': 't',
    'n': 'n',
    'b': 'b',
    'ph': 'ph',
    'p': 'p',
    'm': 'm',
    'y': 'y',
    'r': 'r',
    'l': 'l',
    'v': 'v',
    's': 's',
    'h': 'h',
    "'": '',
  };
  return map[consonant] || consonant;
}

function toPhoneticVowel(vowel: string): string {
  const map: Record<string, string> = {
    'â': 'a',
    'ô': 'o',
    'ā': 'ah',
    'ĕ': 'e',
    'ĭ': 'i',
    'ei': 'ay',
    'ī': 'ee',
    'œ̆': 'eu',
    'œ': 'eu',
    'ŏ': 'o',
    'ŭ': 'u',
    'o': 'oh',
    'ū': 'oo',
    'uă': 'ua',
    'uŏ': 'uo',
    'aeu': 'eu',
    'eu': 'eu',
    'œă': 'eua',
    'iĕ': 'ia',
    'é': 'ay',
    'ê': 'eh',
    'ai': 'ai',
    'ey': 'ey',
    'au': 'ao',
    'ŏu': 'ou',
  };
  return map[vowel] || vowel;
}

function cleanPhonetic(phonetic: string): string {
  return phonetic
    .replace(/ʔ/g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Get romanization info for a single character
 */
export function getCharRomanization(char: string, type: KhmerCharType): {
  romanized: string;
  phonetic: string;
  name: string;
  description?: string;
} | null {
  if (type === 'consonant' || type === 'subscript') {
    const info = consonantRomanization[char];
    if (info) {
      return {
        romanized: info.initial,
        phonetic: toPhonetic(info.initial).toUpperCase(),
        name: info.name,
      };
    }
  }
  if (type === 'vowel') {
    const info = vowelRomanization[char];
    if (info) {
      return {
        romanized: info.series1, // Default to series 1
        phonetic: toPhoneticVowel(info.series1).toUpperCase(),
        name: info.name,
      };
    }
  }
  if (type === 'sign' || type === 'coeng') {
    const info = signEffects[char];
    if (info) {
      return {
        romanized: info.romanized,
        phonetic: info.phonetic,
        name: info.name,
        description: info.description,
      };
    }
  }
  return null;
}

/**
 * Full text romanization
 */
export function romanizeText(text: string, clusters: Array<{ components: KhmerComponent[]; type: string }>): string {
  return clusters
    .filter(c => c.type !== 'space')
    .map(cluster => {
      const result = romanizeCluster(cluster.components);
      return result.phonetic;
    })
    .join('-');
}

