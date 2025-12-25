import { useState, useMemo } from 'react';
import { parseKhmerText, type KhmerCluster, type KhmerCharType } from '../utils/khmerParser';
import { lookupWord, approximateClusterIPA, consonantIPA, vowelIPA, signIPA } from '../utils/khmerDictionary';
import { charTypeColors, charTypeBgColors, getRainbowColor } from '../utils/colors';
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

  const clusters = useMemo(() => {
    return parseKhmerText(inputText);
  }, [inputText]);

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

  const getClusterInfo = (cluster: KhmerCluster, clusterIdx: number) => {
    // Check if the whole word exists in dictionary
    const wordEntry = lookupWord(cluster.text);
    if (wordEntry) {
      return {
        ipa: wordEntry.ipa,
        english: wordEntry.english,
        romanization: wordEntry.romanization,
      };
    }

    // Generate approximate IPA
    const ipa = approximateClusterIPA(cluster.components);
    return { ipa, english: null, romanization: null };
  };

  const getComponentInfo = (char: string, type: KhmerCharType) => {
    if (type === 'consonant' || type === 'subscript') {
      const info = consonantIPA[char];
      return info ? { ipa: info.ipa, name: info.name } : null;
    }
    if (type === 'vowel') {
      const info = vowelIPA[char];
      return info ? { ipa: info.ipa, name: info.name } : null;
    }
    if (type === 'sign' || type === 'coeng') {
      const info = signIPA[char];
      return info ? { ipa: info.ipa, name: info.name } : null;
    }
    return null;
  };

  return (
    <div className="khmer-analyzer">
      <div className="input-section">
        <label htmlFor="khmer-input" className="input-label">
          Enter Khmer Text
        </label>
        <textarea
          id="khmer-input"
          className="khmer-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="សូមសរសេរភាសាខ្មែរនៅទីនេះ..."
          rows={3}
        />
      </div>

      {inputText && (
        <>
          {/* Rainbow highlighted text row */}
          <section className="analysis-section">
            <h2 className="section-title">Character Analysis</h2>
            <div className="rainbow-text">
              {clusters.map((cluster, clusterIdx) => {
                if (cluster.type === 'space') {
                  return <span key={clusterIdx} className="space-char">&nbsp;</span>;
                }

                return (
                  <span key={clusterIdx} className="cluster-wrapper">
                    {cluster.components.map((comp, compIdx) => {
                      const isHovered = 
                        hoveredComponent?.clusterIdx === clusterIdx && 
                        hoveredComponent?.compIdx === compIdx;
                      
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
                          {isHovered && (
                            <span className="component-tooltip">
                              <span className="tooltip-char">{comp.char}</span>
                              <span className="tooltip-type">{TYPE_LABELS[comp.type]}</span>
                              {getComponentInfo(comp.char, comp.type) && (
                                <>
                                  <span className="tooltip-ipa">
                                    /{getComponentInfo(comp.char, comp.type)?.ipa}/
                                  </span>
                                  <span className="tooltip-name">
                                    {getComponentInfo(comp.char, comp.type)?.name}
                                  </span>
                                </>
                              )}
                            </span>
                          )}
                        </span>
                      );
                    })}
                    <span className="cluster-divider" />
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
                    const info = getClusterInfo(cluster, globalIdx);
                    const wordLookup = lookupWord(wordData.word);

                    return (
                      <span
                        key={clusterIdx}
                        className={`syllable ${isHovered ? 'hovered' : ''}`}
                        style={{
                          '--accent-color': getRainbowColor(globalIdx),
                        } as React.CSSProperties}
                        onMouseEnter={() => setHoveredCluster(globalIdx)}
                        onMouseLeave={() => setHoveredCluster(null)}
                      >
                        <span className="syllable-text">{cluster.text}</span>
                        {isHovered && (
                          <div className="syllable-tooltip">
                            <div className="tooltip-header">
                              <span className="tooltip-khmer">{cluster.text}</span>
                            </div>
                            <div className="tooltip-body">
                              <div className="tooltip-row">
                                <span className="tooltip-label">IPA</span>
                                <span className="tooltip-value ipa">/{info.ipa}/</span>
                              </div>
                              {info.romanization && (
                                <div className="tooltip-row">
                                  <span className="tooltip-label">Roman</span>
                                  <span className="tooltip-value">{info.romanization}</span>
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
                      <span className="dict-khmer">{wordData.word}</span>
                      <span className="dict-arrow">→</span>
                      <span className="dict-ipa">/{entry.ipa}/</span>
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

