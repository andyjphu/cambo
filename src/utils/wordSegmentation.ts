/**
 * Word Segmentation Utility
 * =========================
 * 
 * Implements dictionary-based word segmentation using bidirectional maximum matching.
 * Designed to be extended with LLM-based segmentation in the future.
 * 
 * KEY PRINCIPLE: Segmentation operates on orthographic clusters, not individual characters.
 * A cluster (consonant + vowels/diacritics) is treated as an indivisible unit.
 * This ensures srak (vowels) are never broken off from their consonants.
 * 
 * Current approach: Uses our existing dictionary (~250 words)
 * Future: Can plug in an LLM API for better accuracy
 */

import { coreDictionary, lookupKhmer, type DictionaryEntry } from './dictionaryCore';
import { getExtendedDictionary, getWordListSet, loadWordList, lookupExtended } from './dictionaryLoader';
import { parseKhmerText, type KhmerCluster } from './khmerParser';

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

  // First, try to use the pre-loaded word list (25K+ words)
  const wordList = getWordListSet();
  if (wordList && wordList.size > 0) {
    dictionaryWords = wordList;
  } else {
    // Fallback to building from dictionaries
    dictionaryWords = new Set<string>();

    // Add core dictionary words
    for (const entry of coreDictionary) {
      dictionaryWords.add(entry.khmer);
    }

    // Add extended dictionary if loaded
    const extended = getExtendedDictionary();
    if (extended) {
      for (const entry of extended) {
        dictionaryWords.add(entry.khmer);
      }
    }
  }

  // Build lookup map from dictionaries
  dictionaryMap = new Map<string, DictionaryEntry>();
  for (const entry of coreDictionary) {
    dictionaryMap.set(entry.khmer, entry);
  }
  const extended = getExtendedDictionary();
  if (extended) {
    for (const entry of extended) {
      if (!dictionaryMap.has(entry.khmer)) {
        dictionaryMap.set(entry.khmer, entry);
      }
    }
  }
}

/**
 * Ensure word list is loaded for segmentation
 * Call this early in your app initialization
 */
export async function ensureWordListLoaded(): Promise<void> {
  await loadWordList();
  // Reinitialize with the loaded word list
  dictionaryWords = null;
  dictionaryMap = null;
  initDictionary();
}

/**
 * Get dictionary entry for a word
 * Checks core dictionary first, then extended
 */
export function getDictionaryEntry(word: string): DictionaryEntry | null {
  // Try core dictionary first (always loaded, has English)
  const coreEntry = lookupKhmer(word);
  if (coreEntry) return coreEntry;

  // Try extended dictionary
  const extEntry = lookupExtended(word);
  if (extEntry) return extEntry;

  // Fallback to map
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
 * Build text from a range of clusters
 */
function clustersToText(clusters: KhmerCluster[], start: number, end: number): string {
  return clusters.slice(start, end).map(c => c.text).join('');
}

/**
 * Forward Maximum Matching (Cluster-based)
 * Greedily matches the longest word from the start, respecting cluster boundaries
 * This ensures vowels/diacritics are never separated from their consonants
 */
function forwardMaxMatch(clusters: KhmerCluster[], maxClusters: number = 8): SegmentedWord[] {
  initDictionary();
  const results: SegmentedWord[] = [];
  let pos = 0;
  let charPos = 0; // Track character position in original text

  while (pos < clusters.length) {
    const cluster = clusters[pos];

    // Skip spaces
    if (cluster.type === 'space') {
      charPos += cluster.text.length;
      pos++;
      continue;
    }

    // Try to find the longest matching word (in terms of clusters)
    let matched = false;
    for (let numClusters = Math.min(maxClusters, clusters.length - pos); numClusters > 0; numClusters--) {
      // Build candidate from consecutive non-space clusters
      let clusterCount = 0;
      let endPos = pos;
      while (endPos < clusters.length && clusterCount < numClusters) {
        if (clusters[endPos].type !== 'space') {
          clusterCount++;
        }
        endPos++;
      }

      const candidate = clustersToText(clusters, pos, endPos);

      if (isKnownWord(candidate)) {
        const startChar = charPos;
        const endChar = charPos + candidate.length;

        results.push({
          text: candidate,
          startIndex: startChar,
          endIndex: endChar,
          confidence: 'high',
          dictionaryMatch: getDictionaryEntry(candidate),
        });

        charPos = endChar;
        pos = endPos;
        matched = true;
        break;
      }
    }

    // If no match found, take single cluster as unknown word
    if (!matched) {
      // Group consecutive unmatched clusters until we find a match
      let unknownEndPos = pos + 1;

      // Look ahead to see if next clusters form a known word
      while (unknownEndPos < clusters.length) {
        if (clusters[unknownEndPos].type === 'space') {
          break;
        }

        // Check if starting from unknownEndPos we can find a match
        let foundNext = false;
        for (let numClusters = Math.min(maxClusters, clusters.length - unknownEndPos); numClusters > 0; numClusters--) {
          let endCheck = unknownEndPos;
          let count = 0;
          while (endCheck < clusters.length && count < numClusters) {
            if (clusters[endCheck].type !== 'space') count++;
            endCheck++;
          }
          const checkCandidate = clustersToText(clusters, unknownEndPos, endCheck);
          if (isKnownWord(checkCandidate)) {
            foundNext = true;
            break;
          }
        }
        if (foundNext) break;
        unknownEndPos++;
      }

      const unknownText = clustersToText(clusters, pos, unknownEndPos);
      const startChar = charPos;
      const endChar = charPos + unknownText.length;

      results.push({
        text: unknownText,
        startIndex: startChar,
        endIndex: endChar,
        confidence: 'low',
        dictionaryMatch: null,
      });

      charPos = endChar;
      pos = unknownEndPos;
    }
  }

  return results;
}

/**
 * Backward Maximum Matching (Cluster-based)
 * Greedily matches the longest word from the end, respecting cluster boundaries
 */
function backwardMaxMatch(clusters: KhmerCluster[], maxClusters: number = 8): SegmentedWord[] {
  initDictionary();
  const results: SegmentedWord[] = [];

  // Calculate total character length
  const totalCharLen = clusters.reduce((sum, c) => sum + c.text.length, 0);
  let pos = clusters.length;
  let charPos = totalCharLen;

  while (pos > 0) {
    const cluster = clusters[pos - 1];

    // Skip spaces
    if (cluster.type === 'space') {
      charPos -= cluster.text.length;
      pos--;
      continue;
    }

    // Try to find the longest matching word ending at pos
    let matched = false;
    for (let numClusters = Math.min(maxClusters, pos); numClusters > 0; numClusters--) {
      // Find start position skipping spaces
      let startPos = pos;
      let clusterCount = 0;
      while (startPos > 0 && clusterCount < numClusters) {
        startPos--;
        if (clusters[startPos].type !== 'space') {
          clusterCount++;
        }
      }

      const candidate = clustersToText(clusters, startPos, pos);

      if (isKnownWord(candidate)) {
        const endChar = charPos;
        const startChar = charPos - candidate.length;

        results.unshift({
          text: candidate,
          startIndex: startChar,
          endIndex: endChar,
          confidence: 'high',
          dictionaryMatch: getDictionaryEntry(candidate),
        });

        charPos = startChar;
        pos = startPos;
        matched = true;
        break;
      }
    }

    // If no match, take single cluster
    if (!matched) {
      const singleText = clusters[pos - 1].text;
      const endChar = charPos;
      const startChar = charPos - singleText.length;

      results.unshift({
        text: singleText,
        startIndex: startChar,
        endIndex: endChar,
        confidence: 'low',
        dictionaryMatch: null,
      });

      charPos = startChar;
      pos--;
    }
  }

  return results;
}

/**
 * Bidirectional Maximum Matching (Cluster-based)
 * Combines forward and backward matching, choosing the better result
 * 
 * KEY: Operates on clusters to ensure srak/diacritics stay with consonants
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

  // Parse into clusters FIRST - this ensures we never break within a cluster
  const clusters = parseKhmerText(cleanText);

  // Filter out space clusters for segmentation
  const nonSpaceClusters = clusters.filter(c => c.type !== 'space');

  if (nonSpaceClusters.length === 0) {
    return {
      words: [],
      originalText: text,
      method: 'dictionary',
      overallConfidence: 'high',
    };
  }

  const forwardResult = forwardMaxMatch(nonSpaceClusters);
  const backwardResult = backwardMaxMatch(nonSpaceClusters);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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


