/**
 * Word Segmentation Utility
 * =========================
 * 
 * Implements dictionary-based word segmentation using bidirectional maximum matching.
 * Designed to be extended with LLM-based segmentation in the future.
 * 
 * Current approach: Uses our existing dictionary (~250 words)
 * Future: Can plug in an LLM API for better accuracy
 */

import { coreDictionary, type DictionaryEntry } from './dictionaryCore';
import { getExtendedDictionary } from './dictionaryLoader';

export interface SegmentedWord {
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: 'high' | 'medium' | 'low';
  dictionaryMatch: DictionaryEntry | null;
  isUserModified?: boolean;
}

export interface SegmentationResult {
  words: SegmentedWord[];
  originalText: string;
  method: 'dictionary' | 'user' | 'llm'; // For future LLM integration
  overallConfidence: 'high' | 'medium' | 'low';
}

// Build a Set of all known Khmer words for fast lookup
let dictionaryWords: Set<string> | null = null;
let dictionaryMap: Map<string, DictionaryEntry> | null = null;

function initDictionary() {
  if (dictionaryWords) return;
  
  dictionaryWords = new Set<string>();
  dictionaryMap = new Map<string, DictionaryEntry>();
  
  // Add core dictionary words
  for (const entry of coreDictionary) {
    dictionaryWords.add(entry.khmer);
    dictionaryMap.set(entry.khmer, entry);
  }
  
  // Add extended dictionary if loaded
  const extended = getExtendedDictionary();
  if (extended) {
    for (const entry of extended) {
      dictionaryWords.add(entry.khmer);
      dictionaryMap.set(entry.khmer, entry);
    }
  }
}

/**
 * Get dictionary entry for a word
 */
export function getDictionaryEntry(word: string): DictionaryEntry | null {
  initDictionary();
  return dictionaryMap?.get(word) || null;
}

/**
 * Check if a word exists in our dictionary
 */
export function isKnownWord(word: string): boolean {
  initDictionary();
  return dictionaryWords?.has(word) || false;
}

/**
 * Get all words that start with a given prefix
 * Used for forward maximum matching
 */
function getWordsWithPrefix(prefix: string): string[] {
  initDictionary();
  const results: string[] = [];
  for (const word of dictionaryWords!) {
    if (word.startsWith(prefix)) {
      results.push(word);
    }
  }
  return results;
}

/**
 * Forward Maximum Matching
 * Greedily matches the longest word from the start of the string
 */
function forwardMaxMatch(text: string, maxWordLength: number = 10): SegmentedWord[] {
  initDictionary();
  const results: SegmentedWord[] = [];
  let pos = 0;
  
  while (pos < text.length) {
    // Skip spaces
    if (text[pos] === ' ' || text[pos] === '\u200B') {
      pos++;
      continue;
    }
    
    // Try to find the longest matching word
    let matched = false;
    for (let len = Math.min(maxWordLength, text.length - pos); len > 0; len--) {
      const candidate = text.slice(pos, pos + len);
      
      if (isKnownWord(candidate)) {
        results.push({
          text: candidate,
          startIndex: pos,
          endIndex: pos + len,
          confidence: 'high',
          dictionaryMatch: getDictionaryEntry(candidate),
        });
        pos += len;
        matched = true;
        break;
      }
    }
    
    // If no match found, take single character as unknown
    if (!matched) {
      // Try to group consecutive unknown characters
      let unknownEnd = pos + 1;
      while (unknownEnd < text.length && 
             text[unknownEnd] !== ' ' && 
             !isKnownWord(text.slice(pos, unknownEnd + 1))) {
        // Check if the next chunk might be a known word
        let foundNext = false;
        for (let len = Math.min(maxWordLength, text.length - unknownEnd); len > 0; len--) {
          if (isKnownWord(text.slice(unknownEnd, unknownEnd + len))) {
            foundNext = true;
            break;
          }
        }
        if (foundNext) break;
        unknownEnd++;
      }
      
      results.push({
        text: text.slice(pos, unknownEnd),
        startIndex: pos,
        endIndex: unknownEnd,
        confidence: 'low',
        dictionaryMatch: null,
      });
      pos = unknownEnd;
    }
  }
  
  return results;
}

/**
 * Backward Maximum Matching
 * Greedily matches the longest word from the end of the string
 */
function backwardMaxMatch(text: string, maxWordLength: number = 10): SegmentedWord[] {
  initDictionary();
  const results: SegmentedWord[] = [];
  let pos = text.length;
  
  while (pos > 0) {
    // Skip spaces
    if (text[pos - 1] === ' ' || text[pos - 1] === '\u200B') {
      pos--;
      continue;
    }
    
    // Try to find the longest matching word ending at pos
    let matched = false;
    for (let len = Math.min(maxWordLength, pos); len > 0; len--) {
      const start = pos - len;
      const candidate = text.slice(start, pos);
      
      if (isKnownWord(candidate)) {
        results.unshift({
          text: candidate,
          startIndex: start,
          endIndex: pos,
          confidence: 'high',
          dictionaryMatch: getDictionaryEntry(candidate),
        });
        pos = start;
        matched = true;
        break;
      }
    }
    
    // If no match, take single character
    if (!matched) {
      results.unshift({
        text: text[pos - 1],
        startIndex: pos - 1,
        endIndex: pos,
        confidence: 'low',
        dictionaryMatch: null,
      });
      pos--;
    }
  }
  
  return results;
}

/**
 * Bidirectional Maximum Matching
 * Combines forward and backward matching, choosing the better result
 */
export function segmentText(text: string): SegmentationResult {
  // Remove existing spaces for segmentation (we'll add our own)
  const cleanText = text.replace(/[\s\u200B]+/g, '');
  
  if (!cleanText) {
    return {
      words: [],
      originalText: text,
      method: 'dictionary',
      overallConfidence: 'high',
    };
  }
  
  const forwardResult = forwardMaxMatch(cleanText);
  const backwardResult = backwardMaxMatch(cleanText);
  
  // Choose the result with fewer segments (usually more accurate)
  // If equal, prefer the one with more high-confidence matches
  let chosen: SegmentedWord[];
  
  if (forwardResult.length !== backwardResult.length) {
    chosen = forwardResult.length < backwardResult.length ? forwardResult : backwardResult;
  } else {
    const forwardHighConf = forwardResult.filter(w => w.confidence === 'high').length;
    const backwardHighConf = backwardResult.filter(w => w.confidence === 'high').length;
    chosen = forwardHighConf >= backwardHighConf ? forwardResult : backwardResult;
  }
  
  // Calculate overall confidence
  const highCount = chosen.filter(w => w.confidence === 'high').length;
  const totalCount = chosen.length;
  const ratio = totalCount > 0 ? highCount / totalCount : 1;
  
  let overallConfidence: 'high' | 'medium' | 'low';
  if (ratio >= 0.8) {
    overallConfidence = 'high';
  } else if (ratio >= 0.5) {
    overallConfidence = 'medium';
  } else {
    overallConfidence = 'low';
  }
  
  return {
    words: chosen,
    originalText: text,
    method: 'dictionary',
    overallConfidence,
  };
}

/**
 * Convert segmented words back to spaced text
 */
export function segmentedToText(words: SegmentedWord[]): string {
  return words.map(w => w.text).join(' ');
}

/**
 * Parse user-modified text (with spaces) into segments
 * Preserves user's spacing choices
 */
export function parseUserSpacedText(text: string): SegmentationResult {
  const parts = text.split(/\s+/).filter(p => p.length > 0);
  const words: SegmentedWord[] = [];
  let pos = 0;
  
  for (const part of parts) {
    const entry = getDictionaryEntry(part);
    words.push({
      text: part,
      startIndex: pos,
      endIndex: pos + part.length,
      confidence: entry ? 'high' : 'low',
      dictionaryMatch: entry,
      isUserModified: true,
    });
    pos += part.length + 1; // +1 for the space
  }
  
  const highCount = words.filter(w => w.confidence === 'high').length;
  const ratio = words.length > 0 ? highCount / words.length : 1;
  
  return {
    words,
    originalText: text,
    method: 'user',
    overallConfidence: ratio >= 0.8 ? 'high' : ratio >= 0.5 ? 'medium' : 'low',
  };
}

/**
 * Future: LLM-based segmentation
 * This is a placeholder for when we add LLM support
 */
export interface LLMSegmentationOptions {
  apiEndpoint?: string;
  model?: string;
  fallbackToDictionary?: boolean;
}

export async function segmentTextWithLLM(
  text: string, 
  _options?: LLMSegmentationOptions
): Promise<SegmentationResult> {
  // TODO: Implement LLM-based segmentation
  // For now, fall back to dictionary-based
  console.log('[segmentTextWithLLM] LLM segmentation not yet implemented, using dictionary fallback');
  return segmentText(text);
}

/**
 * Suggest where to add spaces in text
 * Returns indices where spaces should be inserted
 */
export function suggestSpacePositions(text: string): number[] {
  const result = segmentText(text);
  const positions: number[] = [];
  
  for (let i = 0; i < result.words.length - 1; i++) {
    positions.push(result.words[i].endIndex);
  }
  
  return positions;
}

