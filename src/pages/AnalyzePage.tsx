import { useState, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { parseKhmerText, type KhmerCluster, type KhmerCharType } from '../utils/khmerParser';
import { romanizeCluster, getCharRomanization } from '../utils/alaLcRomanization';
import { lookupKhmer, type DictionaryEntry } from '../utils/dictionaryCore';
import { charTypeColors, charTypeBgColors, getRainbowColor } from '../utils/colors';
import { RomanizationPanel } from '../components/analyzer/RomanizationPanel';
import { ConfidenceWarning } from '../components/analyzer/ConfidenceWarning';
import './AnalyzePage.css';

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

export function AnalyzePage() {
  const { settings } = useSettings();
  const [inputText, setInputText] = useState('សួស្តី ខ្ញុំ ស្រឡាញ់ កម្ពុជា');
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<{ clusterIdx: number; compIdx: number } | null>(null);

  const clusters = useMemo(() => parseKhmerText(inputText), [inputText]);

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

  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };
  const showIPA = settings.pronunciationMode === 'ipa';

  const getClusterInfo = useCallback((cluster: KhmerCluster) => {
    // Check dictionary first
    const dictEntry = lookupKhmer(cluster.text);
    if (dictEntry) {
      return {
        phonetic: dictEntry.phonetic || '',
        romanized: dictEntry.romanized || dictEntry.phonetic || '',
        english: dictEntry.english,
        confidence: 'high' as const,
        warnings: [],
        fromDictionary: true,
      };
    }

    // Use algorithmic romanization
    const rom = romanizeCluster(cluster.components);
    return {
      phonetic: rom.phonetic,
      romanized: rom.romanized,
      english: null,
      confidence: rom.confidence,
      warnings: rom.warnings,
      fromDictionary: false,
    };
  }, []);

  const getComponentInfo = useCallback((char: string, type: KhmerCharType) => {
    const romInfo = getCharRomanization(char, type);
    return romInfo;
  }, []);

  return (
    <div className="analyze-page">
      {/* Input Section */}
      <div className="input-section">
        <div className="input-header">
          <label htmlFor="khmer-input" className="input-label">
            Enter Khmer Text
          </label>
        </div>
        <textarea
          id="khmer-input"
          className="khmer-input"
          style={khmerFontStyle}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="សូមសរសេរភាសាខ្មែរនៅទីនេះ..."
          rows={3}
        />
      </div>

      {/* Romanization Panel (if enabled) */}
      <RomanizationPanel text={inputText} />

      {inputText && (
        <>
          {/* Character Analysis */}
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

                return (
                  <span key={clusterIdx} className="cluster-wrapper">
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
                          {isHovered && compInfo && settings.romanizationDisplay === 'hover' && (
                            <span className="component-tooltip">
                              <span className="tooltip-char" style={khmerFontStyle}>{comp.char}</span>
                              <span className="tooltip-type">{TYPE_LABELS[comp.type]}</span>
                              <span className="tooltip-pronunciation">
                                {showIPA ? compInfo.romanized : compInfo.phonetic}
                              </span>
                              <span className="tooltip-name">{compInfo.name}</span>
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

          {/* Word Analysis */}
          <section className="analysis-section">
            <h2 className="section-title">Word Analysis</h2>
            <p className="section-subtitle">
              {settings.romanizationDisplay === 'hover' 
                ? 'Hover over syllables for pronunciation and meaning'
                : 'Tap syllables for details'
              }
            </p>
            <div className="word-row">
              {words.map((wordData, wordIdx) => (
                <div key={wordIdx} className="word-group">
                  {wordData.clusters.map((cluster, clusterIdx) => {
                    const globalIdx = wordData.startIdx + clusterIdx;
                    const isHovered = hoveredCluster === globalIdx;
                    const info = getClusterInfo(cluster);
                    const wordLookup = lookupKhmer(wordData.word);

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
                        {!info.fromDictionary && (
                          <ConfidenceWarning 
                            level={info.confidence} 
                            warnings={info.warnings}
                          />
                        )}
                        {isHovered && settings.romanizationDisplay === 'hover' && (
                          <div className="syllable-tooltip">
                            <div className="tooltip-header">
                              <span className="tooltip-khmer" style={khmerFontStyle}>
                                {cluster.text}
                              </span>
                            </div>
                            <div className="tooltip-body">
                              <div className="tooltip-row">
                                <span className="tooltip-label">
                                  {showIPA ? 'ALA-LC' : 'Sound'}
                                </span>
                                <span className={`tooltip-value ${showIPA ? 'ipa' : 'phonetic'}`}>
                                  {showIPA ? info.romanized : info.phonetic}
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
                              {!info.fromDictionary && info.warnings.length > 0 && (
                                <div className="tooltip-warning">
                                  <ConfidenceWarning 
                                    level={info.confidence} 
                                    warnings={info.warnings}
                                    inline
                                  />
                                  <span className="warning-text">
                                    {info.confidence === 'low' ? 'Uncertain' : 'Approximate'}
                                  </span>
                                </div>
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

          {/* Dictionary Matches */}
          {words.some((w) => lookupKhmer(w.word)) && (
            <section className="analysis-section">
              <h2 className="section-title">Dictionary Matches</h2>
              <div className="dictionary-matches">
                {words.map((wordData, idx) => {
                  const entry = lookupKhmer(wordData.word);
                  if (!entry) return null;

                  return (
                    <div key={idx} className="dict-entry">
                      <span className="dict-khmer" style={khmerFontStyle}>
                        {wordData.word}
                      </span>
                      <span className="dict-arrow">→</span>
                      <div className="dict-pronunciation">
                        <span className="dict-phonetic">{entry.phonetic}</span>
                      </div>
                      <span className="dict-english">{entry.english}</span>
                      {entry.pos && (
                        <span className="dict-pos">{entry.pos}</span>
                      )}
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

