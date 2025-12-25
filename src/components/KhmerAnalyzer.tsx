import { useState, useMemo, useCallback } from 'react';
import { parseKhmerText, type KhmerCluster, type KhmerCharType } from '../utils/khmerParser';
import { lookupWord, approximateClusterIPA, consonantIPA, vowelIPA, signIPA, getSpecialCharInfo } from '../utils/khmerDictionary';
import { charTypeColors, charTypeBgColors, getRainbowColor } from '../utils/colors';
import { khmerFonts, getFontsByStyle, styleLabels, type KhmerFont } from '../utils/fonts';
import './KhmerAnalyzer.css';

interface KhmerAnalyzerProps {
  initialText?: string;
}

const TYPE_LABELS: Record<KhmerCharType, string> = {
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

export function KhmerAnalyzer({ initialText = '' }: KhmerAnalyzerProps) {
  const [inputText, setInputText] = useState(initialText);
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<{ clusterIdx: number; compIdx: number } | null>(null);
  const [selectedFont, setSelectedFont] = useState<KhmerFont>(khmerFonts.find(f => f.name === 'Noto Sans Khmer')!);
  const [showIPA, setShowIPA] = useState(true);
  const [inputHoverIdx, setInputHoverIdx] = useState<number | null>(null);

  const clusters = useMemo(() => {
    return parseKhmerText(inputText);
  }, [inputText]);

  // Build character position map for hover sync
  const charPositionMap = useMemo(() => {
    const map: number[] = [];
    let clusterIdx = 0;
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.text.length; i++) {
        map.push(clusterIdx);
      }
      clusterIdx++;
    }
    return map;
  }, [clusters]);

  // Split into words (by spaces)
  const words = useMemo(() => {
    const result: { word: string; clusters: KhmerCluster[]; startIdx: number }[] = [];
    let currentWord = '';
    let currentClusters: KhmerCluster[] = [];
    let startIdx = 0;
    let clusterIdx = 0;

    for (const cluster of clusters) {
      if (cluster.type === 'space') {
        if (currentWord) {
          result.push({ word: currentWord, clusters: currentClusters, startIdx });
          currentWord = '';
          currentClusters = [];
        }
        startIdx = clusterIdx + 1;
      } else {
        if (!currentWord) {
          startIdx = clusterIdx;
        }
        currentWord += cluster.text;
        currentClusters.push(cluster);
      }
      clusterIdx++;
    }

    if (currentWord) {
      result.push({ word: currentWord, clusters: currentClusters, startIdx });
    }

    return result;
  }, [clusters]);

  const fontsByStyle = useMemo(() => getFontsByStyle(), []);

  const getClusterInfo = (cluster: KhmerCluster) => {
    // Check if the whole word exists in dictionary
    const wordEntry = lookupWord(cluster.text);
    if (wordEntry) {
      return {
        ipa: wordEntry.ipa,
        phonetic: wordEntry.phonetic,
        english: wordEntry.english,
      };
    }

    // Check for special character
    const specialInfo = getSpecialCharInfo(cluster.text);
    if (specialInfo) {
      return {
        ipa: '—',
        phonetic: specialInfo.name,
        english: specialInfo.description,
        special: specialInfo,
      };
    }

    // Generate approximate IPA and phonetic
    const { ipa, phonetic } = approximateClusterIPA(cluster.components);
    return { ipa, phonetic, english: null };
  };

  const getComponentInfo = (char: string, type: KhmerCharType) => {
    // Check for special character first
    const specialInfo = getSpecialCharInfo(char);
    if (specialInfo) {
      return { 
        ipa: '—', 
        phonetic: specialInfo.name,
        name: specialInfo.khmerName,
        description: specialInfo.description,
        special: specialInfo,
      };
    }

    if (type === 'consonant' || type === 'subscript') {
      const info = consonantIPA[char];
      return info ? { ipa: info.ipa, phonetic: info.phonetic, name: info.name, series: info.series } : null;
    }
    if (type === 'vowel') {
      const info = vowelIPA[char];
      return info ? { ipa: info.ipa, phonetic: info.phonetic, name: info.name } : null;
    }
    if (type === 'sign' || type === 'coeng') {
      const info = signIPA[char];
      return info ? { ipa: info.ipa, phonetic: info.phonetic, name: info.name } : null;
    }
    return null;
  };

  // Handle textarea mouse movement for hover sync
  const handleTextareaMouseMove = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const text = textarea.value;
    
    // Create a temporary span to measure character positions
    const rect = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);
    
    // Calculate approximate character index based on mouse position
    const x = e.clientX - rect.left - parseFloat(style.paddingLeft);
    const y = e.clientY - rect.top - parseFloat(style.paddingTop);
    
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
    const fontSize = parseFloat(style.fontSize);
    const charWidth = fontSize * 0.6; // Approximate for Khmer
    
    const line = Math.floor(y / lineHeight);
    const col = Math.floor(x / charWidth);
    
    // Simple approximation - find character index
    const lines = text.split('\n');
    let charIdx = 0;
    for (let i = 0; i < Math.min(line, lines.length); i++) {
      charIdx += lines[i].length + 1;
    }
    charIdx += Math.min(col, (lines[line] || '').length);
    
    if (charIdx >= 0 && charIdx < charPositionMap.length) {
      setInputHoverIdx(charPositionMap[charIdx]);
    } else {
      setInputHoverIdx(null);
    }
  }, [charPositionMap]);

  const handleTextareaMouseLeave = useCallback(() => {
    setInputHoverIdx(null);
  }, []);

  const khmerFontStyle = { fontFamily: `'${selectedFont.family}', 'Noto Sans Khmer', sans-serif` };

  return (
    <div className="khmer-analyzer">
      {/* Font Selector */}
      <div className="font-selector">
        <div className="font-selector-header">
          <label className="selector-label">Font Style</label>
          <div className="font-preview" style={khmerFontStyle}>
            ក ខ គ ឃ ង
          </div>
        </div>
        <div className="font-groups">
          {Object.entries(fontsByStyle).map(([style, fonts]) => (
            <div key={style} className="font-group">
              <span className="font-group-label">{styleLabels[style]}</span>
              <div className="font-options">
                {fonts.map((font) => (
                  <button
                    key={font.name}
                    className={`font-option ${selectedFont.name === font.name ? 'selected' : ''}`}
                    onClick={() => setSelectedFont(font)}
                    title={font.description}
                    style={{ fontFamily: `'${font.family}', sans-serif` }}
                  >
                    {font.name.replace('Noto ', '').replace(' Khmer', '')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-header">
          <label htmlFor="khmer-input" className="input-label">
            Enter Khmer Text
          </label>
          <div className="pronunciation-toggle">
            <button 
              className={`toggle-btn ${showIPA ? 'active' : ''}`}
              onClick={() => setShowIPA(true)}
            >
              IPA
            </button>
            <button 
              className={`toggle-btn ${!showIPA ? 'active' : ''}`}
              onClick={() => setShowIPA(false)}
            >
              Phonetic
            </button>
          </div>
        </div>
        <textarea
          id="khmer-input"
          className="khmer-input"
          style={khmerFontStyle}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onMouseMove={handleTextareaMouseMove}
          onMouseLeave={handleTextareaMouseLeave}
          placeholder="សូមសរសេរភាសាខ្មែរនៅទីនេះ..."
          rows={3}
        />
        <p className="input-hint">Hover over text to highlight in analysis below</p>
      </div>

      {inputText && (
        <>
          {/* Rainbow highlighted text row */}
          <section className="analysis-section">
            <h2 className="section-title">Character Analysis</h2>
            <div className="rainbow-text" style={khmerFontStyle}>
              {clusters.map((cluster, clusterIdx) => {
                if (cluster.type === 'space') {
                  return (
                    <span key={clusterIdx} className="word-separator">
                      <span className="separator-line" />
                    </span>
                  );
                }

                const isHighlightedFromInput = inputHoverIdx === clusterIdx;

                return (
                  <span 
                    key={clusterIdx} 
                    className={`cluster-wrapper ${isHighlightedFromInput ? 'input-highlighted' : ''}`}
                  >
                    {cluster.components.map((comp, compIdx) => {
                      const isHovered = 
                        hoveredComponent?.clusterIdx === clusterIdx && 
                        hoveredComponent?.compIdx === compIdx;
                      const compInfo = getComponentInfo(comp.char, comp.type);
                      
                      return (
                        <span
                          key={compIdx}
                          className={`char-component ${isHovered ? 'hovered' : ''}`}
                          style={{
                            color: charTypeColors[comp.type],
                            backgroundColor: charTypeBgColors[comp.type],
                          }}
                          onMouseEnter={() => setHoveredComponent({ clusterIdx, compIdx })}
                          onMouseLeave={() => setHoveredComponent(null)}
                        >
                          {comp.char}
                          {isHovered && compInfo && (
                            <span className="component-tooltip">
                              <span className="tooltip-char" style={khmerFontStyle}>{comp.char}</span>
                              <span className="tooltip-type">{TYPE_LABELS[comp.type]}</span>
                              {compInfo.ipa && compInfo.ipa !== '—' && (
                                <span className="tooltip-pronunciation">
                                  {showIPA ? `/${compInfo.ipa}/` : compInfo.phonetic}
                                </span>
                              )}
                              <span className="tooltip-name">{compInfo.name}</span>
                              {'series' in compInfo && compInfo.series && (
                                <span className="tooltip-series">Series {compInfo.series}</span>
                              )}
                              {'special' in compInfo && compInfo.special && (
                                <span className="tooltip-description">{compInfo.special.description}</span>
                              )}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </div>
          </section>

          {/* Legend */}
          <section className="legend-section">
            <div className="legend">
              {Object.entries(charTypeColors)
                .filter(([type]) => type !== 'space' && type !== 'other')
                .map(([type, color]) => (
                  <div key={type} className="legend-item">
                    <span 
                      className="legend-color" 
                      style={{ 
                        backgroundColor: charTypeBgColors[type as KhmerCharType],
                        borderColor: color,
                      }} 
                    />
                    <span className="legend-label">{TYPE_LABELS[type as KhmerCharType]}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Interactive word row */}
          <section className="analysis-section">
            <h2 className="section-title">Word Analysis</h2>
            <p className="section-subtitle">Hover over syllables for pronunciation and meaning</p>
            <div className="word-row">
              {words.map((wordData, wordIdx) => (
                <div key={wordIdx} className="word-group">
                  {wordData.clusters.map((cluster, clusterIdx) => {
                    const globalIdx = wordData.startIdx + clusterIdx;
                    const isHovered = hoveredCluster === globalIdx;
                    const info = getClusterInfo(cluster);
                    const wordLookup = lookupWord(wordData.word);

                    return (
                      <span
                        key={clusterIdx}
                        className={`syllable ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--accent-color': getRainbowColor(globalIdx),
                          ...khmerFontStyle,
                        } as React.CSSProperties}
                        onMouseEnter={() => setHoveredCluster(globalIdx)}
                        onMouseLeave={() => setHoveredCluster(null)}
                      >
                        <span className="syllable-text">{cluster.text}</span>
                        {isHovered && (
                          <div className="syllable-tooltip">
                            <div className="tooltip-header">
                              <span className="tooltip-khmer" style={khmerFontStyle}>{cluster.text}</span>
                            </div>
                            <div className="tooltip-body">
                              {'special' in info && info.special ? (
                                <>
                                  <div className="tooltip-row special-row">
                                    <span className="tooltip-label">Name</span>
                                    <span className="tooltip-value">{info.special.name}</span>
                                  </div>
                                  <div className="tooltip-row">
                                    <span className="tooltip-label">Khmer</span>
                                    <span className="tooltip-value" style={khmerFontStyle}>{info.special.khmerName}</span>
                                  </div>
                                  <div className="tooltip-description-block">
                                    {info.special.description}
                                  </div>
                                  {info.special.example && (
                                    <div className="tooltip-example">
                                      <span className="example-label">Example:</span>
                                      <span style={khmerFontStyle}>{info.special.example}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="tooltip-row">
                                    <span className="tooltip-label">{showIPA ? 'IPA' : 'Sound'}</span>
                                    <span className={`tooltip-value ${showIPA ? 'ipa' : 'phonetic'}`}>
                                      {showIPA ? `/${info.ipa}/` : info.phonetic}
                                    </span>
                                  </div>
                                  {showIPA && info.phonetic && (
                                    <div className="tooltip-row">
                                      <span className="tooltip-label">Sounds like</span>
                                      <span className="tooltip-value phonetic">{info.phonetic}</span>
                                    </div>
                                  )}
                                  {info.english && (
                                    <div className="tooltip-row">
                                      <span className="tooltip-label">Meaning</span>
                                      <span className="tooltip-value english">{info.english}</span>
                                    </div>
                                  )}
                                  {!info.english && wordLookup && (
                                    <div className="tooltip-row">
                                      <span className="tooltip-label">Word</span>
                                      <span className="tooltip-value english">{wordLookup.english}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="tooltip-components">
                              {cluster.components.map((comp, i) => (
                                <span 
                                  key={i} 
                                  className="mini-component"
                                  style={{ color: charTypeColors[comp.type] }}
                                >
                                  {comp.char}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {/* Full word translations */}
          {words.some(w => lookupWord(w.word)) && (
            <section className="analysis-section">
              <h2 className="section-title">Dictionary Matches</h2>
              <div className="dictionary-matches">
                {words.map((wordData, idx) => {
                  const entry = lookupWord(wordData.word);
                  if (!entry) return null;
                  
                  return (
                    <div key={idx} className="dict-entry">
                      <span className="dict-khmer" style={khmerFontStyle}>{wordData.word}</span>
                      <span className="dict-arrow">→</span>
                      <div className="dict-pronunciation">
                        <span className="dict-ipa">/{entry.ipa}/</span>
                        <span className="dict-phonetic">{entry.phonetic}</span>
                      </div>
                      <span className="dict-english">{entry.english}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
