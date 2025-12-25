// Khmer to IPA, phonetic, and English translation dictionary
// Minimal essential vocabulary - complex meanings deferred to LLM reasoning

export interface DictionaryEntry {
  ipa: string;
  phonetic: string; // Readable English approximation
  english: string;
}

// Core vocabulary only
export const khmerDictionary: Record<string, DictionaryEntry> = {
  // Greetings
  'សួស្តី': { ipa: 'suəsdəj', phonetic: 'soo-uh-SDEY', english: 'hello' },
  'អរគុណ': { ipa: 'ʔɑː kun', phonetic: 'or-KOON', english: 'thank you' },
  'បាទ': { ipa: 'baːt', phonetic: 'BAHT', english: 'yes (m)' },
  'ចាស': { ipa: 'caːh', phonetic: 'JAHS', english: 'yes (f)' },
  'ទេ': { ipa: 'teː', phonetic: 'TAY', english: 'no' },
  
  // Pronouns
  'ខ្ញុំ': { ipa: 'kɲom', phonetic: 'k-NYOM', english: 'I/me' },
  'អ្នក': { ipa: 'neaʔ', phonetic: 'neh-AK', english: 'you' },
  'គាត់': { ipa: 'koat', phonetic: 'KOHT', english: 'he/she' },
  'នេះ': { ipa: 'nih', phonetic: 'NIH', english: 'this' },
  'នោះ': { ipa: 'nuh', phonetic: 'NOH', english: 'that' },
  
  // Common verbs
  'ទៅ': { ipa: 'təw', phonetic: 'TOH', english: 'go' },
  'មក': { ipa: 'mɔːk', phonetic: 'MOHK', english: 'come' },
  'ញ៉ាំ': { ipa: 'ɲam', phonetic: 'NYAM', english: 'eat' },
  'ដឹង': { ipa: 'dəŋ', phonetic: 'DUNG', english: 'know' },
  'ស្រឡាញ់': { ipa: 'srɑlaɲ', phonetic: 'sro-LANH', english: 'love' },
  
  // Numbers 1-5
  'មួយ': { ipa: 'muəj', phonetic: 'MOO-ey', english: 'one' },
  'ពីរ': { ipa: 'piː', phonetic: 'PEE', english: 'two' },
  'បី': { ipa: 'bəj', phonetic: 'BEY', english: 'three' },
  'បួន': { ipa: 'buən', phonetic: 'BOO-un', english: 'four' },
  'ប្រាំ': { ipa: 'pram', phonetic: 'PRAM', english: 'five' },
  
  // Essential nouns
  'ទឹក': { ipa: 'tɨk', phonetic: 'TUK', english: 'water' },
  'បាយ': { ipa: 'baːj', phonetic: 'BYE', english: 'rice' },
  'ផ្ទះ': { ipa: 'pteah', phonetic: 'p-TEH-ah', english: 'house' },
  'កម្ពុជា': { ipa: 'kampuciə', phonetic: 'kahm-poo-CHEE-uh', english: 'Cambodia' },
  
  // Basic adjectives
  'ល្អ': { ipa: 'lʔɑː', phonetic: 'l-AW', english: 'good' },
  'ធំ': { ipa: 'tʰom', phonetic: 'TOHM', english: 'big' },
  'តូច': { ipa: 'toːc', phonetic: 'TOHCH', english: 'small' },
  
  // Question words
  'អ្វី': { ipa: 'ʔwəj', phonetic: 'uh-VEY', english: 'what' },
  'ណា': { ipa: 'naː', phonetic: 'NAH', english: 'where' },
};

// Special characters that need explanation
export interface SpecialCharInfo {
  char: string;
  name: string;
  khmerName: string;
  description: string;
  usage: string;
  example?: string;
}

export const specialCharacters: Record<string, SpecialCharInfo> = {
  // Repetition sign - very important!
  'ៗ': {
    char: 'ៗ',
    name: 'Lek Too',
    khmerName: 'លេខទោ',
    description: 'Repetition sign - indicates the preceding word should be repeated',
    usage: 'Placed after a word to show it repeats. Like writing "etc." or "..."',
    example: 'ថ្ងៃៗ = ថ្ងៃថ្ងៃ (every day, day by day)',
  },
  
  // Punctuation
  '។': {
    char: '។',
    name: 'Khan',
    khmerName: 'ខណ្ឌ',
    description: 'Full stop / Period - marks the end of a sentence',
    usage: 'Used like a period in English to end sentences',
  },
  '៕': {
    char: '៕',
    name: 'Bariyoosan',
    khmerName: 'បរិយោសាន',
    description: 'End of chapter or section marker',
    usage: 'Marks the conclusion of a major section or chapter',
  },
  '៖': {
    char: '៖',
    name: 'Camnuc Pii Kuuh',
    khmerName: 'ចំណុចពីរគូស',
    description: 'Colon - introduces a list or explanation',
    usage: 'Similar to colon (:) in English',
  },
  '៘': {
    char: '៘',
    name: 'Beyyal',
    khmerName: 'បើយ៉ាល់',
    description: 'Et cetera mark - and so on',
    usage: 'Indicates continuation, similar to "etc." or "..."',
  },
  
  // Signs with grammatical function
  '់': {
    char: '់',
    name: 'Bantoc',
    khmerName: 'បន្តក់',
    description: 'Shortens the inherent vowel of a consonant',
    usage: 'Indicates a shortened or stopped vowel sound',
  },
  'ំ': {
    char: 'ំ',
    name: 'Nikahit',
    khmerName: 'និគ្គហិត',
    description: 'Nasal final - adds nasal quality (m or ng sound)',
    usage: 'Creates a nasal ending to syllables',
  },
  'ះ': {
    char: 'ះ',
    name: 'Reahmuk',
    khmerName: 'រះមុខ',
    description: 'Aspirated final - adds breathy "h" sound',
    usage: 'Creates an aspirated ending with a light "h"',
  },
  '្': {
    char: '្',
    name: 'Coeng',
    khmerName: 'ជើង',
    description: 'Subscript marker - combines consonants into clusters',
    usage: 'Attaches following consonant below the base consonant',
  },
  '៉': {
    char: '៉',
    name: 'Muusikatoan',
    khmerName: 'មូសិកទន្ត',
    description: 'Converts 2nd series consonant to 1st series sound',
    usage: 'Changes the vowel register of consonants',
  },
  '៊': {
    char: '៊',
    name: 'Triisap',
    khmerName: 'ត្រីសព្ទ',
    description: 'Converts 1st series consonant to 2nd series sound',
    usage: 'Changes the vowel register of consonants',
  },
  
  // Currency
  '៛': {
    char: '៛',
    name: 'Riel',
    khmerName: 'រៀល',
    description: 'Cambodian Riel currency symbol',
    usage: 'Represents the Cambodian currency (៛)',
  },
};

// Individual consonant IPA with phonetic guide
export const consonantIPA: Record<string, { ipa: string; phonetic: string; name: string; series: 1 | 2 }> = {
  'ក': { ipa: 'kɑː', phonetic: 'KAW', name: 'ka', series: 1 },
  'ខ': { ipa: 'kʰɑː', phonetic: 'KHAW', name: 'kha', series: 1 },
  'គ': { ipa: 'kɔː', phonetic: 'KOH', name: 'ko', series: 2 },
  'ឃ': { ipa: 'kʰɔː', phonetic: 'KHOH', name: 'kho', series: 2 },
  'ង': { ipa: 'ŋɔː', phonetic: 'NGOH', name: 'ngo', series: 2 },
  'ច': { ipa: 'cɑː', phonetic: 'JAW', name: 'cha', series: 1 },
  'ឆ': { ipa: 'cʰɑː', phonetic: 'CHHAW', name: 'chha', series: 1 },
  'ជ': { ipa: 'cɔː', phonetic: 'JOH', name: 'cho', series: 2 },
  'ឈ': { ipa: 'cʰɔː', phonetic: 'CHHOH', name: 'chho', series: 2 },
  'ញ': { ipa: 'ɲɔː', phonetic: 'NYOH', name: 'nyo', series: 2 },
  'ដ': { ipa: 'dɑː', phonetic: 'DAW', name: 'da', series: 1 },
  'ឋ': { ipa: 'tʰɑː', phonetic: 'THAW', name: 'tha', series: 1 },
  'ឌ': { ipa: 'dɔː', phonetic: 'DOH', name: 'do', series: 2 },
  'ឍ': { ipa: 'tʰɔː', phonetic: 'THOH', name: 'tho', series: 2 },
  'ណ': { ipa: 'nɑː', phonetic: 'NAW', name: 'na', series: 1 },
  'ត': { ipa: 'tɑː', phonetic: 'TAW', name: 'ta', series: 1 },
  'ថ': { ipa: 'tʰɑː', phonetic: 'THAW', name: 'tha', series: 1 },
  'ទ': { ipa: 'tɔː', phonetic: 'TOH', name: 'to', series: 2 },
  'ធ': { ipa: 'tʰɔː', phonetic: 'THOH', name: 'tho', series: 2 },
  'ន': { ipa: 'nɔː', phonetic: 'NOH', name: 'no', series: 2 },
  'ប': { ipa: 'bɑː', phonetic: 'BAW', name: 'ba', series: 1 },
  'ផ': { ipa: 'pʰɑː', phonetic: 'PHAW', name: 'pha', series: 1 },
  'ព': { ipa: 'pɔː', phonetic: 'POH', name: 'po', series: 2 },
  'ភ': { ipa: 'pʰɔː', phonetic: 'PHOH', name: 'pho', series: 2 },
  'ម': { ipa: 'mɔː', phonetic: 'MOH', name: 'mo', series: 2 },
  'យ': { ipa: 'jɔː', phonetic: 'YOH', name: 'yo', series: 2 },
  'រ': { ipa: 'rɔː', phonetic: 'ROH', name: 'ro', series: 2 },
  'ល': { ipa: 'lɔː', phonetic: 'LOH', name: 'lo', series: 2 },
  'វ': { ipa: 'wɔː', phonetic: 'VOH', name: 'vo', series: 2 },
  'ស': { ipa: 'sɑː', phonetic: 'SAW', name: 'sa', series: 1 },
  'ហ': { ipa: 'hɑː', phonetic: 'HAW', name: 'ha', series: 1 },
  'ឡ': { ipa: 'lɑː', phonetic: 'LAW', name: 'la', series: 1 },
  'អ': { ipa: 'ʔɑː', phonetic: 'AW', name: 'a', series: 1 },
};

// Vowel IPA with phonetic guide
export const vowelIPA: Record<string, { ipa: string; phonetic: string; name: string }> = {
  'ា': { ipa: 'aː', phonetic: 'AH', name: 'aa' },
  'ិ': { ipa: 'ə', phonetic: 'UH (short)', name: 'i' },
  'ី': { ipa: 'əj', phonetic: 'EY', name: 'ei' },
  'ឹ': { ipa: 'ɨ', phonetic: 'EU (short)', name: 'oe' },
  'ឺ': { ipa: 'ɨː', phonetic: 'EU (long)', name: 'eu' },
  'ុ': { ipa: 'o', phonetic: 'OO (short)', name: 'o' },
  'ូ': { ipa: 'oː', phonetic: 'OO (long)', name: 'ou' },
  'ួ': { ipa: 'uə', phonetic: 'OO-uh', name: 'ua' },
  'ើ': { ipa: 'aə', phonetic: 'UH-uh', name: 'aeu' },
  'ឿ': { ipa: 'ɨə', phonetic: 'EU-uh', name: 'eua' },
  'ៀ': { ipa: 'iə', phonetic: 'EE-uh', name: 'ia' },
  'េ': { ipa: 'eː', phonetic: 'AY', name: 'ae' },
  'ែ': { ipa: 'ae', phonetic: 'EH', name: 'ai' },
  'ៃ': { ipa: 'aj', phonetic: 'EYE', name: 'ai' },
  'ោ': { ipa: 'ao', phonetic: 'OW', name: 'ao' },
  'ៅ': { ipa: 'aw', phonetic: 'OW', name: 'av' },
};

// Sign IPA with phonetic guide
export const signIPA: Record<string, { ipa: string; phonetic: string; name: string }> = {
  'ំ': { ipa: 'm/ŋ', phonetic: 'M or NG', name: 'nikahit' },
  'ះ': { ipa: 'h', phonetic: 'H (breathy)', name: 'reahmuk' },
  '់': { ipa: '·', phonetic: '(stop)', name: 'bantoc' },
  '្': { ipa: '', phonetic: '(subscript)', name: 'coeng' },
};

export function lookupWord(word: string): DictionaryEntry | null {
  return khmerDictionary[word] || null;
}

export function getSpecialCharInfo(char: string): SpecialCharInfo | null {
  return specialCharacters[char] || null;
}

export function approximateClusterIPA(components: Array<{ char: string; type: string }>): { ipa: string; phonetic: string } {
  let ipa = '';
  let phonetic = '';
  
  for (const comp of components) {
    if (comp.type === 'consonant' || comp.type === 'subscript') {
      const info = consonantIPA[comp.char];
      if (info) {
        ipa += comp.type === 'subscript' ? info.ipa.replace(/[ɑɔ]ː?$/, '') : info.ipa.replace(/ː$/, '');
        phonetic += comp.type === 'subscript' ? info.phonetic.replace(/(AW|OH)$/, '') + '-' : info.phonetic.replace(/(AW|OH)$/, '');
      }
    } else if (comp.type === 'vowel') {
      const info = vowelIPA[comp.char];
      if (info) {
        ipa += info.ipa;
        phonetic += info.phonetic;
      }
    } else if (comp.type === 'sign') {
      const info = signIPA[comp.char];
      if (info && info.ipa) {
        ipa += info.ipa;
        if (info.phonetic && !info.phonetic.startsWith('(')) {
          phonetic += info.phonetic;
        }
      }
    }
  }
  
  return { ipa: ipa || '?', phonetic: phonetic || '?' };
}
