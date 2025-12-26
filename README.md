# Cambo — Khmer Language Analysis Platform

A comprehensive web application for analyzing, romanizing, and understanding Khmer (Cambodian) text. Built with precision for linguistic accuracy and user experience.

**Copyright 2025 andy phu**

---

## Table of Contents

- [Motivation & Intuition](#motivation--intuition)
- [Architecture](#architecture)
- [Methodology](#methodology)
  - [Text Parsing](#text-parsing)
  - [Romanization](#romanization)
  - [Word Segmentation](#word-segmentation)
- [Data Sourcing](#data-sourcing)
- [Technical Implementation](#technical-implementation)
- [User Interface Design](#user-interface-design)

---

## Motivation & Intuition

### The Challenge

Khmer script presents unique challenges for computational analysis:

1. **Complex Orthography**: Khmer uses a complex abugida system where consonants carry inherent vowels, and diacritics (srak) modify pronunciation. Unlike space-separated languages, Khmer text traditionally has no word boundaries.

2. **Linguistic Preservation**: As digital tools become more prevalent, there's a need for accurate, standards-based tools that respect Khmer linguistic structure rather than forcing Western paradigms.

3. **Accessibility**: Many Khmer speakers learning English (and vice versa) need reliable romanization and segmentation tools that follow established standards like ALA-LC.

### Design Philosophy

**Respect the Language**: The system treats Khmer orthographic clusters (syllables) as atomic units. Vowels and diacritics are never separated from their consonants—this is fundamental to Khmer script structure.

**Standards-Based**: Uses the official ALA-LC (American Library Association - Library of Congress) romanization standard, ensuring consistency with academic and library resources.

**User-Centric**: Provides both algorithmic accuracy and user customization, allowing learners and researchers to build their own vocabulary while benefiting from a comprehensive base dictionary.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ├── AnalyzePage (Main analysis interface)                  │
│  ├── DictionaryPage (Dictionary management)                  │
│  └── LookupPage (Word lookup)                               │
├─────────────────────────────────────────────────────────────┤
│  Core Utilities                                              │
│  ├── khmerParser.ts      (Text → Clusters)                  │
│  ├── alaLcRomanization.ts (Clusters → ALA-LC)               │
│  ├── wordSegmentation.ts  (Clusters → Words)                 │
│  └── dictionaryCore.ts    (Dictionary interface)            │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── dictionaryCore.ts         (Tier 1: Always loaded)      │
│  ├── dictionaryLoader.ts       (Tier 2: Lazy loading)       │
│  └── userDictionary.ts         (User customizations)        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Generation (Python Scripts)               │
├─────────────────────────────────────────────────────────────┤
│  merge_dictionaries.py  (Merges & processes datasets)       │
│  generate_dictionary.py (Legacy generation script)           │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Navbar (Navigation)
├── SubNav (Settings)
├── Routes
│   ├── AnalyzePage (Main analysis)
│   │   ├── CollapsiblePanel (Khmer Text)
│   │   ├── CollapsiblePanel (Word Boundaries)
│   │   ├── CollapsiblePanel (Romanization)
│   │   ├── CollapsiblePanel (Character Analysis)
│   │   └── CollapsiblePanel (Dictionary Matches)
│   ├── DictionaryPage (Dictionary management)
│   └── LookupPage (Word lookup)
└── Footer
```

### Data Flow

1. **Input**: User enters Khmer text
2. **Parsing**: `parseKhmerText()` → Orthographic clusters
3. **Segmentation**: `segmentText()` → Words (using dictionary)
4. **Romanization**: `romanizeCluster()` → ALA-LC romanization
5. **Display**: Multiple synchronized views with interactive highlighting

---

## Methodology

### Text Parsing

#### Orthographic Clusters

Khmer text is parsed into **orthographic clusters** (syllables), which are the fundamental units of Khmer script. A cluster typically follows this structure:

```
[Consonant | Independent Vowel] + [Coeng + Consonant]* + [Vowel]* + [Signs]*
```

**Key Principle**: Clusters are **indivisible**. This ensures that:
- Dependent vowels (srak) are never broken from their consonants
- Subscript consonants stay with their base consonant
- Signs remain attached to their syllables

#### Implementation

The `parseKhmerText()` function in `khmerParser.ts`:

1. **Character Classification**: Each character is classified using Unicode ranges:
   - Consonants: U+1780 - U+17A2
   - Independent vowels: U+17A3 - U+17B3
   - Dependent vowels: U+17B6 - U+17C5
   - Signs: U+17C6 - U+17D3
   - Numerals: U+17E0 - U+17E9

2. **Cluster Building**: 
   - Starts with a base consonant or independent vowel
   - Collects coeng + subscript consonants (can be multiple)
   - Collects dependent vowels (can be multiple)
   - Collects signs (can be multiple)
   - Groups consecutive numerals/punctuation

3. **Special Handling**:
   - Multi-digit numbers (e.g., `៩០០` = 900) are grouped
   - Consecutive punctuation marks are grouped
   - Spaces are preserved as separate clusters

#### Example

```
Input: "សួស្តី"
Parsed clusters:
  - "សួ" (consonant + vowel)
  - "ស្តី" (consonant + coeng + consonant + vowel)
```

### Romanization

#### ALA-LC Standard

The system implements the **ALA-LC Romanization Tables for Khmer**, the official standard used by libraries and academic institutions worldwide. This ensures consistency with published materials and scholarly works.

#### Algorithm

The `romanizeCluster()` function processes clusters through multiple stages:

1. **Series Detection**: 
   - Khmer consonants belong to one of two "series" (register classes)
   - Series 1: "a" series (e.g., ក = ka)
   - Series 2: "o" series (e.g., គ = ko)
   - Series determines vowel pronunciation

2. **Register Shift Detection**:
   - Signs like `៉` (Muusikatoan) shift Series 2 → Series 1
   - Signs like `៊` (Triisap) shift Series 1 → Series 2
   - These override the consonant's inherent series

3. **Vowel Mapping**:
   - Each dependent vowel has different romanization for Series 1 vs Series 2
   - Example: `ិ` = `ĕ` (Series 1) or `ĭ` (Series 2)

4. **Sign Effects**:
   - `ំ` (Nikahit): Adds nasal "m" final
   - `ះ` (Reahmuk): Adds aspirated "h" final
   - `់` (Bantoc): Shortens the vowel
   - Other signs modify pronunciation or register

5. **Confidence Assessment**:
   - **High**: Standard patterns, dictionary match
   - **Medium**: Uncommon patterns, algorithmic only
   - **Low**: Ambiguous or incomplete clusters

#### Output Formats

- **Romanized**: ALA-LC standard (e.g., `suă-stei`)
- **Phonetic**: Simplified English-friendly pronunciation (e.g., `SUA-STAY`)

### Word Segmentation

#### Bidirectional Maximum Matching

The system uses **bidirectional maximum matching** on orthographic clusters:

1. **Forward Matching**: Segments left-to-right, choosing longest matches
2. **Backward Matching**: Segments right-to-left, choosing longest matches
3. **Selection**: Chooses the result with fewer segments (more cohesive words)

#### Cluster-Based Segmentation

**Critical Design Decision**: Segmentation operates on **clusters**, not characters.

- Prevents breaking srak (vowels) from consonants
- Respects Khmer orthographic structure
- Ensures linguistic correctness

#### Dictionary Hierarchy

1. **User Dictionary** (highest priority)
   - Stored in `localStorage`
   - User-defined words override all other sources
   - Includes custom English translations and pronunciations

2. **Core Dictionary** (Tier 1)
   - ~230 high-frequency words
   - Always loaded in memory
   - Includes English translations
   - Defined in `dictionaryCore.ts`

3. **Extended Dictionary** (Tier 2)
   - Larger vocabulary (~44K words)
   - Lazy-loaded on demand
   - May lack English translations
   - Stored in `dictionaryExtended.json`

4. **Word List** (fast lookup)
   - Lightweight JSON with just Khmer words
   - Used for segmentation speed
   - Stored in `wordList.json`

#### Segmentation Confidence

- **High**: Dictionary match found
- **Medium**: Partial matches or common patterns
- **Low**: Single-cluster words, unknown patterns

---

## Data Sourcing

### Primary Sources

#### 1. Core Dictionary (Tier 1)

**Source**: Curated high-frequency vocabulary
- ~230 words with English translations
- Includes common greetings, pronouns, verbs, nouns
- Manually verified for accuracy
- Always loaded for instant access

**Format**: TypeScript array in `dictionaryCore.ts`

#### 2. Extended Dictionary (Tier 2)

**Source**: `seanghay/khmer-dictionary-44k` (HuggingFace)

- **Dataset**: RAC-Khmer-Dict-2022.csv
- **Size**: ~44,000 entries
- **Fields**: Khmer word, pronunciation, POS tags, Khmer definitions
- **Limitation**: No English translations (by design)

**Processing**:
- Merged with existing dictionary entries
- Existing English translations preserved
- New entries added with pronunciation and POS tags
- Split into Tier 1 (high frequency) and Tier 2 (extended)

#### 3. User Dictionary

**Source**: User input via UI
- Stored in browser `localStorage`
- User can add custom words with:
  - English translation
  - Pronunciation (phonetic)
  - Romanization (ALA-LC)
  - Part of speech
- Auto-generates romanization if not provided
- Exportable as JSON or CSV
- Importable from JSON

### Data Processing Pipeline

```
┌─────────────────────────────────────────┐
│  Existing Dictionary (TypeScript)       │
│  + seanghay/khmer-dictionary-44k       │
└──────────────┬─────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  merge_dictionaries.py                  │
│  ├── Load existing entries              │
│  ├── Fetch HuggingFace dataset          │
│  ├── Merge (preserve English)           │
│  └── Normalize POS tags                 │
└──────────────┬─────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Split by Frequency                     │
│  ├── Tier 1: freq >= 70 (core)        │
│  └── Tier 2: freq < 70 (extended)      │
└──────────────┬─────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Generate Output Files                  │
│  ├── dictionaryCore.ts (Tier 1)         │
│  ├── dictionaryExtended.json (Tier 2)   │
│  └── wordList.json (fast lookup)        │
└─────────────────────────────────────────┘
```

### Data Quality

- **English Translations**: Prioritized from existing dictionary
- **Pronunciation**: Extracted from seanghay dataset when available
- **POS Tags**: Normalized to standard set (noun, verb, adj, etc.)
- **Frequency**: Used for tier splitting (high frequency → Tier 1)

---

## Technical Implementation

### Frontend Stack

- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 5.4
- **Routing**: React Router 7.11
- **Icons**: react-icons 5.5

### Key Algorithms

#### 1. Cluster Parsing (`khmerParser.ts`)

```typescript
function parseKhmerText(text: string): KhmerCluster[] {
  // 1. Classify each character
  // 2. Build clusters following Khmer orthographic rules
  // 3. Handle special cases (numerals, punctuation)
  // 4. Return array of clusters
}
```

**Time Complexity**: O(n) where n = text length
**Space Complexity**: O(n)

#### 2. Romanization (`alaLcRomanization.ts`)

```typescript
function romanizeCluster(components: KhmerComponent[]): RomanizationResult {
  // 1. Detect consonant series
  // 2. Check for register shifts
  // 3. Map vowels based on series
  // 4. Apply sign effects
  // 5. Build romanized and phonetic strings
}
```

**Time Complexity**: O(m) where m = components per cluster (typically < 10)
**Space Complexity**: O(1)

#### 3. Word Segmentation (`wordSegmentation.ts`)

```typescript
function segmentText(text: string): SegmentationResult {
  // 1. Parse into clusters
  // 2. Forward maximum matching
  // 3. Backward maximum matching
  // 4. Choose better result
}
```

**Time Complexity**: O(n × k) where n = clusters, k = max word length
**Space Complexity**: O(n)

### Performance Optimizations

1. **Lazy Loading**: Extended dictionary loaded on demand
2. **Memoization**: React `useMemo` for expensive computations
3. **Fast Lookups**: `Set` and `Map` data structures for O(1) dictionary access
4. **Word List**: Separate lightweight file for segmentation speed
5. **Portal Rendering**: Tooltips rendered outside DOM hierarchy to prevent clipping

### State Management

- **React Context**: Settings (font, pronunciation mode, tooltips)
- **localStorage**: User dictionary, panel states, input text persistence
- **Component State**: UI interactions, selections, edit modes

---

## User Interface Design

### Design Principles

1. **Consistency**: All panels use `CollapsiblePanel` component for uniform appearance
2. **Accessibility**: Keyboard navigation, ARIA labels, focus management
3. **Responsiveness**: Two-column layout on desktop, stacks on mobile
4. **Visual Feedback**: Color-coded syllables, hover states, selection modes

### Panel System

All content panels are collapsible with:
- **Header**: Title, badge (optional), action buttons
- **Body**: Scrollable content (max-height: 35vh)
- **Scrollbar**: Positioned at right edge
- **State**: Persisted in localStorage

### Color System

**Syllable Coloring**:
- Each syllable gets a unique color family (blue, green, purple, orange, pink, etc.)
- Within syllables, components have varying shades:
  - **Dark**: Consonants & independent vowels
  - **Medium**: Subscripts & coeng
  - **Light**: Vowels, signs & numerals

**Rationale**: Visual distinction helps users understand syllable boundaries and component relationships.

### Interaction Modes

1. **Normal Mode**: Hover for tooltips, click to lock highlight
2. **Selection Mode**: Click syllables to select, use panel to copy/add to dictionary
3. **Edit Mode**: Direct text editing with auto-segmentation on confirm

### Display Modes

1. **Sparse Mode** (default): Adds spacing for readability
2. **Condensed Mode**: No extra spacing, matches textarea exactly

---

## File Structure

```
cambo/
├── src/
│   ├── components/
│   │   ├── analyzer/          # Analysis-specific components
│   │   ├── layout/            # Navigation, settings
│   │   └── ui/                # Reusable UI components
│   ├── context/               # React context providers
│   ├── pages/                 # Main page components
│   └── utils/                 # Core utilities
│       ├── khmerParser.ts     # Text parsing
│       ├── alaLcRomanization.ts # ALA-LC romanization
│       ├── wordSegmentation.ts # Word segmentation
│       ├── dictionaryCore.ts   # Tier 1 dictionary
│       ├── dictionaryLoader.ts # Lazy loading
│       └── userDictionary.ts  # User dictionary management
├── scripts/
│   ├── merge_dictionaries.py  # Data processing
│   └── generate_dictionary.py # Legacy generator
├── public/
│   └── data/                  # Generated data files
│       ├── dictionaryExtended.json
│       └── wordList.json
└── README.md
```

---

## Development

### Prerequisites

- Node.js 18+
- Python 3.8+ (for data generation scripts)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Data Generation

```bash
# Activate virtual environment (if using)
source .venv/bin/activate

# Install Python dependencies
pip install pandas huggingface_hub

# Run merge script
python scripts/merge_dictionaries.py
```

---

## Future Enhancements

### Planned Features

1. **LLM Integration**: Use language models for improved segmentation accuracy
2. **Translation API**: On-demand English translations via Google Translate API
3. **Audio Pronunciation**: Text-to-speech for Khmer words
4. **Export Formats**: PDF, DOCX export with formatting
5. **Collaborative Dictionary**: Share user dictionaries across devices

### Technical Debt

- Migrate remaining hardcoded data to external sources
- Optimize large dictionary loading
- Add unit tests for core algorithms
- Improve error handling and edge cases

---

## License

Copyright 2025 andy phu

---

## Acknowledgments

- **ALA-LC Romanization Tables**: Official standard from Library of Congress
- **seanghay/khmer-dictionary-44k**: HuggingFace dataset for extended vocabulary
- **Unicode Consortium**: Khmer script specification (U+1780 - U+17FF)
