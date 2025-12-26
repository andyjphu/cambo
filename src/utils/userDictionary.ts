/**
 * User Dictionary System
 * ======================
 * 
 * Allows users to add custom words to their personal dictionary.
 * Data is stored in localStorage and can be exported as JSON/CSV.
 */

import { type DictionaryEntry } from './dictionaryCore';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

export interface UserDictionaryEntry extends DictionaryEntry {
  createdAt: string;
  updatedAt: string;
}

/**
 * Load user dictionary from localStorage
 */
export function getUserDictionary(): UserDictionaryEntry[] {
  return getStorageItem(STORAGE_KEYS.USER_DICTIONARY, []);
}

/**
 * Save user dictionary to localStorage
 */
function saveUserDictionary(entries: UserDictionaryEntry[]): void {
  setStorageItem(STORAGE_KEYS.USER_DICTIONARY, entries);
}

/**
 * Add a new word to the user dictionary
 */
export function addUserWord(entry: Omit<DictionaryEntry, 'frequency'>): UserDictionaryEntry {
  const entries = getUserDictionary();
  const now = new Date().toISOString();
  
  // Check if word already exists
  const existingIdx = entries.findIndex(e => e.khmer === entry.khmer);
  
  const newEntry: UserDictionaryEntry = {
    ...entry,
    frequency: 50, // Default frequency for user words
    createdAt: existingIdx >= 0 ? entries[existingIdx].createdAt : now,
    updatedAt: now,
  };
  
  if (existingIdx >= 0) {
    // Update existing entry
    entries[existingIdx] = newEntry;
  } else {
    // Add new entry
    entries.push(newEntry);
  }
  
  saveUserDictionary(entries);
  return newEntry;
}

/**
 * Remove a word from the user dictionary
 */
export function removeUserWord(khmer: string): boolean {
  const entries = getUserDictionary();
  const idx = entries.findIndex(e => e.khmer === khmer);
  
  if (idx >= 0) {
    entries.splice(idx, 1);
    saveUserDictionary(entries);
    return true;
  }
  return false;
}

/**
 * Look up a word in the user dictionary
 */
export function lookupUserWord(khmer: string): UserDictionaryEntry | null {
  const entries = getUserDictionary();
  return entries.find(e => e.khmer === khmer) || null;
}

/**
 * Export user dictionary as JSON
 */
export function exportAsJSON(): string {
  const entries = getUserDictionary();
  return JSON.stringify(entries, null, 2);
}

/**
 * Export user dictionary as CSV
 */
export function exportAsCSV(): string {
  const entries = getUserDictionary();
  const headers = ['khmer', 'english', 'romanized', 'phonetic', 'pos', 'createdAt', 'updatedAt'];
  
  const rows = entries.map(e => [
    e.khmer,
    e.english || '',
    e.romanized || '',
    e.phonetic || '',
    e.pos || '',
    e.createdAt,
    e.updatedAt,
  ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Import user dictionary from JSON
 */
export function importFromJSON(jsonStr: string): number {
  try {
    const imported = JSON.parse(jsonStr);
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: expected array');
    }
    
    const entries = getUserDictionary();
    let addedCount = 0;
    
    for (const item of imported) {
      if (item.khmer && typeof item.khmer === 'string') {
        const existingIdx = entries.findIndex(e => e.khmer === item.khmer);
        const now = new Date().toISOString();
        
        const entry: UserDictionaryEntry = {
          khmer: item.khmer,
          english: item.english || '',
          romanized: item.romanized,
          phonetic: item.phonetic,
          pos: item.pos,
          frequency: item.frequency || 50,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };
        
        if (existingIdx >= 0) {
          entries[existingIdx] = entry;
        } else {
          entries.push(entry);
          addedCount++;
        }
      }
    }
    
    saveUserDictionary(entries);
    return addedCount;
  } catch (e) {
    console.error('Failed to import user dictionary:', e);
    throw e;
  }
}

/**
 * Get word count in user dictionary
 */
export function getUserDictionaryCount(): number {
  return getUserDictionary().length;
}

/**
 * Clear all user dictionary entries
 */
export function clearUserDictionary(): void {
  removeStorageItem(STORAGE_KEYS.USER_DICTIONARY);
}

/**
 * Get Unicode info for a character (for debugging/dev use)
 */
export function getUnicodeInfo(char: string): { codePoint: string; hex: string; decimal: number } {
  const code = char.codePointAt(0) || 0;
  return {
    codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
    hex: `0x${code.toString(16).toUpperCase()}`,
    decimal: code,
  };
}

