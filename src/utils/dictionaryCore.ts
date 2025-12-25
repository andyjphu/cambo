/**
 * Core Dictionary - High-frequency Khmer words with English translations
 * 
 * Sources:
 * - SBBIC English-Khmer Dictionary (MIT License)
 * - Manually curated high-frequency vocabulary
 * 
 * This is the "Tier 1" dictionary - always loaded.
 * Tier 2 (extended dictionary) can be lazy-loaded.
 * 
 * NOTE: Word segmentation for future update - currently relies on space-separated input
 */

export interface DictionaryEntry {
  khmer: string;
  english: string;
  pos?: 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'part' | 'num';
  romanized?: string; // ALA-LC romanization if known
  phonetic?: string;  // English-friendly pronunciation
  frequency?: number; // 1-100, higher = more common
}

/**
 * Core vocabulary - ~200 most essential words
 * Prioritized for a learner who understands spoken Khmer
 */
export const coreDictionary: DictionaryEntry[] = [
  // Greetings & Politeness (most essential)
  { khmer: 'សួស្តី', english: 'hello', pos: 'noun', phonetic: 'SUA-SDEY', frequency: 100 },
  { khmer: 'អរគុណ', english: 'thank you', pos: 'noun', phonetic: 'OR-KUN', frequency: 100 },
  { khmer: 'សូម', english: 'please', pos: 'part', phonetic: 'SOHM', frequency: 95 },
  { khmer: 'សូមទោស', english: 'sorry/excuse me', pos: 'noun', phonetic: 'SOHM-TOHS', frequency: 90 },
  { khmer: 'បាទ', english: 'yes (male)', pos: 'part', phonetic: 'BAHT', frequency: 100 },
  { khmer: 'ចាស', english: 'yes (female)', pos: 'part', phonetic: 'JAHS', frequency: 100 },
  { khmer: 'ទេ', english: 'no/not', pos: 'part', phonetic: 'TAY', frequency: 100 },
  { khmer: 'មិន', english: 'not', pos: 'adv', phonetic: 'MIN', frequency: 95 },
  
  // Pronouns
  { khmer: 'ខ្ញុំ', english: 'I/me', pos: 'pron', phonetic: 'KNYOM', frequency: 100 },
  { khmer: 'អ្នក', english: 'you', pos: 'pron', phonetic: 'NEAK', frequency: 100 },
  { khmer: 'គាត់', english: 'he/she/they', pos: 'pron', phonetic: 'KOAT', frequency: 95 },
  { khmer: 'យើង', english: 'we', pos: 'pron', phonetic: 'YEUNG', frequency: 90 },
  { khmer: 'គេ', english: 'they/people', pos: 'pron', phonetic: 'KAY', frequency: 85 },
  { khmer: 'នេះ', english: 'this', pos: 'pron', phonetic: 'NIH', frequency: 95 },
  { khmer: 'នោះ', english: 'that', pos: 'pron', phonetic: 'NUH', frequency: 95 },
  { khmer: 'អី', english: 'what', pos: 'pron', phonetic: 'EY', frequency: 90 },
  { khmer: 'អ្វី', english: 'what (formal)', pos: 'pron', phonetic: 'A-VEY', frequency: 90 },
  { khmer: 'ណា', english: 'where/which', pos: 'pron', phonetic: 'NAH', frequency: 90 },
  { khmer: 'នរណា', english: 'who', pos: 'pron', phonetic: 'NO-NA', frequency: 85 },
  
  // Common Verbs
  { khmer: 'ទៅ', english: 'go', pos: 'verb', phonetic: 'TOH', frequency: 100 },
  { khmer: 'មក', english: 'come', pos: 'verb', phonetic: 'MOHK', frequency: 100 },
  { khmer: 'ញ៉ាំ', english: 'eat', pos: 'verb', phonetic: 'NYAM', frequency: 95 },
  { khmer: 'ផឹក', english: 'drink', pos: 'verb', phonetic: 'PHUK', frequency: 90 },
  { khmer: 'ដឹង', english: 'know', pos: 'verb', phonetic: 'DUNG', frequency: 95 },
  { khmer: 'ចង់', english: 'want', pos: 'verb', phonetic: 'JONG', frequency: 95 },
  { khmer: 'មាន', english: 'have/there is', pos: 'verb', phonetic: 'MIEN', frequency: 100 },
  { khmer: 'ធ្វើ', english: 'do/make', pos: 'verb', phonetic: 'TVEU', frequency: 95 },
  { khmer: 'និយាយ', english: 'speak/say', pos: 'verb', phonetic: 'NI-YIEY', frequency: 90 },
  { khmer: 'មើល', english: 'look/watch', pos: 'verb', phonetic: 'MEUL', frequency: 90 },
  { khmer: 'ស្តាប់', english: 'listen', pos: 'verb', phonetic: 'SDAP', frequency: 85 },
  { khmer: 'អាន', english: 'read', pos: 'verb', phonetic: 'AHN', frequency: 85 },
  { khmer: 'សរសេរ', english: 'write', pos: 'verb', phonetic: 'SAW-SAY', frequency: 85 },
  { khmer: 'ស្រឡាញ់', english: 'love', pos: 'verb', phonetic: 'SRO-LANH', frequency: 90 },
  { khmer: 'ចូលចិត្ត', english: 'like', pos: 'verb', phonetic: 'JOHL-JET', frequency: 90 },
  { khmer: 'ជឿ', english: 'believe', pos: 'verb', phonetic: 'CHEUA', frequency: 80 },
  { khmer: 'គិត', english: 'think', pos: 'verb', phonetic: 'KIT', frequency: 85 },
  { khmer: 'ដេក', english: 'sleep', pos: 'verb', phonetic: 'DAYK', frequency: 85 },
  { khmer: 'ក្រោក', english: 'wake up/get up', pos: 'verb', phonetic: 'KROK', frequency: 80 },
  { khmer: 'រត់', english: 'run', pos: 'verb', phonetic: 'ROT', frequency: 75 },
  { khmer: 'ដើរ', english: 'walk', pos: 'verb', phonetic: 'DAEU', frequency: 80 },
  { khmer: 'ជិះ', english: 'ride', pos: 'verb', phonetic: 'JIH', frequency: 75 },
  { khmer: 'ឈប់', english: 'stop', pos: 'verb', phonetic: 'CHUP', frequency: 80 },
  { khmer: 'ចាំ', english: 'wait/remember', pos: 'verb', phonetic: 'JAM', frequency: 85 },
  { khmer: 'ភ្លេច', english: 'forget', pos: 'verb', phonetic: 'PLECH', frequency: 75 },
  { khmer: 'ទិញ', english: 'buy', pos: 'verb', phonetic: 'TINH', frequency: 85 },
  { khmer: 'លក់', english: 'sell', pos: 'verb', phonetic: 'LUK', frequency: 80 },
  { khmer: 'ផ្តល់', english: 'give', pos: 'verb', phonetic: 'PDAL', frequency: 80 },
  { khmer: 'យក', english: 'take', pos: 'verb', phonetic: 'YOK', frequency: 85 },
  { khmer: 'ដាក់', english: 'put', pos: 'verb', phonetic: 'DAK', frequency: 80 },
  
  // Numbers
  { khmer: 'មួយ', english: 'one', pos: 'num', phonetic: 'MUOY', frequency: 100 },
  { khmer: 'ពីរ', english: 'two', pos: 'num', phonetic: 'PIR', frequency: 100 },
  { khmer: 'បី', english: 'three', pos: 'num', phonetic: 'BEY', frequency: 100 },
  { khmer: 'បួន', english: 'four', pos: 'num', phonetic: 'BUON', frequency: 95 },
  { khmer: 'ប្រាំ', english: 'five', pos: 'num', phonetic: 'PRAM', frequency: 95 },
  { khmer: 'ប្រាំមួយ', english: 'six', pos: 'num', phonetic: 'PRAM-MUOY', frequency: 90 },
  { khmer: 'ប្រាំពីរ', english: 'seven', pos: 'num', phonetic: 'PRAM-PIR', frequency: 90 },
  { khmer: 'ប្រាំបី', english: 'eight', pos: 'num', phonetic: 'PRAM-BEY', frequency: 90 },
  { khmer: 'ប្រាំបួន', english: 'nine', pos: 'num', phonetic: 'PRAM-BUON', frequency: 90 },
  { khmer: 'ដប់', english: 'ten', pos: 'num', phonetic: 'DOP', frequency: 95 },
  { khmer: 'រយ', english: 'hundred', pos: 'num', phonetic: 'ROY', frequency: 85 },
  { khmer: 'ពាន់', english: 'thousand', pos: 'num', phonetic: 'POAN', frequency: 80 },
  
  // Time
  { khmer: 'ថ្ងៃ', english: 'day', pos: 'noun', phonetic: 'TNGAI', frequency: 95 },
  { khmer: 'យប់', english: 'night', pos: 'noun', phonetic: 'YUP', frequency: 90 },
  { khmer: 'ព្រឹក', english: 'morning', pos: 'noun', phonetic: 'PRUK', frequency: 90 },
  { khmer: 'ល្ងាច', english: 'evening', pos: 'noun', phonetic: 'LNGIECH', frequency: 85 },
  { khmer: 'ម៉ោង', english: 'hour/time', pos: 'noun', phonetic: 'MAONG', frequency: 90 },
  { khmer: 'នាទី', english: 'minute', pos: 'noun', phonetic: 'NEA-TI', frequency: 80 },
  { khmer: 'ឥឡូវ', english: 'now', pos: 'adv', phonetic: 'EY-LOV', frequency: 90 },
  { khmer: 'ម្សិលមិញ', english: 'yesterday', pos: 'noun', phonetic: 'MSEL-MINH', frequency: 80 },
  { khmer: 'ថ្ងៃនេះ', english: 'today', pos: 'noun', phonetic: 'TNGAI-NIH', frequency: 90 },
  { khmer: 'ថ្ងៃស្អែក', english: 'tomorrow', pos: 'noun', phonetic: 'TNGAI-SAEK', frequency: 85 },
  
  // Places & Directions
  { khmer: 'ផ្ទះ', english: 'house/home', pos: 'noun', phonetic: 'PTEAH', frequency: 95 },
  { khmer: 'សាលា', english: 'school', pos: 'noun', phonetic: 'SA-LA', frequency: 85 },
  { khmer: 'ផ្សារ', english: 'market', pos: 'noun', phonetic: 'PSAR', frequency: 90 },
  { khmer: 'មន្ទីរពេទ្យ', english: 'hospital', pos: 'noun', phonetic: 'MON-TI-PETY', frequency: 75 },
  { khmer: 'វត្ត', english: 'temple/pagoda', pos: 'noun', phonetic: 'VOAT', frequency: 80 },
  { khmer: 'ភូមិ', english: 'village', pos: 'noun', phonetic: 'PHUM', frequency: 80 },
  { khmer: 'ទីក្រុង', english: 'city', pos: 'noun', phonetic: 'TI-KRONG', frequency: 80 },
  { khmer: 'ប្រទេស', english: 'country', pos: 'noun', phonetic: 'PRO-TES', frequency: 80 },
  { khmer: 'កម្ពុជា', english: 'Cambodia', pos: 'noun', phonetic: 'KAM-PU-JEA', frequency: 95 },
  { khmer: 'ឆ្វេង', english: 'left', pos: 'noun', phonetic: 'CHVENG', frequency: 80 },
  { khmer: 'ស្តាំ', english: 'right', pos: 'noun', phonetic: 'SDAM', frequency: 80 },
  { khmer: 'មុខ', english: 'front/face', pos: 'noun', phonetic: 'MUK', frequency: 85 },
  { khmer: 'ក្រោយ', english: 'behind/after', pos: 'prep', phonetic: 'KRAOY', frequency: 85 },
  { khmer: 'លើ', english: 'on/above', pos: 'prep', phonetic: 'LEU', frequency: 85 },
  { khmer: 'ក្រោម', english: 'under/below', pos: 'prep', phonetic: 'KRAOM', frequency: 80 },
  { khmer: 'ក្នុង', english: 'in/inside', pos: 'prep', phonetic: 'KNONG', frequency: 90 },
  { khmer: 'ក្រៅ', english: 'outside', pos: 'prep', phonetic: 'KRAV', frequency: 80 },
  
  // Food & Drink
  { khmer: 'បាយ', english: 'rice (cooked)', pos: 'noun', phonetic: 'BAI', frequency: 95 },
  { khmer: 'ទឹក', english: 'water', pos: 'noun', phonetic: 'TUK', frequency: 95 },
  { khmer: 'សាច់', english: 'meat', pos: 'noun', phonetic: 'SACH', frequency: 85 },
  { khmer: 'ត្រី', english: 'fish', pos: 'noun', phonetic: 'TREY', frequency: 85 },
  { khmer: 'បន្លែ', english: 'vegetables', pos: 'noun', phonetic: 'BON-LAE', frequency: 80 },
  { khmer: 'ផ្លែឈើ', english: 'fruit', pos: 'noun', phonetic: 'PLAE-CHEU', frequency: 80 },
  { khmer: 'កាហ្វេ', english: 'coffee', pos: 'noun', phonetic: 'KA-FE', frequency: 80 },
  { khmer: 'តែ', english: 'tea', pos: 'noun', phonetic: 'TAE', frequency: 80 },
  { khmer: 'ស្រា', english: 'alcohol/wine', pos: 'noun', phonetic: 'SRA', frequency: 70 },
  
  // People & Family
  { khmer: 'មនុស្ស', english: 'person/people', pos: 'noun', phonetic: 'MO-NUS', frequency: 90 },
  { khmer: 'ម៉ែ', english: 'mother', pos: 'noun', phonetic: 'MAE', frequency: 95 },
  { khmer: 'ប៉ា', english: 'father', pos: 'noun', phonetic: 'PA', frequency: 95 },
  { khmer: 'បង', english: 'older sibling', pos: 'noun', phonetic: 'BONG', frequency: 95 },
  { khmer: 'អូន', english: 'younger sibling', pos: 'noun', phonetic: 'OHN', frequency: 95 },
  { khmer: 'កូន', english: 'child', pos: 'noun', phonetic: 'KOHN', frequency: 90 },
  { khmer: 'ប្រពន្ធ', english: 'wife', pos: 'noun', phonetic: 'PRO-PON', frequency: 80 },
  { khmer: 'ប្តី', english: 'husband', pos: 'noun', phonetic: 'PDEY', frequency: 80 },
  { khmer: 'មិត្ត', english: 'friend', pos: 'noun', phonetic: 'MIT', frequency: 85 },
  
  // Adjectives
  { khmer: 'ល្អ', english: 'good', pos: 'adj', phonetic: 'LAW', frequency: 95 },
  { khmer: 'អាក្រក់', english: 'bad', pos: 'adj', phonetic: 'A-KROK', frequency: 85 },
  { khmer: 'ធំ', english: 'big', pos: 'adj', phonetic: 'THOM', frequency: 90 },
  { khmer: 'តូច', english: 'small', pos: 'adj', phonetic: 'TOHCH', frequency: 90 },
  { khmer: 'ច្រើន', english: 'many/much', pos: 'adj', phonetic: 'JRAEN', frequency: 90 },
  { khmer: 'តិច', english: 'few/little', pos: 'adj', phonetic: 'TECH', frequency: 85 },
  { khmer: 'ថ្មី', english: 'new', pos: 'adj', phonetic: 'TMEY', frequency: 85 },
  { khmer: 'ចាស់', english: 'old', pos: 'adj', phonetic: 'JAS', frequency: 85 },
  { khmer: 'ក្តៅ', english: 'hot', pos: 'adj', phonetic: 'KDAV', frequency: 80 },
  { khmer: 'ត្រជាក់', english: 'cold', pos: 'adj', phonetic: 'TRO-JEAK', frequency: 80 },
  { khmer: 'ឆ្ងាញ់', english: 'delicious', pos: 'adj', phonetic: 'CHNGANH', frequency: 85 },
  { khmer: 'ស្អាត', english: 'beautiful/clean', pos: 'adj', phonetic: 'SAAT', frequency: 85 },
  { khmer: 'លឿន', english: 'fast', pos: 'adj', phonetic: 'LUEN', frequency: 80 },
  { khmer: 'យឺត', english: 'slow', pos: 'adj', phonetic: 'YUT', frequency: 75 },
  { khmer: 'ងាយ', english: 'easy', pos: 'adj', phonetic: 'NGIEY', frequency: 80 },
  { khmer: 'ពិបាក', english: 'difficult', pos: 'adj', phonetic: 'PI-BAK', frequency: 80 },
  { khmer: 'ថ្លៃ', english: 'expensive', pos: 'adj', phonetic: 'TLAI', frequency: 85 },
  { khmer: 'ថោក', english: 'cheap', pos: 'adj', phonetic: 'THAOK', frequency: 80 },
  
  // Question words
  { khmer: 'ហេតុអ្វី', english: 'why', pos: 'adv', phonetic: 'HET-A-VEY', frequency: 85 },
  { khmer: 'យ៉ាងម៉េច', english: 'how', pos: 'adv', phonetic: 'YANG-MECH', frequency: 85 },
  { khmer: 'ប៉ុន្មាន', english: 'how many/much', pos: 'adv', phonetic: 'PON-MAN', frequency: 90 },
  { khmer: 'ពេលណា', english: 'when', pos: 'adv', phonetic: 'PEL-NA', frequency: 85 },
  
  // Common expressions
  { khmer: 'សុខសប្បាយ', english: 'fine/well', pos: 'adj', phonetic: 'SOK-SA-BAI', frequency: 90 },
  { khmer: 'អត់ទេ', english: 'no/nothing', pos: 'part', phonetic: 'OT-TAY', frequency: 90 },
  { khmer: 'មែន', english: 'right/true', pos: 'adj', phonetic: 'MEN', frequency: 90 },
  { khmer: 'បាន', english: 'can/got/already', pos: 'verb', phonetic: 'BAHN', frequency: 95 },
  { khmer: 'កំពុង', english: 'currently/-ing', pos: 'adv', phonetic: 'KOM-PUNG', frequency: 85 },
  { khmer: 'រួច', english: 'already/finished', pos: 'adv', phonetic: 'RUOCH', frequency: 85 },
  { khmer: 'នៅ', english: 'at/still', pos: 'prep', phonetic: 'NOV', frequency: 95 },
  { khmer: 'និង', english: 'and', pos: 'conj', phonetic: 'NING', frequency: 95 },
  { khmer: 'ឬ', english: 'or', pos: 'conj', phonetic: 'REU', frequency: 85 },
  { khmer: 'ប៉ុន្តែ', english: 'but', pos: 'conj', phonetic: 'PON-TAE', frequency: 85 },
  { khmer: 'ព្រោះ', english: 'because', pos: 'conj', phonetic: 'PROH', frequency: 80 },
  { khmer: 'ដូច្នេះ', english: 'so/therefore', pos: 'conj', phonetic: 'DOHCH-NEH', frequency: 75 },
];

// Build lookup maps for efficient access
const khmerToEntryMap = new Map<string, DictionaryEntry>();
const phoneticToEntryMap = new Map<string, DictionaryEntry[]>();

for (const entry of coreDictionary) {
  khmerToEntryMap.set(entry.khmer, entry);
  
  if (entry.phonetic) {
    const normalized = entry.phonetic.toLowerCase().replace(/-/g, '');
    if (!phoneticToEntryMap.has(normalized)) {
      phoneticToEntryMap.set(normalized, []);
    }
    phoneticToEntryMap.get(normalized)!.push(entry);
  }
}

/**
 * Look up a Khmer word in the dictionary
 */
export function lookupKhmer(word: string): DictionaryEntry | null {
  return khmerToEntryMap.get(word) || null;
}

/**
 * Fuzzy search by phonetic approximation
 */
export function searchByPhonetic(query: string): DictionaryEntry[] {
  const normalized = query.toLowerCase().replace(/[-\s]/g, '');
  const results: Array<{ entry: DictionaryEntry; score: number }> = [];
  
  for (const entry of coreDictionary) {
    if (!entry.phonetic) continue;
    
    const entryPhonetic = entry.phonetic.toLowerCase().replace(/-/g, '');
    const score = calculateSimilarity(normalized, entryPhonetic);
    
    if (score > 0.4) { // 40% similarity threshold
      results.push({ entry, score });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.entry);
}

/**
 * Search by English meaning
 */
export function searchByEnglish(query: string): DictionaryEntry[] {
  const normalized = query.toLowerCase();
  const results: Array<{ entry: DictionaryEntry; score: number }> = [];
  
  for (const entry of coreDictionary) {
    const english = entry.english.toLowerCase();
    
    // Exact match
    if (english === normalized) {
      results.push({ entry, score: 1 });
      continue;
    }
    
    // Contains match
    if (english.includes(normalized) || normalized.includes(english)) {
      const score = Math.min(normalized.length, english.length) / Math.max(normalized.length, english.length);
      results.push({ entry, score: score * 0.8 });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.entry);
}

/**
 * Simple string similarity (Dice coefficient approximation)
 */
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

