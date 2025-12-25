/**
 * Dictionary Lazy Loader
 * ======================
 * Handles lazy loading of the extended (Tier 2) dictionary.
 * 
 * The core dictionary (~150 words) is always loaded.
 * The extended dictionary (~100+ words) is loaded on demand.
 */

import { type DictionaryEntry } from './dictionaryCore';

let extendedDictionary: DictionaryEntry[] | null = null;
let loadPromise: Promise<DictionaryEntry[]> | null = null;
let isLoading = false;

/**
 * Load the extended dictionary (Tier 2)
 * Returns cached data if already loaded
 */
export async function loadExtendedDictionary(): Promise<DictionaryEntry[]> {
  // Return cached if already loaded
  if (extendedDictionary) {
    return extendedDictionary;
  }
  
  // Return existing promise if currently loading
  if (loadPromise) {
    return loadPromise;
  }
  
  // Start loading
  isLoading = true;
  loadPromise = (async () => {
    try {
      const response = await fetch('/data/dictionaryExtended.json');
      if (!response.ok) {
        throw new Error(`Failed to load extended dictionary: ${response.status}`);
      }
      
      const data: DictionaryEntry[] = await response.json();
      extendedDictionary = data;
      console.log(`Loaded ${data.length} extended dictionary entries`);
      return data;
    } catch (error) {
      console.error('Failed to load extended dictionary:', error);
      return [];
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();
  
  return loadPromise;
}

/**
 * Check if extended dictionary is loaded
 */
export function isExtendedLoaded(): boolean {
  return extendedDictionary !== null;
}

/**
 * Check if extended dictionary is currently loading
 */
export function isExtendedLoading(): boolean {
  return isLoading;
}

/**
 * Get the extended dictionary (returns null if not loaded)
 */
export function getExtendedDictionary(): DictionaryEntry[] | null {
  return extendedDictionary;
}

/**
 * Search in extended dictionary (only if loaded)
 */
export function searchExtended(query: string, type: 'khmer' | 'phonetic' | 'english'): DictionaryEntry[] {
  if (!extendedDictionary) return [];
  
  const normalized = query.toLowerCase();
  const results: Array<{ entry: DictionaryEntry; score: number }> = [];
  
  for (const entry of extendedDictionary) {
    let score = 0;
    
    if (type === 'khmer') {
      if (entry.khmer === query) {
        score = 1;
      }
    } else if (type === 'phonetic') {
      if (!entry.phonetic) continue;
      const entryPhonetic = entry.phonetic.toLowerCase().replace(/-/g, '');
      score = calculateSimilarity(normalized, entryPhonetic);
    } else if (type === 'english') {
      const english = entry.english.toLowerCase();
      if (english === normalized) {
        score = 1;
      } else if (english.includes(normalized) || normalized.includes(english)) {
        score = Math.min(normalized.length, english.length) / Math.max(normalized.length, english.length) * 0.8;
      }
    }
    
    if (score > 0.3) {
      results.push({ entry, score });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.entry);
}

/**
 * Look up a word in the extended dictionary
 */
export function lookupExtended(khmer: string): DictionaryEntry | null {
  if (!extendedDictionary) return null;
  return extendedDictionary.find(e => e.khmer === khmer) || null;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  
  const bigrams = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    bigrams.add(a.slice(i, i + 2));
  }
  
  let matches = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (bigrams.has(b.slice(i, i + 2))) {
      matches++;
    }
  }
  
  return (2 * matches) / (a.length + b.length - 2);
}

