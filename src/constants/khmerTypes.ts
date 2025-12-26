import type { KhmerCharType } from '../utils/khmerParser';

/**
 * Labels for Khmer character types
 * Used for display in tooltips and UI
 */
export const TYPE_LABELS: Record<KhmerCharType, string> = {
  consonant: 'Consonant',
  subscript: 'Subscript',
  vowel: 'Vowel',
  indep_vowel: 'Ind. Vowel',
  sign: 'Sign',
  numeral: 'Number',
  punctuation: 'Punct.',
  coeng: 'Coeng',
  space: 'Space',
  other: 'Other',
};

/**
 * Part of speech labels - full names for user display
 */
export const POS_LABELS: Record<string, string> = {
  noun: 'noun',
  verb: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  pron: 'pronoun',
  prep: 'preposition',
  conj: 'conjunction',
  part: 'particle',
  num: 'number',
};

