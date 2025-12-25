// Khmer to IPA and English translation dictionary
// Minimal essential vocabulary - complex meanings deferred to LLM reasoning

export interface DictionaryEntry {
  ipa: string;
  english: string;
}

// Core vocabulary only
export const khmerDictionary: Record<string, DictionaryEntry> = {
  // Greetings
  'សួស្តី': { ipa: 'suəsdəj', english: 'hello' },
  'អរគុណ': { ipa: 'ʔɑː kun', english: 'thank you' },
  'បាទ': { ipa: 'baːt', english: 'yes (m)' },
  'ចាស': { ipa: 'caːh', english: 'yes (f)' },
  'ទេ': { ipa: 'teː', english: 'no' },
  
  // Pronouns
  'ខ្ញុំ': { ipa: 'kɲom', english: 'I/me' },
  'អ្នក': { ipa: 'neaʔ', english: 'you' },
  'គាត់': { ipa: 'koat', english: 'he/she' },
  'នេះ': { ipa: 'nih', english: 'this' },
  'នោះ': { ipa: 'nuh', english: 'that' },
  
  // Common verbs
  'ទៅ': { ipa: 'təw', english: 'go' },
  'មក': { ipa: 'mɔːk', english: 'come' },
  'ញ៉ាំ': { ipa: 'ɲam', english: 'eat' },
  'ដឹង': { ipa: 'dəŋ', english: 'know' },
  'ស្រឡាញ់': { ipa: 'srɑlaɲ', english: 'love' },
  
  // Numbers 1-5
  'មួយ': { ipa: 'muəj', english: 'one' },
  'ពីរ': { ipa: 'piː', english: 'two' },
  'បី': { ipa: 'bəj', english: 'three' },
  'បួន': { ipa: 'buən', english: 'four' },
  'ប្រាំ': { ipa: 'pram', english: 'five' },
  
  // Essential nouns
  'ទឹក': { ipa: 'tɨk', english: 'water' },
  'បាយ': { ipa: 'baːj', english: 'rice' },
  'ផ្ទះ': { ipa: 'pteah', english: 'house' },
  'កម្ពុជា': { ipa: 'kampuciə', english: 'Cambodia' },
  
  // Basic adjectives
  'ល្អ': { ipa: 'lʔɑː', english: 'good' },
  'ធំ': { ipa: 'tʰom', english: 'big' },
  'តូច': { ipa: 'toːc', english: 'small' },
  
  // Question words
  'អ្វី': { ipa: 'ʔwəj', english: 'what' },
  'ណា': { ipa: 'naː', english: 'where' },
};

// Individual consonant IPA (essential for character-level display)
export const consonantIPA: Record<string, { ipa: string; name: string }> = {
  'ក': { ipa: 'kɑː', name: 'ka' },
  'ខ': { ipa: 'kʰɑː', name: 'kha' },
  'គ': { ipa: 'kɔː', name: 'ko' },
  'ឃ': { ipa: 'kʰɔː', name: 'kho' },
  'ង': { ipa: 'ŋɔː', name: 'ngo' },
  'ច': { ipa: 'cɑː', name: 'cha' },
  'ឆ': { ipa: 'cʰɑː', name: 'chha' },
  'ជ': { ipa: 'cɔː', name: 'cho' },
  'ឈ': { ipa: 'cʰɔː', name: 'chho' },
  'ញ': { ipa: 'ɲɔː', name: 'nyo' },
  'ដ': { ipa: 'dɑː', name: 'da' },
  'ឋ': { ipa: 'tʰɑː', name: 'tha' },
  'ឌ': { ipa: 'dɔː', name: 'do' },
  'ឍ': { ipa: 'tʰɔː', name: 'tho' },
  'ណ': { ipa: 'nɑː', name: 'na' },
  'ត': { ipa: 'tɑː', name: 'ta' },
  'ថ': { ipa: 'tʰɑː', name: 'tha' },
  'ទ': { ipa: 'tɔː', name: 'to' },
  'ធ': { ipa: 'tʰɔː', name: 'tho' },
  'ន': { ipa: 'nɔː', name: 'no' },
  'ប': { ipa: 'bɑː', name: 'ba' },
  'ផ': { ipa: 'pʰɑː', name: 'pha' },
  'ព': { ipa: 'pɔː', name: 'po' },
  'ភ': { ipa: 'pʰɔː', name: 'pho' },
  'ម': { ipa: 'mɔː', name: 'mo' },
  'យ': { ipa: 'jɔː', name: 'yo' },
  'រ': { ipa: 'rɔː', name: 'ro' },
  'ល': { ipa: 'lɔː', name: 'lo' },
  'វ': { ipa: 'wɔː', name: 'vo' },
  'ស': { ipa: 'sɑː', name: 'sa' },
  'ហ': { ipa: 'hɑː', name: 'ha' },
  'ឡ': { ipa: 'lɑː', name: 'la' },
  'អ': { ipa: 'ʔɑː', name: 'a' },
};

// Vowel IPA mappings
export const vowelIPA: Record<string, { ipa: string; name: string }> = {
  'ា': { ipa: 'aː', name: 'aa' },
  'ិ': { ipa: 'ə', name: 'i' },
  'ី': { ipa: 'əj', name: 'ei' },
  'ឹ': { ipa: 'ɨ', name: 'oe' },
  'ឺ': { ipa: 'ɨː', name: 'eu' },
  'ុ': { ipa: 'o', name: 'o' },
  'ូ': { ipa: 'oː', name: 'ou' },
  'ួ': { ipa: 'uə', name: 'ua' },
  'ើ': { ipa: 'aə', name: 'aeu' },
  'ឿ': { ipa: 'ɨə', name: 'eua' },
  'ៀ': { ipa: 'iə', name: 'ia' },
  'េ': { ipa: 'eː', name: 'ae' },
  'ែ': { ipa: 'ae', name: 'ai' },
  'ៃ': { ipa: 'aj', name: 'ai' },
  'ោ': { ipa: 'ao', name: 'ao' },
  'ៅ': { ipa: 'aw', name: 'av' },
};

// Sign IPA mappings
export const signIPA: Record<string, { ipa: string; name: string }> = {
  'ំ': { ipa: 'm/ŋ', name: 'nikahit' },
  'ះ': { ipa: 'h', name: 'reahmuk' },
  '់': { ipa: '·', name: 'bantoc' },
  '្': { ipa: '', name: 'coeng' },
};

export function lookupWord(word: string): DictionaryEntry | null {
  return khmerDictionary[word] || null;
}

export function approximateClusterIPA(components: Array<{ char: string; type: string }>): string {
  let ipa = '';
  for (const comp of components) {
    if (comp.type === 'consonant' || comp.type === 'subscript') {
      const info = consonantIPA[comp.char];
      if (info) ipa += comp.type === 'subscript' ? info.ipa.replace(/[ɑɔ]ː?$/, '') : info.ipa.replace(/ː$/, '');
    } else if (comp.type === 'vowel') {
      const info = vowelIPA[comp.char];
      if (info) ipa += info.ipa;
    } else if (comp.type === 'sign') {
      const info = signIPA[comp.char];
      if (info && info.ipa) ipa += info.ipa;
    }
  }
  return ipa || '?';
}
