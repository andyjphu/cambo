#!/usr/bin/env python3
"""
Khmer Dictionary Generator
===========================
This script generates Khmer dictionary data with ALA-LC romanization.

It:
1. Parses Khmer text into components (consonants, vowels, signs)
2. Applies ALA-LC romanization rules algorithmically
3. Generates TypeScript files for core and extended dictionaries

Usage:
    python scripts/generate_dictionary.py

Output:
    - src/utils/dictionaryCoreGenerated.ts (Tier 1 - always loaded)
    - src/data/dictionaryExtended.json (Tier 2 - lazy loaded)
"""

import json
import re
import unicodedata
from pathlib import Path
from typing import NamedTuple, Optional
from dataclasses import dataclass, asdict

# ============================================================================
# Khmer Unicode Ranges and Character Data
# ============================================================================

# Khmer consonants with their romanization and series
CONSONANTS = {
    'ក': {'initial': 'k', 'final': 'k', 'series': 1, 'name': 'ka'},
    'ខ': {'initial': 'kh', 'final': 'k', 'series': 1, 'name': 'kha'},
    'គ': {'initial': 'k', 'final': 'k', 'series': 2, 'name': 'ko'},
    'ឃ': {'initial': 'kh', 'final': 'k', 'series': 2, 'name': 'kho'},
    'ង': {'initial': 'ng', 'final': 'ng', 'series': 2, 'name': 'ngo'},
    'ច': {'initial': 'ch', 'final': 'ch', 'series': 1, 'name': 'cha'},
    'ឆ': {'initial': 'chh', 'final': 'ch', 'series': 1, 'name': 'chha'},
    'ជ': {'initial': 'ch', 'final': 'ch', 'series': 2, 'name': 'cho'},
    'ឈ': {'initial': 'chh', 'final': 'ch', 'series': 2, 'name': 'chho'},
    'ញ': {'initial': 'ñ', 'final': 'nh', 'series': 2, 'name': 'nyo'},
    'ដ': {'initial': 'd', 'final': 't', 'series': 1, 'name': 'da'},
    'ឋ': {'initial': 'th', 'final': 't', 'series': 1, 'name': 'tha'},
    'ឌ': {'initial': 'd', 'final': 't', 'series': 2, 'name': 'do'},
    'ឍ': {'initial': 'th', 'final': 't', 'series': 2, 'name': 'tho'},
    'ណ': {'initial': 'n', 'final': 'n', 'series': 1, 'name': 'na'},
    'ត': {'initial': 't', 'final': 't', 'series': 1, 'name': 'ta'},
    'ថ': {'initial': 'th', 'final': 't', 'series': 1, 'name': 'tha'},
    'ទ': {'initial': 't', 'final': 't', 'series': 2, 'name': 'to'},
    'ធ': {'initial': 'th', 'final': 't', 'series': 2, 'name': 'tho'},
    'ន': {'initial': 'n', 'final': 'n', 'series': 2, 'name': 'no'},
    'ប': {'initial': 'b', 'final': 'p', 'series': 1, 'name': 'ba'},
    'ផ': {'initial': 'ph', 'final': 'p', 'series': 1, 'name': 'pha'},
    'ព': {'initial': 'p', 'final': 'p', 'series': 2, 'name': 'po'},
    'ភ': {'initial': 'ph', 'final': 'p', 'series': 2, 'name': 'pho'},
    'ម': {'initial': 'm', 'final': 'm', 'series': 2, 'name': 'mo'},
    'យ': {'initial': 'y', 'final': 'y', 'series': 2, 'name': 'yo'},
    'រ': {'initial': 'r', 'final': 'r', 'series': 2, 'name': 'ro'},
    'ល': {'initial': 'l', 'final': 'l', 'series': 2, 'name': 'lo'},
    'វ': {'initial': 'v', 'final': 'o', 'series': 2, 'name': 'vo'},
    'ស': {'initial': 's', 'final': 's', 'series': 1, 'name': 'sa'},
    'ហ': {'initial': 'h', 'final': 'h', 'series': 1, 'name': 'ha'},
    'ឡ': {'initial': 'l', 'final': 'l', 'series': 1, 'name': 'la'},
    'អ': {'initial': "'", 'final': '', 'series': 1, 'name': 'a'},
}

# Vowels with series-dependent romanization
VOWELS = {
    'ា': {'series1': 'ā', 'series2': 'ā', 'name': 'aa'},
    'ិ': {'series1': 'ĕ', 'series2': 'ĭ', 'name': 'i'},
    'ី': {'series1': 'ei', 'series2': 'ī', 'name': 'ii'},
    'ឹ': {'series1': 'œ̆', 'series2': 'œ̆', 'name': 'oe-short'},
    'ឺ': {'series1': 'œ', 'series2': 'œ', 'name': 'oe'},
    'ុ': {'series1': 'ŏ', 'series2': 'ŭ', 'name': 'u-short'},
    'ូ': {'series1': 'o', 'series2': 'ū', 'name': 'uu'},
    'ួ': {'series1': 'uă', 'series2': 'uŏ', 'name': 'ua'},
    'ើ': {'series1': 'aeu', 'series2': 'eu', 'name': 'aeu'},
    'ឿ': {'series1': 'œă', 'series2': 'œă', 'name': 'oea'},
    'ៀ': {'series1': 'iĕ', 'series2': 'iĕ', 'name': 'ie'},
    'េ': {'series1': 'é', 'series2': 'é', 'name': 'e'},
    'ែ': {'series1': 'ê', 'series2': 'ê', 'name': 'ae'},
    'ៃ': {'series1': 'ai', 'series2': 'ey', 'name': 'ai'},
    'ោ': {'series1': 'au', 'series2': 'o', 'name': 'ao'},
    'ៅ': {'series1': 'au', 'series2': 'ŏu', 'name': 'av'},
}

# Inherent vowel (when no explicit vowel)
INHERENT_VOWEL = {'series1': 'â', 'series2': 'ô'}

# Signs that affect pronunciation
SIGNS = {
    'ំ': {'effect': 'nasal', 'append': 'm'},
    'ះ': {'effect': 'aspirate', 'append': 'h'},
    '់': {'effect': 'stop', 'append': ''},
    '៉': {'effect': 'series1'},
    '៊': {'effect': 'series2'},
    '្': {'effect': 'subscript'},
}

# Phonetic conversion map (ALA-LC to English-friendly)
PHONETIC_CONSONANT_MAP = {
    'k': 'k', 'kh': 'kh', 'ng': 'ng', 'ch': 'ch', 'chh': 'chh',
    'ñ': 'ny', 'd': 'd', 'th': 'th', 't': 't', 'n': 'n',
    'b': 'b', 'ph': 'ph', 'p': 'p', 'm': 'm', 'y': 'y',
    'r': 'r', 'l': 'l', 'v': 'v', 's': 's', 'h': 'h', "'": '',
}

PHONETIC_VOWEL_MAP = {
    'â': 'a', 'ô': 'o', 'ā': 'ah', 'ĕ': 'e', 'ĭ': 'i',
    'ei': 'ay', 'ī': 'ee', 'œ̆': 'eu', 'œ': 'eu',
    'ŏ': 'o', 'ŭ': 'u', 'o': 'oh', 'ū': 'oo',
    'uă': 'ua', 'uŏ': 'uo', 'aeu': 'eu', 'eu': 'eu',
    'œă': 'eua', 'iĕ': 'ia', 'é': 'ay', 'ê': 'eh',
    'ai': 'ai', 'ey': 'ey', 'au': 'ao', 'ŏu': 'ou',
}


# ============================================================================
# Character Classification
# ============================================================================

def is_khmer_consonant(char: str) -> bool:
    return char in CONSONANTS

def is_khmer_vowel(char: str) -> bool:
    return char in VOWELS

def is_khmer_sign(char: str) -> bool:
    return char in SIGNS

def is_khmer_subscript_marker(char: str) -> bool:
    return char == '្'


# ============================================================================
# Khmer Text Parsing
# ============================================================================

@dataclass
class KhmerComponent:
    char: str
    type: str  # 'consonant', 'vowel', 'sign', 'subscript'


def parse_khmer_word(word: str) -> list[list[KhmerComponent]]:
    """
    Parse a Khmer word into syllable clusters.
    Each cluster is a list of components.
    """
    clusters = []
    current_cluster = []
    
    i = 0
    while i < len(word):
        char = word[i]
        
        if is_khmer_consonant(char):
            # Check if this starts a new cluster
            if current_cluster and not is_khmer_subscript_marker(word[i-1] if i > 0 else ''):
                # Check if previous char was subscript marker
                prev_was_subscript = i > 0 and is_khmer_subscript_marker(word[i-1])
                if not prev_was_subscript and current_cluster:
                    # Start new cluster only if we have vowel/sign already
                    has_vowel_or_sign = any(c.type in ('vowel', 'sign') for c in current_cluster)
                    if has_vowel_or_sign:
                        clusters.append(current_cluster)
                        current_cluster = []
            
            current_cluster.append(KhmerComponent(char, 'consonant'))
        
        elif is_khmer_subscript_marker(char):
            current_cluster.append(KhmerComponent(char, 'sign'))
            # Next consonant is a subscript
            if i + 1 < len(word) and is_khmer_consonant(word[i + 1]):
                i += 1
                current_cluster.append(KhmerComponent(word[i], 'subscript'))
        
        elif is_khmer_vowel(char):
            current_cluster.append(KhmerComponent(char, 'vowel'))
        
        elif is_khmer_sign(char):
            current_cluster.append(KhmerComponent(char, 'sign'))
        
        i += 1
    
    if current_cluster:
        clusters.append(current_cluster)
    
    return clusters


# ============================================================================
# Romanization
# ============================================================================

def romanize_cluster(components: list[KhmerComponent]) -> tuple[str, str]:
    """
    Romanize a single cluster using ALA-LC rules.
    Returns (romanized, phonetic).
    """
    if not components:
        return '', ''
    
    # Determine base series from first consonant
    base_series = 1
    has_explicit_vowel = False
    has_subscript = False
    
    for comp in components:
        if comp.type == 'consonant':
            info = CONSONANTS.get(comp.char)
            if info:
                base_series = info['series']
        if comp.type == 'vowel':
            has_explicit_vowel = True
        if comp.type == 'sign':
            if comp.char == '៉':
                base_series = 1
            elif comp.char == '៊':
                base_series = 2
        if comp.type == 'subscript':
            has_subscript = True
    
    # Build romanization
    romanized = ''
    phonetic = ''
    vowel_part = ''
    sign_parts = []
    
    for comp in components:
        if comp.type == 'consonant':
            info = CONSONANTS.get(comp.char)
            if info:
                romanized += info['initial']
                phonetic += PHONETIC_CONSONANT_MAP.get(info['initial'], info['initial'])
        
        elif comp.type == 'subscript':
            info = CONSONANTS.get(comp.char)
            if info:
                romanized += info['initial']
                phonetic += PHONETIC_CONSONANT_MAP.get(info['initial'], info['initial'])
        
        elif comp.type == 'vowel':
            v_info = VOWELS.get(comp.char)
            if v_info:
                vowel_part = v_info['series1'] if base_series == 1 else v_info['series2']
        
        elif comp.type == 'sign':
            s_info = SIGNS.get(comp.char)
            if s_info and 'append' in s_info and s_info['append']:
                sign_parts.append(s_info['append'])
    
    # Add vowel (or inherent)
    if not has_explicit_vowel:
        vowel_part = INHERENT_VOWEL['series1'] if base_series == 1 else INHERENT_VOWEL['series2']
    
    romanized += vowel_part
    phonetic += PHONETIC_VOWEL_MAP.get(vowel_part, vowel_part)
    
    # Add sign effects
    for sign in sign_parts:
        romanized += sign
        phonetic += sign
    
    return romanized, phonetic.upper()


def romanize_word(word: str) -> tuple[str, str]:
    """
    Romanize a full Khmer word.
    Returns (romanized, phonetic).
    """
    clusters = parse_khmer_word(word)
    
    rom_parts = []
    phon_parts = []
    
    for cluster in clusters:
        rom, phon = romanize_cluster(cluster)
        if rom:
            rom_parts.append(rom)
        if phon:
            phon_parts.append(phon)
    
    return '-'.join(rom_parts), '-'.join(phon_parts)


# ============================================================================
# Dictionary Entry Processing
# ============================================================================

@dataclass
class DictionaryEntry:
    khmer: str
    english: str
    pos: Optional[str] = None
    romanized: Optional[str] = None
    phonetic: Optional[str] = None
    frequency: Optional[int] = None


def process_entry(entry: dict) -> DictionaryEntry:
    """
    Process a raw dictionary entry and add romanization.
    """
    khmer = entry['khmer']
    english = entry['english']
    pos = entry.get('pos')
    frequency = entry.get('frequency')
    
    # Generate romanization algorithmically
    romanized, phonetic = romanize_word(khmer)
    
    return DictionaryEntry(
        khmer=khmer,
        english=english,
        pos=pos,
        romanized=romanized,
        phonetic=phonetic,
        frequency=frequency,
    )


# ============================================================================
# Core Dictionary Data (from existing dictionaryCore.ts)
# ============================================================================

# This is the existing core vocabulary - we'll add romanization to it
CORE_VOCABULARY = [
    # Greetings & Politeness
    {'khmer': 'សួស្តី', 'english': 'hello', 'pos': 'noun', 'frequency': 100},
    {'khmer': 'អរគុណ', 'english': 'thank you', 'pos': 'noun', 'frequency': 100},
    {'khmer': 'សូម', 'english': 'please', 'pos': 'part', 'frequency': 95},
    {'khmer': 'សូមទោស', 'english': 'sorry/excuse me', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'បាទ', 'english': 'yes (male)', 'pos': 'part', 'frequency': 100},
    {'khmer': 'ចាស', 'english': 'yes (female)', 'pos': 'part', 'frequency': 100},
    {'khmer': 'ទេ', 'english': 'no/not', 'pos': 'part', 'frequency': 100},
    {'khmer': 'មិន', 'english': 'not', 'pos': 'adv', 'frequency': 95},
    
    # Pronouns
    {'khmer': 'ខ្ញុំ', 'english': 'I/me', 'pos': 'pron', 'frequency': 100},
    {'khmer': 'អ្នក', 'english': 'you', 'pos': 'pron', 'frequency': 100},
    {'khmer': 'គាត់', 'english': 'he/she/they', 'pos': 'pron', 'frequency': 95},
    {'khmer': 'យើង', 'english': 'we', 'pos': 'pron', 'frequency': 90},
    {'khmer': 'គេ', 'english': 'they/people', 'pos': 'pron', 'frequency': 85},
    {'khmer': 'នេះ', 'english': 'this', 'pos': 'pron', 'frequency': 95},
    {'khmer': 'នោះ', 'english': 'that', 'pos': 'pron', 'frequency': 95},
    {'khmer': 'អី', 'english': 'what', 'pos': 'pron', 'frequency': 90},
    {'khmer': 'អ្វី', 'english': 'what (formal)', 'pos': 'pron', 'frequency': 90},
    {'khmer': 'ណា', 'english': 'where/which', 'pos': 'pron', 'frequency': 90},
    {'khmer': 'នរណា', 'english': 'who', 'pos': 'pron', 'frequency': 85},
    
    # Common Verbs
    {'khmer': 'ទៅ', 'english': 'go', 'pos': 'verb', 'frequency': 100},
    {'khmer': 'មក', 'english': 'come', 'pos': 'verb', 'frequency': 100},
    {'khmer': 'ញ៉ាំ', 'english': 'eat', 'pos': 'verb', 'frequency': 95},
    {'khmer': 'ផឹក', 'english': 'drink', 'pos': 'verb', 'frequency': 90},
    {'khmer': 'ដឹង', 'english': 'know', 'pos': 'verb', 'frequency': 95},
    {'khmer': 'ចង់', 'english': 'want', 'pos': 'verb', 'frequency': 95},
    {'khmer': 'មាន', 'english': 'have/there is', 'pos': 'verb', 'frequency': 100},
    {'khmer': 'ធ្វើ', 'english': 'do/make', 'pos': 'verb', 'frequency': 95},
    {'khmer': 'និយាយ', 'english': 'speak/say', 'pos': 'verb', 'frequency': 90},
    {'khmer': 'មើល', 'english': 'look/watch', 'pos': 'verb', 'frequency': 90},
    {'khmer': 'ស្តាប់', 'english': 'listen', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'អាន', 'english': 'read', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'សរសេរ', 'english': 'write', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ស្រឡាញ់', 'english': 'love', 'pos': 'verb', 'frequency': 90},
    {'khmer': 'ចូលចិត្ត', 'english': 'like', 'pos': 'verb', 'frequency': 90},
    {'khmer': 'ជឿ', 'english': 'believe', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'គិត', 'english': 'think', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ដេក', 'english': 'sleep', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ក្រោក', 'english': 'wake up/get up', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'រត់', 'english': 'run', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'ដើរ', 'english': 'walk', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'ជិះ', 'english': 'ride', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'ឈប់', 'english': 'stop', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'ចាំ', 'english': 'wait/remember', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ភ្លេច', 'english': 'forget', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'ទិញ', 'english': 'buy', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'លក់', 'english': 'sell', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'ផ្តល់', 'english': 'give', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'យក', 'english': 'take', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ដាក់', 'english': 'put', 'pos': 'verb', 'frequency': 80},
    
    # Numbers
    {'khmer': 'មួយ', 'english': 'one', 'pos': 'num', 'frequency': 100},
    {'khmer': 'ពីរ', 'english': 'two', 'pos': 'num', 'frequency': 100},
    {'khmer': 'បី', 'english': 'three', 'pos': 'num', 'frequency': 100},
    {'khmer': 'បួន', 'english': 'four', 'pos': 'num', 'frequency': 95},
    {'khmer': 'ប្រាំ', 'english': 'five', 'pos': 'num', 'frequency': 95},
    {'khmer': 'ប្រាំមួយ', 'english': 'six', 'pos': 'num', 'frequency': 90},
    {'khmer': 'ប្រាំពីរ', 'english': 'seven', 'pos': 'num', 'frequency': 90},
    {'khmer': 'ប្រាំបី', 'english': 'eight', 'pos': 'num', 'frequency': 90},
    {'khmer': 'ប្រាំបួន', 'english': 'nine', 'pos': 'num', 'frequency': 90},
    {'khmer': 'ដប់', 'english': 'ten', 'pos': 'num', 'frequency': 95},
    {'khmer': 'រយ', 'english': 'hundred', 'pos': 'num', 'frequency': 85},
    {'khmer': 'ពាន់', 'english': 'thousand', 'pos': 'num', 'frequency': 80},
    
    # Time
    {'khmer': 'ថ្ងៃ', 'english': 'day', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'យប់', 'english': 'night', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'ព្រឹក', 'english': 'morning', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'ល្ងាច', 'english': 'evening', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ម៉ោង', 'english': 'hour/time', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'នាទី', 'english': 'minute', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ឥឡូវ', 'english': 'now', 'pos': 'adv', 'frequency': 90},
    {'khmer': 'ម្សិលមិញ', 'english': 'yesterday', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ថ្ងៃនេះ', 'english': 'today', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'ថ្ងៃស្អែក', 'english': 'tomorrow', 'pos': 'noun', 'frequency': 85},
    
    # Places & Directions
    {'khmer': 'ផ្ទះ', 'english': 'house/home', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'សាលា', 'english': 'school', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ផ្សារ', 'english': 'market', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'មន្ទីរពេទ្យ', 'english': 'hospital', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'វត្ត', 'english': 'temple/pagoda', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ភូមិ', 'english': 'village', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ទីក្រុង', 'english': 'city', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ប្រទេស', 'english': 'country', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'កម្ពុជា', 'english': 'Cambodia', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'ឆ្វេង', 'english': 'left', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ស្តាំ', 'english': 'right', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'មុខ', 'english': 'front/face', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ក្រោយ', 'english': 'behind/after', 'pos': 'prep', 'frequency': 85},
    {'khmer': 'លើ', 'english': 'on/above', 'pos': 'prep', 'frequency': 85},
    {'khmer': 'ក្រោម', 'english': 'under/below', 'pos': 'prep', 'frequency': 80},
    {'khmer': 'ក្នុង', 'english': 'in/inside', 'pos': 'prep', 'frequency': 90},
    {'khmer': 'ក្រៅ', 'english': 'outside', 'pos': 'prep', 'frequency': 80},
    
    # Food & Drink
    {'khmer': 'បាយ', 'english': 'rice (cooked)', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'ទឹក', 'english': 'water', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'សាច់', 'english': 'meat', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ត្រី', 'english': 'fish', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'បន្លែ', 'english': 'vegetables', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ផ្លែឈើ', 'english': 'fruit', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'កាហ្វេ', 'english': 'coffee', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'តែ', 'english': 'tea', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ស្រា', 'english': 'alcohol/wine', 'pos': 'noun', 'frequency': 70},
    
    # People & Family
    {'khmer': 'មនុស្ស', 'english': 'person/people', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'ម៉ែ', 'english': 'mother', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'ប៉ា', 'english': 'father', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'បង', 'english': 'older sibling', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'អូន', 'english': 'younger sibling', 'pos': 'noun', 'frequency': 95},
    {'khmer': 'កូន', 'english': 'child', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'ប្រពន្ធ', 'english': 'wife', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ប្តី', 'english': 'husband', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'មិត្ត', 'english': 'friend', 'pos': 'noun', 'frequency': 85},
    
    # Adjectives
    {'khmer': 'ល្អ', 'english': 'good', 'pos': 'adj', 'frequency': 95},
    {'khmer': 'អាក្រក់', 'english': 'bad', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ធំ', 'english': 'big', 'pos': 'adj', 'frequency': 90},
    {'khmer': 'តូច', 'english': 'small', 'pos': 'adj', 'frequency': 90},
    {'khmer': 'ច្រើន', 'english': 'many/much', 'pos': 'adj', 'frequency': 90},
    {'khmer': 'តិច', 'english': 'few/little', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ថ្មី', 'english': 'new', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ចាស់', 'english': 'old', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ក្តៅ', 'english': 'hot', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ត្រជាក់', 'english': 'cold', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ឆ្ងាញ់', 'english': 'delicious', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ស្អាត', 'english': 'beautiful/clean', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'លឿន', 'english': 'fast', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'យឺត', 'english': 'slow', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'ងាយ', 'english': 'easy', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ពិបាក', 'english': 'difficult', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ថ្លៃ', 'english': 'expensive', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ថោក', 'english': 'cheap', 'pos': 'adj', 'frequency': 80},
    
    # Question words
    {'khmer': 'ហេតុអ្វី', 'english': 'why', 'pos': 'adv', 'frequency': 85},
    {'khmer': 'យ៉ាងម៉េច', 'english': 'how', 'pos': 'adv', 'frequency': 85},
    {'khmer': 'ប៉ុន្មាន', 'english': 'how many/much', 'pos': 'adv', 'frequency': 90},
    {'khmer': 'ពេលណា', 'english': 'when', 'pos': 'adv', 'frequency': 85},
    
    # Common expressions
    {'khmer': 'សុខសប្បាយ', 'english': 'fine/well', 'pos': 'adj', 'frequency': 90},
    {'khmer': 'អត់ទេ', 'english': 'no/nothing', 'pos': 'part', 'frequency': 90},
    {'khmer': 'មែន', 'english': 'right/true', 'pos': 'adj', 'frequency': 90},
    {'khmer': 'បាន', 'english': 'can/got/already', 'pos': 'verb', 'frequency': 95},
    {'khmer': 'កំពុង', 'english': 'currently/-ing', 'pos': 'adv', 'frequency': 85},
    {'khmer': 'រួច', 'english': 'already/finished', 'pos': 'adv', 'frequency': 85},
    {'khmer': 'នៅ', 'english': 'at/still', 'pos': 'prep', 'frequency': 95},
    {'khmer': 'និង', 'english': 'and', 'pos': 'conj', 'frequency': 95},
    {'khmer': 'ឬ', 'english': 'or', 'pos': 'conj', 'frequency': 85},
    {'khmer': 'ប៉ុន្តែ', 'english': 'but', 'pos': 'conj', 'frequency': 85},
    {'khmer': 'ព្រោះ', 'english': 'because', 'pos': 'conj', 'frequency': 80},
    {'khmer': 'ដូច្នេះ', 'english': 'so/therefore', 'pos': 'conj', 'frequency': 75},
]

# Extended vocabulary (Tier 2) - additional common words
EXTENDED_VOCABULARY = [
    # More verbs
    {'khmer': 'ចេះ', 'english': 'know how to', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ឃើញ', 'english': 'see', 'pos': 'verb', 'frequency': 90},
    {'khmer': 'ឮ', 'english': 'hear', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'ចាប់', 'english': 'catch/start', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'បើក', 'english': 'open/drive', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'បិទ', 'english': 'close', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'ជួយ', 'english': 'help', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'រៀន', 'english': 'learn/study', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'បង្រៀន', 'english': 'teach', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'ធ្វើការ', 'english': 'work', 'pos': 'verb', 'frequency': 85},
    {'khmer': 'សម្រាក', 'english': 'rest', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'លេង', 'english': 'play', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'កើត', 'english': 'be born/happen', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'ស្លាប់', 'english': 'die', 'pos': 'verb', 'frequency': 70},
    {'khmer': 'ចូល', 'english': 'enter', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'ចេញ', 'english': 'exit/leave', 'pos': 'verb', 'frequency': 80},
    {'khmer': 'ដឹក', 'english': 'transport/carry', 'pos': 'verb', 'frequency': 70},
    {'khmer': 'កាត់', 'english': 'cut', 'pos': 'verb', 'frequency': 75},
    {'khmer': 'ស្រី', 'english': 'female', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ប្រុស', 'english': 'male', 'pos': 'noun', 'frequency': 85},
    
    # More adjectives
    {'khmer': 'ពេញ', 'english': 'full', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'ទទេ', 'english': 'empty', 'pos': 'adj', 'frequency': 70},
    {'khmer': 'ជ្រៅ', 'english': 'deep', 'pos': 'adj', 'frequency': 65},
    {'khmer': 'រាក់', 'english': 'shallow', 'pos': 'adj', 'frequency': 60},
    {'khmer': 'ខ្ពស់', 'english': 'tall/high', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ទាប', 'english': 'short/low', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'វែង', 'english': 'long', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ខ្លី', 'english': 'short (length)', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'ធាត់', 'english': 'fat', 'pos': 'adj', 'frequency': 65},
    {'khmer': 'ស្គម', 'english': 'thin', 'pos': 'adj', 'frequency': 65},
    {'khmer': 'ក្លាហាន', 'english': 'brave', 'pos': 'adj', 'frequency': 60},
    {'khmer': 'ខ្លាច', 'english': 'afraid', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'រីករាយ', 'english': 'happy', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'ក្រៀមក្រំ', 'english': 'sad', 'pos': 'adj', 'frequency': 70},
    {'khmer': 'ខឹង', 'english': 'angry', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'អស់', 'english': 'finished/out of', 'pos': 'adj', 'frequency': 80},
    {'khmer': 'នៅសល់', 'english': 'remaining', 'pos': 'adj', 'frequency': 65},
    
    # More nouns
    {'khmer': 'ឡាន', 'english': 'car', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ម៉ូតូ', 'english': 'motorcycle', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'កង់', 'english': 'bicycle', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ទូរស័ព្ទ', 'english': 'phone', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'កុំព្យូទ័រ', 'english': 'computer', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'សៀវភៅ', 'english': 'book', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'មេរៀន', 'english': 'lesson', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'បន្ទប់', 'english': 'room', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ទ្វារ', 'english': 'door', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'បង្អួច', 'english': 'window', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ដំបូល', 'english': 'roof', 'pos': 'noun', 'frequency': 60},
    {'khmer': 'ជណ្ដើរ', 'english': 'stairs', 'pos': 'noun', 'frequency': 60},
    {'khmer': 'សម្លៀកបំពាក់', 'english': 'clothes', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ស្បែកជើង', 'english': 'shoes', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ក្រដាស', 'english': 'paper', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ប៊ិច', 'english': 'pen', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'វ៉ែនតា', 'english': 'glasses', 'pos': 'noun', 'frequency': 65},
    
    # Weather & Nature
    {'khmer': 'អាកាសធាតុ', 'english': 'weather', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ព្រះអាទិត្យ', 'english': 'sun', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ព្រះច័ន្ទ', 'english': 'moon', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ផ្កាយ', 'english': 'star', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ភ្លៀង', 'english': 'rain', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ខ្យល់', 'english': 'wind', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ពពក', 'english': 'cloud', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ដី', 'english': 'ground/land', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'មេឃ', 'english': 'sky', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ភ្នំ', 'english': 'mountain', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'សមុទ្រ', 'english': 'sea/ocean', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ទន្លេ', 'english': 'river', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'បឹង', 'english': 'lake', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ព្រៃ', 'english': 'forest', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ដើមឈើ', 'english': 'tree', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ផ្កា', 'english': 'flower', 'pos': 'noun', 'frequency': 70},
    
    # Body parts
    {'khmer': 'ក្បាល', 'english': 'head', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ភ្នែក', 'english': 'eye', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ត្រចៀក', 'english': 'ear', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'ច្រមុះ', 'english': 'nose', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'មាត់', 'english': 'mouth', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ធ្មេញ', 'english': 'tooth', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'អណ្ដាត', 'english': 'tongue', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ដៃ', 'english': 'hand/arm', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ជើង', 'english': 'foot/leg', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ក', 'english': 'neck', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ស្មា', 'english': 'shoulder', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ខ្នង', 'english': 'back', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ពោះ', 'english': 'stomach', 'pos': 'noun', 'frequency': 75},
    {'khmer': 'បេះដូង', 'english': 'heart', 'pos': 'noun', 'frequency': 75},
    
    # More time expressions
    {'khmer': 'សប្ដាហ៍', 'english': 'week', 'pos': 'noun', 'frequency': 80},
    {'khmer': 'ខែ', 'english': 'month', 'pos': 'noun', 'frequency': 85},
    {'khmer': 'ឆ្នាំ', 'english': 'year', 'pos': 'noun', 'frequency': 90},
    {'khmer': 'រដូវ', 'english': 'season', 'pos': 'noun', 'frequency': 65},
    {'khmer': 'ជានិច្ច', 'english': 'always', 'pos': 'adv', 'frequency': 75},
    {'khmer': 'ជារៀងរហូត', 'english': 'forever', 'pos': 'adv', 'frequency': 60},
    {'khmer': 'ពេលខ្លះ', 'english': 'sometimes', 'pos': 'adv', 'frequency': 75},
    {'khmer': 'មិនដែល', 'english': 'never', 'pos': 'adv', 'frequency': 75},
    
    # Common phrases/particles
    {'khmer': 'អី​ៗ', 'english': 'whatever', 'pos': 'pron', 'frequency': 60},
    {'khmer': 'អំពី', 'english': 'about/around', 'pos': 'prep', 'frequency': 75},
    {'khmer': 'តាម', 'english': 'follow/according to', 'pos': 'prep', 'frequency': 80},
    {'khmer': 'រហូត', 'english': 'until', 'pos': 'prep', 'frequency': 70},
    {'khmer': 'ដោយ', 'english': 'by/with', 'pos': 'prep', 'frequency': 80},
    {'khmer': 'សម្រាប់', 'english': 'for', 'pos': 'prep', 'frequency': 85},
    {'khmer': 'ជាមួយ', 'english': 'with/together', 'pos': 'prep', 'frequency': 85},
    {'khmer': 'គ្មាន', 'english': 'without/no', 'pos': 'adj', 'frequency': 85},
    {'khmer': 'ដោយសារ', 'english': 'because of', 'pos': 'conj', 'frequency': 70},
    {'khmer': 'ទោះបី', 'english': 'although', 'pos': 'conj', 'frequency': 65},
    {'khmer': 'បើ', 'english': 'if', 'pos': 'conj', 'frequency': 85},
    {'khmer': 'ដូច', 'english': 'like/as', 'pos': 'conj', 'frequency': 80},
    
    # More colors
    {'khmer': 'ពណ៌', 'english': 'color', 'pos': 'noun', 'frequency': 70},
    {'khmer': 'ក្រហម', 'english': 'red', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'លឿង', 'english': 'yellow', 'pos': 'adj', 'frequency': 70},
    {'khmer': 'បៃតង', 'english': 'green', 'pos': 'adj', 'frequency': 70},
    {'khmer': 'ខៀវ', 'english': 'blue', 'pos': 'adj', 'frequency': 70},
    {'khmer': 'ស', 'english': 'white', 'pos': 'adj', 'frequency': 75},
    {'khmer': 'ខ្មៅ', 'english': 'black', 'pos': 'adj', 'frequency': 75},
]


# ============================================================================
# Output Generation
# ============================================================================

def generate_typescript_core(entries: list[DictionaryEntry], output_path: Path):
    """Generate TypeScript file for core dictionary."""
    
    # Build entry strings
    entry_strings = []
    for e in entries:
        # Escape single quotes in strings
        romanized_escaped = (e.romanized or '').replace("'", "\\'")
        english_escaped = e.english.replace("'", "\\'")
        
        parts = [f"khmer: '{e.khmer}'", f"english: '{english_escaped}'"]
        if e.pos:
            parts.append(f"pos: '{e.pos}'")
        if e.romanized:
            parts.append(f"romanized: '{romanized_escaped}'")
        if e.phonetic:
            parts.append(f"phonetic: '{e.phonetic}'")
        if e.frequency:
            parts.append(f"frequency: {e.frequency}")
        entry_strings.append("  { " + ", ".join(parts) + " },")
    
    content = f'''/**
 * Core Dictionary - Generated by scripts/generate_dictionary.py
 * DO NOT EDIT MANUALLY - Run the script to regenerate
 * 
 * This is Tier 1 dictionary - always loaded (~{len(entries)} words)
 * Tier 2 (extended) is lazy-loaded from JSON
 */

export interface DictionaryEntry {{
  khmer: string;
  english: string;
  pos?: 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'part' | 'num';
  romanized?: string;
  phonetic?: string;
  frequency?: number;
}}

export const coreDictionary: DictionaryEntry[] = [
{chr(10).join(entry_strings)}
];

// Build lookup maps for efficient access
const khmerToEntryMap = new Map<string, DictionaryEntry>();
const phoneticToEntryMap = new Map<string, DictionaryEntry[]>();

for (const entry of coreDictionary) {{
  khmerToEntryMap.set(entry.khmer, entry);
  
  if (entry.phonetic) {{
    const normalized = entry.phonetic.toLowerCase().replace(/-/g, '');
    if (!phoneticToEntryMap.has(normalized)) {{
      phoneticToEntryMap.set(normalized, []);
    }}
    phoneticToEntryMap.get(normalized)!.push(entry);
  }}
}}

/**
 * Look up a Khmer word in the dictionary
 */
export function lookupKhmer(word: string): DictionaryEntry | null {{
  return khmerToEntryMap.get(word) || null;
}}

/**
 * Fuzzy search by phonetic approximation
 */
export function searchByPhonetic(query: string): DictionaryEntry[] {{
  const normalized = query.toLowerCase().replace(/[-\\s]/g, '');
  const results: Array<{{ entry: DictionaryEntry; score: number }}> = [];
  
  for (const entry of coreDictionary) {{
    if (!entry.phonetic) continue;
    
    const entryPhonetic = entry.phonetic.toLowerCase().replace(/-/g, '');
    const score = calculateSimilarity(normalized, entryPhonetic);
    
    if (score > 0.4) {{
      results.push({{ entry, score }});
    }}
  }}
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.entry);
}}

/**
 * Search by English meaning
 */
export function searchByEnglish(query: string): DictionaryEntry[] {{
  const normalized = query.toLowerCase();
  const results: Array<{{ entry: DictionaryEntry; score: number }}> = [];
  
  for (const entry of coreDictionary) {{
    const english = entry.english.toLowerCase();
    
    if (english === normalized) {{
      results.push({{ entry, score: 1 }});
      continue;
    }}
    
    if (english.includes(normalized) || normalized.includes(english)) {{
      const score = Math.min(normalized.length, english.length) / Math.max(normalized.length, english.length);
      results.push({{ entry, score: score * 0.8 }});
    }}
  }}
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.entry);
}}

function calculateSimilarity(a: string, b: string): number {{
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  
  const bigrams = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {{
    bigrams.add(a.slice(i, i + 2));
  }}
  
  let matches = 0;
  for (let i = 0; i < b.length - 1; i++) {{
    if (bigrams.has(b.slice(i, i + 2))) {{
      matches++;
    }}
  }}
  
  return (2 * matches) / (a.length + b.length - 2);
}}
'''
    
    output_path.write_text(content, encoding='utf-8')
    print(f"Generated {output_path} with {len(entries)} entries")


def generate_json_extended(entries: list[DictionaryEntry], output_path: Path):
    """Generate JSON file for extended dictionary (lazy loaded)."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    data = [asdict(e) for e in entries]
    # Remove None values
    data = [{k: v for k, v in entry.items() if v is not None} for entry in data]
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {output_path} with {len(entries)} entries")


# ============================================================================
# Main
# ============================================================================

def main():
    project_root = Path(__file__).parent.parent
    
    print("Processing core vocabulary...")
    core_entries = []
    for raw in CORE_VOCABULARY:
        entry = process_entry(raw)
        core_entries.append(entry)
        print(f"  {entry.khmer} -> {entry.romanized} / {entry.phonetic}")
    
    print(f"\nProcessing extended vocabulary...")
    extended_entries = []
    for raw in EXTENDED_VOCABULARY:
        try:
            entry = process_entry(raw)
            extended_entries.append(entry)
        except Exception as e:
            print(f"  Warning: Failed to process {raw.get('khmer', '?')}: {e}")
    
    # Generate outputs
    print("\nGenerating output files...")
    generate_typescript_core(
        core_entries,
        project_root / "src" / "utils" / "dictionaryCore.ts"
    )
    
    generate_json_extended(
        extended_entries,
        project_root / "public" / "data" / "dictionaryExtended.json"
    )
    
    print(f"\nDone! Generated:")
    print(f"  - {len(core_entries)} core entries (Tier 1)")
    print(f"  - {len(extended_entries)} extended entries (Tier 2)")


if __name__ == '__main__':
    main()

