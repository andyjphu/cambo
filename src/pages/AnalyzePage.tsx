import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { parseKhmerText, type KhmerCluster, type KhmerCharType } from '../utils/khmerParser';
import { romanizeCluster, getCharRomanization } from '../utils/alaLcRomanization';
import { lookupKhmer, type DictionaryEntry } from '../utils/dictionaryCore';
import { getSyllableColor, getComponentBgColor, getSyllableAccent } from '../utils/colors';
import { RomanizationPanel } from '../components/analyzer/RomanizationPanel';
import { ConfidenceWarning } from '../components/analyzer/ConfidenceWarning';
import { SpaceEditor } from '../components/analyzer/SpaceEditor';
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

// Part of speech labels - full names for user display
const POS_LABELS: Record<string, string> = {
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

export function AnalyzePage() {
  const { settings } = useSettings();
  const [inputText, setInputText] = useState('សួស្តី ខ្ញុំ ស្រឡាញ់ កម្ពុជា');
  const [isEditMode, setIsEditMode] = useState(true);
  
  // Two-level highlighting system:
  // - Cluster level: highlights the full syllable (for Khmer Text box, Romanization)
  // - Component level: highlights individual character (for Character Analysis detail)
  const [hoveredClusterIdx, setHoveredClusterIdx] = useState<number | null>(null);
  const [hoveredCompIdx, setHoveredCompIdx] = useState<number | null>(null); // Component within hovered cluster
  const [lockedClusterIdx, setLockedClusterIdx] = useState<number | null>(null);
  const [lockedCompIdx, setLockedCompIdx] = useState<number | null>(null);
  
  const charAnalysisRef = useRef<HTMLDivElement>(null);
  const clusterRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const clusters = useMemo(() => parseKhmerText(inputText), [inputText]);
  
  // Get non-space cluster indices for consistent coloring
  const nonSpaceClusterIndices = useMemo(() => {
    const indices: number[] = [];
    clusters.forEach((cluster, idx) => {
      if (cluster.type !== 'space') {
        indices.push(idx);
      }
    });
    return indices;
  }, [clusters]);
  
  // Get non-space index for a cluster
  const getNonSpaceIdx = useCallback((clusterIdx: number) => {
    return nonSpaceClusterIndices.indexOf(clusterIdx);
  }, [nonSpaceClusterIndices]);
  
  // Active highlight state (locked takes precedence)
  const activeClusterIdx = lockedClusterIdx ?? hoveredClusterIdx;
  const activeCompIdx = lockedCompIdx ?? hoveredCompIdx;
  
  // Scroll to highlighted cluster
  useEffect(() => {
    if (activeClusterIdx !== null) {
      const element = clusterRefs.current.get(activeClusterIdx);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeClusterIdx]);
  
  // Clear locked highlight when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.input-cluster') && 
          !target.closest('.cluster-wrapper') && 
          !target.closest('.romanization-cluster') &&
          !target.closest('.syllable')) {
        setLockedClusterIdx(null);
        setLockedCompIdx(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Highlight handlers
  const handleClusterHover = useCallback((clusterIdx: number | null, compIdx: number | null = null) => {
    setHoveredClusterIdx(clusterIdx);
    setHoveredCompIdx(compIdx);
  }, []);
  
  const handleClusterClick = useCallback((clusterIdx: number, compIdx: number | null = null) => {
    if (lockedClusterIdx === clusterIdx && lockedCompIdx === compIdx) {
      setLockedClusterIdx(null);
      setLockedCompIdx(null);
    } else {
      setLockedClusterIdx(clusterIdx);
      setLockedCompIdx(compIdx);
    }
  }, [lockedClusterIdx, lockedCompIdx]);

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
            {isEditMode ? 'Enter Khmer Text' : 'Khmer Text'}
          </label>
          <div className="input-mode-toggle">
            {isEditMode ? (
              <button 
                className="mode-toggle-btn confirm-btn"
                onClick={() => setIsEditMode(false)}
                title="Confirm and view (press to lock text)"
                disabled={!inputText.trim()}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                </svg>
              </button>
            ) : (
              <button 
                className="mode-toggle-btn edit-btn"
                onClick={() => setIsEditMode(true)}
                title="Edit text"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {isEditMode ? (
          <textarea
            id="khmer-input"
            className="khmer-input"
            style={khmerFontStyle}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="សូមសរសេរភាសាខ្មែរនៅទីនេះ..."
            rows={3}
          />
        ) : (
          <div 
            className="khmer-display interactive"
            style={khmerFontStyle}
          >
            {inputText ? (
              // Render each cluster as a single unit to preserve Khmer ligatures
              clusters.map((cluster, clusterIdx) => {
                if (cluster.type === 'space') {
                  return <span key={clusterIdx} className="input-space"> </span>;
                }
                
                const nonSpaceIdx = getNonSpaceIdx(clusterIdx);
                const syllableColor = getSyllableColor(nonSpaceIdx);
                const isHighlighted = activeClusterIdx === clusterIdx;
                
                return (
                  <span 
                    key={clusterIdx} 
                    className={`input-cluster ${isHighlighted ? 'highlighted' : ''}`}
                    style={{ 
                      '--syllable-accent': syllableColor.accent,
                      '--syllable-bg': syllableColor.bgMedium,
                    } as React.CSSProperties}
                    onMouseEnter={() => handleClusterHover(clusterIdx)}
                    onMouseLeave={() => handleClusterHover(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClusterClick(clusterIdx);
                    }}
                  >
                    {cluster.text}
                  </span>
                );
              })
            ) : (
              <span className="placeholder">Click to add text...</span>
            )}
            <button 
              className="edit-overlay-btn"
              onClick={() => setIsEditMode(true)}
              title="Edit text"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Space Editor - for manual word boundary editing (always visible, grayed when editing) */}
      {inputText && (
        <SpaceEditor 
          text={inputText}
          onTextChange={setInputText}
          disabled={isEditMode}
        />
      )}

      {/* Romanization Panel (if enabled) */}
      <RomanizationPanel 
        text={inputText}
        clusters={clusters}
        activeClusterIdx={activeClusterIdx}
        onClusterHover={handleClusterHover}
        onClusterClick={handleClusterClick}
        getNonSpaceIdx={getNonSpaceIdx}
      />

      {inputText && (
        <>
          {/* Character Analysis */}
          <section className="analysis-section">
            <h2 className="section-title">Character Analysis</h2>
            <p className="section-subtitle">
              {!isEditMode ? 'Hover components for syllable, word & character details' : 'Each syllable has a unique color'}
            </p>
            <div className="rainbow-text" style={khmerFontStyle} ref={charAnalysisRef}>
              {clusters.map((cluster, clusterIdx) => {
                if (cluster.type === 'space') {
                  return (
                    <span key={clusterIdx} className="word-separator">
                      <span className="separator-line" />
                    </span>
                  );
                }

                const nonSpaceIdx = getNonSpaceIdx(clusterIdx);
                const syllableColor = getSyllableColor(nonSpaceIdx);
                const isClusterHighlighted = activeClusterIdx === clusterIdx;
                const syllableInfo = getClusterInfo(cluster);
                
                // Find the word this cluster belongs to
                const wordInfo = words.find(w => {
                  const clusterInWord = w.startIdx <= clusterIdx && clusterIdx < w.startIdx + w.clusters.length;
                  return clusterInWord;
                });
                const wordLookup = wordInfo ? lookupKhmer(wordInfo.word) : null;

                return (
                  <span 
                    key={clusterIdx}
                    ref={(el) => {
                      if (el) clusterRefs.current.set(clusterIdx, el);
                      else clusterRefs.current.delete(clusterIdx);
                    }}
                    className={`cluster-wrapper ${isClusterHighlighted ? 'cluster-highlighted' : ''}`}
                    style={{ '--syllable-accent': syllableColor.accent } as React.CSSProperties}
                    onMouseEnter={() => handleClusterHover(clusterIdx)}
                    onMouseLeave={() => handleClusterHover(null)}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('.char-component')) {
                        e.stopPropagation();
                        handleClusterClick(clusterIdx);
                      }
                    }}
                  >
                    {cluster.components.map((comp, compIdx) => {
                      const isCompHighlighted = isClusterHighlighted && activeCompIdx === compIdx;
                      const compInfo = getComponentInfo(comp.char, comp.type);
                      const compBg = getComponentBgColor(nonSpaceIdx, comp.type);

                      return (
                        <span
                          key={compIdx}
                          className={`char-component ${isCompHighlighted ? 'comp-highlighted' : ''}`}
                          style={{
                            backgroundColor: compBg,
                            '--syllable-accent': syllableColor.accent,
                          } as React.CSSProperties}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            handleClusterHover(clusterIdx, compIdx);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClusterClick(clusterIdx, compIdx);
                          }}
                        >
                          {comp.char}
                          {/* Unified tooltip - two column layout for Word & Component */}
                          {isCompHighlighted && settings.showHoverTooltips && (
                            <div className="unified-tooltip">
                              {/* Syllable Header - compact single row */}
                              <div className="tooltip-header-row">
                                <span className="tooltip-khmer" style={khmerFontStyle}>{cluster.text}</span>
                                <span className={`tooltip-sound ${showIPA ? 'ipa' : 'phonetic'}`}>
                                  {showIPA ? syllableInfo.romanized : syllableInfo.phonetic}
                                </span>
                                {syllableInfo.english && (
                                  <span className="tooltip-meaning">{syllableInfo.english}</span>
                                )}
                                {!syllableInfo.fromDictionary && (
                                  <ConfidenceWarning level={syllableInfo.confidence} warnings={syllableInfo.warnings} inline />
                                )}
                              </div>
                              
                              {/* Two Column Layout */}
                              <div className="tooltip-columns">
                                {/* Word Column */}
                                <div className="tooltip-column word-column">
                                  <div className="column-header">
                                    <span className="column-label">Word</span>
                                    {wordLookup && wordInfo ? (
                                      <span className="column-khmer" style={khmerFontStyle}>{wordInfo.word}</span>
                                    ) : (
                                      <span className="column-khmer" style={khmerFontStyle}>{cluster.text}</span>
                                    )}
                                  </div>
                                  {wordLookup ? (
                                    <div className="column-body">
                                      <div className="column-row">
                                        <span className="column-value phonetic">{wordLookup.phonetic}</span>
                                      </div>
                                      <div className="column-row">
                                        <span className="column-value english">{wordLookup.english}</span>
                                      </div>
                                      {wordLookup.pos && (
                                        <span className="column-pos">{POS_LABELS[wordLookup.pos] || wordLookup.pos}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="column-body">
                                      <span className="column-na">—</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Component Column */}
                                <div className="tooltip-column component-column">
                                  <div className="column-header">
                                    <span className="column-label">{TYPE_LABELS[comp.type]}</span>
                                    <span className="column-char" style={khmerFontStyle}>{comp.char}</span>
                                  </div>
                                  {compInfo ? (
                                    <div className="column-body">
                                      <div className="column-row">
                                        <span className="column-value phonetic">
                                          {showIPA ? compInfo.romanized : compInfo.phonetic}
                                        </span>
                                      </div>
                                      <div className="column-row">
                                        <span className="column-value name">{compInfo.name}</span>
                                      </div>
                                      {compInfo.description && (
                                        <span className="column-desc">{compInfo.description}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="column-body">
                                      <span className="column-na">—</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Component breakdown */}
                              <div className="tooltip-components">
                                {cluster.components.map((c, i) => {
                                  const cBg = getComponentBgColor(nonSpaceIdx, c.type);
                                  return (
                                    <span
                                      key={i}
                                      className={`mini-component ${i === compIdx ? 'active' : ''}`}
                                      style={{ backgroundColor: cBg }}
                                    >
                                      {c.char}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </span>
                      );
                    })}
                    {/* Cluster-only tooltip - shows when cluster highlighted but no specific component */}
                    {isClusterHighlighted && activeCompIdx === null && settings.showHoverTooltips && (
                      <div className="unified-tooltip cluster-only">
                        <div className="tooltip-header-row">
                          <span className="tooltip-khmer" style={khmerFontStyle}>{cluster.text}</span>
                          <span className={`tooltip-sound ${showIPA ? 'ipa' : 'phonetic'}`}>
                            {showIPA ? syllableInfo.romanized : syllableInfo.phonetic}
                          </span>
                          {syllableInfo.english && (
                            <span className="tooltip-meaning">{syllableInfo.english}</span>
                          )}
                        </div>
                        {wordLookup && wordInfo && wordInfo.word !== cluster.text && (
                          <div className="tooltip-word-row">
                            <span className="word-label">Word:</span>
                            <span className="word-khmer" style={khmerFontStyle}>{wordInfo.word}</span>
                            <span className="word-meaning">{wordLookup.english}</span>
                          </div>
                        )}
                        <div className="tooltip-components">
                          {cluster.components.map((c, i) => {
                            const cBg = getComponentBgColor(nonSpaceIdx, c.type);
                            return (
                              <span key={i} className="mini-component" style={{ backgroundColor: cBg }}>
                                {c.char}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </span>
                );
              })}
            </div>
          </section>

          {/* Legend - now shows shade meaning within syllables */}
          <section className="legend-section">
            <div className="legend syllable-legend">
              <div className="legend-item">
                <span className="legend-color dark" />
                <span className="legend-label">Base consonant</span>
              </div>
              <div className="legend-item">
                <span className="legend-color medium" />
                <span className="legend-label">Subscript/coeng</span>
              </div>
              <div className="legend-item">
                <span className="legend-color light" />
                <span className="legend-label">Vowel/sign</span>
              </div>
              <span className="legend-note">Each syllable gets a unique color</span>
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

                  // Get romanization based on mode
                  const displayRomanization = showIPA 
                    ? (entry.romanized || entry.phonetic?.toLowerCase() || '') 
                    : (entry.phonetic || '');

                  return (
                    <div key={idx} className="dict-entry">
                      <span className="dict-khmer" style={khmerFontStyle}>
                        {wordData.word}
                      </span>
                      <span className="dict-arrow">→</span>
                      <div className="dict-pronunciation">
                        <span className={`dict-phonetic ${showIPA ? 'ipa-mode' : ''}`}>
                          {displayRomanization}
                        </span>
                      </div>
                      <span className="dict-english">{entry.english}</span>
                      {entry.pos && (
                        <span className="dict-pos">{POS_LABELS[entry.pos] || entry.pos}</span>
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

