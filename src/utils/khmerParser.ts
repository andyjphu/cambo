// Khmer Unicode ranges and character classifications
// Based on the Unicode Standard for Khmer (U+1780 - U+17FF)

export type KhmerCharType =
    | 'consonant'      // ព្យញ្ជនៈ - Base consonants
    | 'subscript'      // ជើង - Subscript consonants (coeng)
    | 'vowel'          // ស្រៈ - Dependent vowels
    | 'indep_vowel'    // ស្រៈឯករាជ្យ - Independent vowels
    | 'sign'           // សញ្ញា - Various signs
    | 'numeral'        // លេខ - Khmer numerals
    | 'punctuation'    // វណ្ណយុត្តិ - Punctuation
    | 'coeng'          // ្ - The coeng sign itself
    | 'space'          // Space character
    | 'other';         // Non-Khmer characters

export interface KhmerCluster {
    text: string;
    type: KhmerCharType;
    components: KhmerComponent[];
}

export interface KhmerComponent {
    char: string;
    type: KhmerCharType;
    codepoint: number;
}

// Khmer consonants (U+1780 - U+17A2)
const CONSONANTS = new Set([
    'ក', 'ខ', 'គ', 'ឃ', 'ង',
    'ច', 'ឆ', 'ជ', 'ឈ', 'ញ',
    'ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ',
    'ត', 'ថ', 'ទ', 'ធ', 'ន',
    'ប', 'ផ', 'ព', 'ភ', 'ម',
    'យ', 'រ', 'ល', 'វ', 'ស',
    'ហ', 'ឡ', 'អ'
]);

// Independent vowels (U+17A3 - U+17B3)
const INDEP_VOWELS = new Set([
    'ឣ', 'ឤ', 'ឥ', 'ឦ', 'ឧ', 'ឨ', 'ឩ', 'ឪ', 'ឫ', 'ឬ', 'ឭ', 'ឮ', 'ឯ', 'ឰ', 'ឱ', 'ឲ', 'ឳ'
]);

// Dependent vowels / Srak (U+17B6 - U+17C5)
const DEP_VOWELS = new Set([
    'ា', 'ិ', 'ី', 'ឹ', 'ឺ', 'ុ', 'ូ', 'ួ', 'ើ', 'ឿ', 'ៀ', 'េ', 'ែ', 'ៃ', 'ោ', 'ៅ'
]);

// Signs (U+17C6 - U+17D3)
const SIGNS = new Set([
    'ំ',  // Nikahit
    'ះ',  // Reahmuk  
    '៉',  // Muusikatoan
    '៊',  // Triisap
    '់',  // Bantoc
    '៌',  // Robat
    '៍',  // Toandakhiat
    '៎',  // Kakabat
    '៏',  // Ahsda
    '័',  // Samyok Sannya
    '៑',  // Viriam
    '្',  // Coeng
    '៓',  // Bathamasat
]);

// The coeng sign (subscript marker)
const COENG = '្'; // U+17D2

// Khmer numerals (U+17E0 - U+17E9)
const NUMERALS = new Set(['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']);

// Punctuation (U+17D4 - U+17DA)
const PUNCTUATION = new Set(['។', '៕', '៖', '។', '៘', '៙', '៚']);

/**
 * Classify a single Khmer character
 */
export function classifyChar(char: string): KhmerCharType {
    if (char === ' ' || char === '\u200B') return 'space';
    if (CONSONANTS.has(char)) return 'consonant';
    if (INDEP_VOWELS.has(char)) return 'indep_vowel';
    if (DEP_VOWELS.has(char)) return 'vowel';
    if (char === COENG) return 'coeng';
    if (SIGNS.has(char)) return 'sign';
    if (NUMERALS.has(char)) return 'numeral';
    if (PUNCTUATION.has(char)) return 'punctuation';
    return 'other';
}

/**
 * Check if a character is part of Khmer script
 */
export function isKhmer(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0x1780 && code <= 0x17FF;
}

/**
 * Parse Khmer text into orthographic clusters (syllables)
 * A cluster typically consists of: consonant + [coeng + consonant]* + [vowel]* + [signs]*
 */
export function parseKhmerText(text: string): KhmerCluster[] {
    const clusters: KhmerCluster[] = [];
    let i = 0;

    while (i < text.length) {
        const char = text[i];
        const type = classifyChar(char);

        // Handle spaces
        if (type === 'space') {
            clusters.push({
                text: char,
                type: 'space',
                components: [{ char, type: 'space', codepoint: char.charCodeAt(0) }]
            });
            i++;
            continue;
        }

        // Handle non-Khmer characters
        if (type === 'other') {
            let otherText = '';
            while (i < text.length && classifyChar(text[i]) === 'other') {
                otherText += text[i];
                i++;
            }
            clusters.push({
                text: otherText,
                type: 'other',
                components: otherText.split('').map(c => ({
                    char: c,
                    type: 'other' as KhmerCharType,
                    codepoint: c.charCodeAt(0)
                }))
            });
            continue;
        }

        // Handle consecutive numerals as a single cluster (e.g., ១២៣ = 123)
        if (type === 'numeral') {
            let numeralText = '';
            const numeralComponents: KhmerComponent[] = [];
            while (i < text.length && classifyChar(text[i]) === 'numeral') {
                numeralComponents.push({
                    char: text[i],
                    type: 'numeral',
                    codepoint: text[i].charCodeAt(0)
                });
                numeralText += text[i];
                i++;
            }
            clusters.push({
                text: numeralText,
                type: 'numeral',
                components: numeralComponents
            });
            continue;
        }

        // Handle consecutive punctuation as a single cluster
        if (type === 'punctuation') {
            let punctText = '';
            const punctComponents: KhmerComponent[] = [];
            while (i < text.length && classifyChar(text[i]) === 'punctuation') {
                punctComponents.push({
                    char: text[i],
                    type: 'punctuation',
                    codepoint: text[i].charCodeAt(0)
                });
                punctText += text[i];
                i++;
            }
            clusters.push({
                text: punctText,
                type: 'punctuation',
                components: punctComponents
            });
            continue;
        }

        // Start building a cluster
        const components: KhmerComponent[] = [];
        let clusterText = '';

        // Base consonant or independent vowel
        if (type === 'consonant' || type === 'indep_vowel') {
            components.push({
                char,
                type,
                codepoint: char.charCodeAt(0)
            });
            clusterText += char;
            i++;

            // Look for coeng + subscript consonants
            while (i < text.length && text[i] === COENG && i + 1 < text.length) {
                const nextChar = text[i + 1];
                if (CONSONANTS.has(nextChar)) {
                    // Add coeng
                    components.push({
                        char: COENG,
                        type: 'coeng',
                        codepoint: COENG.charCodeAt(0)
                    });
                    clusterText += COENG;
                    i++;

                    // Add subscript consonant
                    components.push({
                        char: nextChar,
                        type: 'subscript',
                        codepoint: nextChar.charCodeAt(0)
                    });
                    clusterText += nextChar;
                    i++;
                } else {
                    break;
                }
            }

            // Look for vowels
            while (i < text.length && DEP_VOWELS.has(text[i])) {
                components.push({
                    char: text[i],
                    type: 'vowel',
                    codepoint: text[i].charCodeAt(0)
                });
                clusterText += text[i];
                i++;
            }

            // Look for signs
            while (i < text.length && SIGNS.has(text[i]) && text[i] !== COENG) {
                components.push({
                    char: text[i],
                    type: 'sign',
                    codepoint: text[i].charCodeAt(0)
                });
                clusterText += text[i];
                i++;
            }

            clusters.push({
                text: clusterText,
                type: 'consonant',
                components
            });
        } else {
            // Handle standalone vowels, signs, numerals, punctuation
            components.push({
                char,
                type,
                codepoint: char.charCodeAt(0)
            });
            clusters.push({
                text: char,
                type,
                components
            });
            i++;
        }
    }

    return clusters;
}

/**
 * Split text into words (using zero-width space or regular space)
 */
export function splitIntoWords(text: string): string[] {
    // Khmer traditionally doesn't use spaces between words, but modern text often uses
    // zero-width space (U+200B) or regular spaces as word separators
    return text.split(/[\s\u200B]+/).filter(w => w.length > 0);
}

/**
 * Get unique cluster types for color assignment
 */
export function getClusterTypes(): KhmerCharType[] {
    return ['consonant', 'subscript', 'vowel', 'indep_vowel', 'sign', 'numeral', 'punctuation'];
}

