#!/usr/bin/env python3
"""
Khmer Dictionary Merger
=======================
Merges existing dictionary (with English translations) with seanghay/khmer-dictionary-44k.

Strategy:
- Existing entries: Keep ALL fields (English, romanized, phonetic, etc.)
- New entries from seanghay: Add with pronunciation, POS, but no English
- Tier 1: High frequency words (freq >= 70) - always loaded
- Tier 2: Extended words - lazy loaded JSON

Usage:
    cd /path/to/cambo
    source .venv/bin/activate
    python scripts/merge_dictionaries.py

Output:
    - src/utils/dictionaryCore.ts (Tier 1)
    - public/data/dictionaryExtended.json (Tier 2)
"""

import json
import re
import os
import sys
from pathlib import Path
from dataclasses import dataclass, asdict, field
from typing import Optional, List, Dict
from collections import OrderedDict

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent

# ============================================================================
# Data Structures
# ============================================================================

@dataclass
class DictionaryEntry:
    khmer: str
    english: Optional[str] = None
    pos: Optional[str] = None
    romanized: Optional[str] = None
    phonetic: Optional[str] = None
    frequency: Optional[int] = None
    definition_km: Optional[str] = None  # Khmer definition (for future use)
    
    def to_dict(self) -> dict:
        """Convert to dict, excluding None values"""
        return {k: v for k, v in asdict(self).items() if v is not None}


# ============================================================================
# POS Tag Normalization
# ============================================================================

POS_MAP = {
    # From seanghay (Khmer abbreviations)
    'ន.': 'noun',
    'កិ.': 'verb', 
    'គុ.': 'adj',
    'គុ.កិ.': 'adj',
    'គុ., គុ.កិ.': 'adj',
    'កិ., គុ.កិ.': 'verb',
    'គុ., ន.': 'noun',
    'ឧ.': 'noun',  # exclamation -> noun
    'ប.': 'adv',   # particle/adverb
    'ឈ.': 'conj',  # conjunction
    'និ.': 'prep', # preposition
    'កិ.វិ.': 'adv',
    'សព្ទ.': 'noun',
    
    # Existing mappings
    'noun': 'noun',
    'verb': 'verb', 
    'adj': 'adj',
    'adv': 'adv',
    'pron': 'pron',
    'prep': 'prep',
    'conj': 'conj',
    'part': 'part',
    'num': 'num',
    
    # From khopilot
    'NOUN': 'noun',
    'VERB': 'verb',
    'ADJ': 'adj',
    'ADV': 'adv',
    'PRON': 'pron',
    'CLAS': 'noun',  # classifier -> noun
    'PART': 'part',
    'NUM': 'num',
    'CONJ': 'conj',
    'DET': 'adj',  # determiner -> adj
}

def normalize_pos(pos) -> Optional[str]:
    """Normalize POS tag to our standard set"""
    if pos is None:
        return None
    # Handle NaN/float values from pandas
    if isinstance(pos, float):
        import math
        if math.isnan(pos):
            return None
        return None
    pos = str(pos).strip()
    if not pos:
        return None
    return POS_MAP.get(pos, None)


# ============================================================================
# Load Existing Dictionary
# ============================================================================

def load_existing_dictionary() -> Dict[str, DictionaryEntry]:
    """Load existing dictionary entries from TypeScript and JSON files"""
    entries = {}
    
    # Parse existing dictionaryCore.ts using a more robust approach
    core_path = PROJECT_ROOT / "src" / "utils" / "dictionaryCore.ts"
    if core_path.exists():
        content = core_path.read_text(encoding='utf-8')
        
        # Find the array content between coreDictionary = [ and ];
        array_start = content.find('const coreDictionary: DictionaryEntry[] = [')
        if array_start == -1:
            array_start = content.find('coreDictionary: DictionaryEntry[] = [')
        if array_start == -1:
            array_start = content.find('coreDictionary = [')
        
        if array_start != -1:
            # Find "= [" to get the actual array start, not the [] in DictionaryEntry[]
            eq_bracket = content.find('= [', array_start)
            if eq_bracket != -1:
                array_start = eq_bracket + 2  # Position of [
            else:
                array_start = content.find('[', array_start)
            # Find matching closing bracket
            bracket_count = 0
            array_end = array_start
            for i, char in enumerate(content[array_start:], array_start):
                if char == '[':
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        array_end = i
                        break
            
            array_content = content[array_start:array_end+1]
            
            # Parse each entry using a more careful regex
            # Match full object { ... }
            entry_pattern = r"\{\s*khmer:\s*'([^']+)'"
            for match in re.finditer(entry_pattern, array_content):
                khmer = match.group(1)
                
                # Find the end of this entry
                entry_start = match.start()
                brace_count = 0
                entry_end = entry_start
                for i, char in enumerate(array_content[entry_start:], entry_start):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            entry_end = i + 1
                            break
                
                entry_text = array_content[entry_start:entry_end]
                
                entry = DictionaryEntry(khmer=khmer)
                
                # Extract english - handle escaped quotes
                english_match = re.search(r"english:\s*'((?:[^'\\]|\\.)*)'", entry_text)
                if english_match:
                    entry.english = english_match.group(1).replace("\\'", "'")
                
                # Extract POS
                pos_match = re.search(r"pos:\s*'([^']+)'", entry_text)
                if pos_match:
                    entry.pos = pos_match.group(1)
                
                # Extract romanized - handle escaped quotes
                rom_match = re.search(r"romanized:\s*'((?:[^'\\]|\\.)*)'", entry_text)
                if rom_match:
                    entry.romanized = rom_match.group(1).replace("\\'", "'")
                
                # Extract phonetic
                phon_match = re.search(r"phonetic:\s*'([^']*)'", entry_text)
                if phon_match:
                    entry.phonetic = phon_match.group(1)
                
                # Extract frequency
                freq_match = re.search(r"frequency:\s*(\d+)", entry_text)
                if freq_match:
                    entry.frequency = int(freq_match.group(1))
                
                entries[khmer] = entry
        
        print(f"  Loaded {len(entries)} entries from dictionaryCore.ts")
    
    # Load extended dictionary JSON
    extended_path = PROJECT_ROOT / "public" / "data" / "dictionaryExtended.json"
    if extended_path.exists():
        with open(extended_path, 'r', encoding='utf-8') as f:
            extended_data = json.load(f)
        
        count = 0
        for item in extended_data:
            khmer = item.get('khmer')
            if khmer and khmer not in entries:
                entries[khmer] = DictionaryEntry(
                    khmer=khmer,
                    english=item.get('english'),
                    pos=item.get('pos'),
                    romanized=item.get('romanized'),
                    phonetic=item.get('phonetic'),
                    frequency=item.get('frequency')
                )
                count += 1
        
        print(f"  Loaded {count} additional entries from dictionaryExtended.json")
    
    return entries


# ============================================================================
# Load seanghay/khmer-dictionary-44k
# ============================================================================

def load_seanghay_dictionary() -> List[Dict]:
    """Load the seanghay Khmer dictionary from HuggingFace"""
    try:
        from huggingface_hub import hf_hub_download
        import pandas as pd
        
        print("  Downloading seanghay/khmer-dictionary-44k...")
        path = hf_hub_download(
            "seanghay/khmer-dictionary-44k",
            "RAC-Khmer-Dict-2022.csv",
            repo_type="dataset"
        )
        
        df = pd.read_csv(path)
        print(f"  Loaded {len(df)} entries from seanghay dataset")
        
        return df.to_dict('records')
    except Exception as e:
        print(f"  Error loading seanghay: {e}")
        return []


# ============================================================================
# Pronunciation Extraction
# ============================================================================

def extract_pronunciation(pron_str) -> Optional[str]:
    """Extract clean pronunciation from seanghay format like [ក] or [កក-កុញ]"""
    import math
    if pron_str is None:
        return None
    if isinstance(pron_str, float) and math.isnan(pron_str):
        return None
    
    # Remove brackets
    pron = str(pron_str).strip()
    if pron.startswith('[') and pron.endswith(']'):
        pron = pron[1:-1]
    
    return pron if pron else None


def pron_to_phonetic(pron: str) -> str:
    """Convert Khmer pronunciation notation to English-friendly phonetic"""
    if not pron:
        return ""
    
    # This is a simplified conversion - the actual romanization logic 
    # in alaLcRomanization.ts handles the full conversion
    return pron.upper().replace('-', '-')


# ============================================================================
# Merge Logic
# ============================================================================

def merge_dictionaries(existing: Dict[str, DictionaryEntry], seanghay: List[Dict]) -> Dict[str, DictionaryEntry]:
    """Merge existing dictionary with seanghay, preserving existing English translations"""
    import math
    
    def is_nan(val):
        return isinstance(val, float) and math.isnan(val)
    
    merged = existing.copy()
    new_count = 0
    updated_count = 0
    
    for row in seanghay:
        # Get the word (could be in t_main or t_subword)
        khmer = row.get('t_main') or row.get('t_subword')
        if not khmer or is_nan(khmer):
            continue
        
        khmer = str(khmer).strip()
        if not khmer:
            continue
        
        # Get pronunciation
        pron = extract_pronunciation(row.get('t_pron'))
        
        # Get POS
        pos = normalize_pos(row.get('t_pos'))
        
        # Get Khmer definition
        definition_km = row.get('t_exp')
        if is_nan(definition_km):
            definition_km = None
        
        if khmer in merged:
            # Existing entry - update missing fields only
            entry = merged[khmer]
            
            # Add pronunciation if missing
            if not entry.romanized and pron:
                entry.romanized = pron
                updated_count += 1
            
            # Add POS if missing
            if not entry.pos and pos:
                entry.pos = pos
            
            # Store Khmer definition for future use
            if definition_km:
                entry.definition_km = str(definition_km)[:500]  # Limit length
        else:
            # New entry - add without English
            merged[khmer] = DictionaryEntry(
                khmer=khmer,
                english=None,  # No English translation
                pos=pos,
                romanized=pron,
                phonetic=pron_to_phonetic(pron) if pron else None,
                frequency=50,  # Default frequency for new words
                definition_km=str(definition_km)[:500] if definition_km else None
            )
            new_count += 1
    
    print(f"  Added {new_count} new entries")
    print(f"  Updated {updated_count} existing entries with pronunciation")
    
    return merged


# ============================================================================
# Tier Splitting
# ============================================================================

def split_into_tiers(entries: Dict[str, DictionaryEntry]) -> tuple:
    """Split dictionary into Tier 1 (high freq) and Tier 2 (extended)"""
    
    tier1 = []
    tier2 = []
    
    for khmer, entry in entries.items():
        freq = entry.frequency or 50
        has_english = bool(entry.english)
        
        # Tier 1 criteria:
        # - Has English translation AND frequency >= 70
        # - OR frequency >= 90 (very common words)
        if (has_english and freq >= 70) or freq >= 90:
            tier1.append(entry)
        else:
            tier2.append(entry)
    
    # Sort by frequency (descending)
    tier1.sort(key=lambda e: e.frequency or 0, reverse=True)
    tier2.sort(key=lambda e: e.frequency or 0, reverse=True)
    
    print(f"  Tier 1 (always loaded): {len(tier1)} entries")
    print(f"  Tier 2 (lazy loaded): {len(tier2)} entries")
    
    return tier1, tier2


# ============================================================================
# Output Generation
# ============================================================================

def escape_ts_string(s: str) -> str:
    """Escape a string for TypeScript single-quoted string literal"""
    if not s:
        return ''
    return s.replace("\\", "\\\\").replace("'", "\\'")

def generate_typescript(entries: List[DictionaryEntry], output_path: Path):
    """Generate TypeScript file for Tier 1 dictionary"""
    
    lines = []
    for entry in entries:
        parts = [f"khmer: '{escape_ts_string(entry.khmer)}'"]
        
        if entry.english:
            parts.append(f"english: '{escape_ts_string(entry.english)}'")
        else:
            parts.append("english: ''")
        
        if entry.pos:
            parts.append(f"pos: '{entry.pos}'")
        
        if entry.romanized:
            parts.append(f"romanized: '{escape_ts_string(entry.romanized)}'")
        
        if entry.phonetic:
            parts.append(f"phonetic: '{escape_ts_string(entry.phonetic)}'")
        
        if entry.frequency:
            parts.append(f"frequency: {entry.frequency}")
        
        lines.append("  { " + ", ".join(parts) + " },")
    
    content = f'''/**
 * Core Dictionary - Generated by scripts/merge_dictionaries.py
 * DO NOT EDIT MANUALLY - Run the script to regenerate
 * 
 * Tier 1: {len(entries)} high-frequency words (always loaded)
 * Tier 2: Extended vocabulary (lazy-loaded from JSON)
 * 
 * Source: Existing translations + seanghay/khmer-dictionary-44k
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
{chr(10).join(lines)}
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
    if (!entry.english) continue;
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
    print(f"  Generated {output_path}")


def generate_json(entries: List[DictionaryEntry], output_path: Path):
    """Generate JSON file for Tier 2 dictionary"""
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert to list of dicts, excluding definition_km to save space
    data = []
    for entry in entries:
        d = entry.to_dict()
        d.pop('definition_km', None)  # Don't include in JSON output
        data.append(d)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    
    # Get file size
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"  Generated {output_path} ({size_mb:.2f} MB)")


# ============================================================================
# Word List for Segmentation
# ============================================================================

def generate_word_list(entries: Dict[str, DictionaryEntry], output_path: Path):
    """Generate a simple word list for fast segmentation lookup"""
    
    # Sort by length (longest first) for maximum matching
    words = sorted(entries.keys(), key=len, reverse=True)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False)
    
    size_kb = output_path.stat().st_size / 1024
    print(f"  Generated {output_path} ({size_kb:.1f} KB) - {len(words)} words")


# ============================================================================
# Main
# ============================================================================

def main():
    # Need pandas for seanghay data
    global pd
    try:
        import pandas as pd
    except ImportError:
        print("Error: pandas required. Run: pip install pandas")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("KHMER DICTIONARY MERGER")
    print("=" * 60)
    
    print("\n[1/5] Loading existing dictionary...")
    existing = load_existing_dictionary()
    print(f"  Total existing: {len(existing)} entries with English translations")
    
    print("\n[2/5] Loading seanghay/khmer-dictionary-44k...")
    seanghay = load_seanghay_dictionary()
    
    print("\n[3/5] Merging dictionaries...")
    merged = merge_dictionaries(existing, seanghay)
    print(f"  Total merged: {len(merged)} entries")
    
    # Count entries with English
    with_english = sum(1 for e in merged.values() if e.english)
    print(f"  Entries with English: {with_english}")
    print(f"  Entries without English: {len(merged) - with_english}")
    
    print("\n[4/5] Splitting into tiers...")
    tier1, tier2 = split_into_tiers(merged)
    
    print("\n[5/5] Generating output files...")
    generate_typescript(tier1, PROJECT_ROOT / "src" / "utils" / "dictionaryCore.ts")
    generate_json(tier2, PROJECT_ROOT / "public" / "data" / "dictionaryExtended.json")
    generate_word_list(merged, PROJECT_ROOT / "public" / "data" / "wordList.json")
    
    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print(f"\nSummary:")
    print(f"  • Tier 1 (core): {len(tier1)} words")
    print(f"  • Tier 2 (extended): {len(tier2)} words")
    print(f"  • Total vocabulary: {len(merged)} words")
    print(f"  • Words with English: {with_english}")


if __name__ == '__main__':
    main()

