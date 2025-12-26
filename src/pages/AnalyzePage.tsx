import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { parseKhmerText, type KhmerCluster, type KhmerCharType } from '../utils/khmerParser';
import { romanizeCluster, getCharRomanization } from '../utils/alaLcRomanization';
import { segmentText, segmentedToText, refreshDictionary, getDictionaryEntry, isUserDefinedWord } from '../utils/wordSegmentation';
import { getSyllableColor, getComponentBgColor, type SyllableColor } from '../utils/colors';
import { CollapsiblePanel } from '../components/ui/CollapsiblePanel';
import { Tooltip } from '../components/ui/Tooltip';
import { RomanizationPanel } from '../components/analyzer/RomanizationPanel';
import { ConfidenceWarning } from '../components/analyzer/ConfidenceWarning';
import { SpaceEditor } from '../components/analyzer/SpaceEditor';
import { SelectionPanel } from '../components/analyzer/SelectionPanel';
import { BsArrowsAngleContract } from 'react-icons/bs';
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

const INPUT_TEXT_STORAGE_KEY = 'cambo-input-text';
const PANEL_STATE_STORAGE_KEY = 'cambo-panel-states';
const DEFAULT_INPUT_TEXT = 'សួស្តី ខ្ញុំ ស្រឡាញ់ កម្ពុជា';

interface PanelStates {
  khmerText: boolean;
  wordBoundaries: boolean;
  romanization: boolean;
  characterAnalysis: boolean;
  dictionaryMatches: boolean;
}

const DEFAULT_PANEL_STATES: PanelStates = {
  khmerText: true,
  wordBoundaries: true,
  romanization: true,
  characterAnalysis: true,
  dictionaryMatches: true,
};

function loadInputText(): string {
  try {
    const saved = localStorage.getItem(INPUT_TEXT_STORAGE_KEY);
    return saved ?? DEFAULT_INPUT_TEXT;
  } catch {
    return DEFAULT_INPUT_TEXT;
  }
}

function loadPanelStates(): PanelStates {
  try {
    const saved = localStorage.getItem(PANEL_STATE_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PANEL_STATES, ...JSON.parse(saved) };
    }
    return DEFAULT_PANEL_STATES;
  } catch {
    return DEFAULT_PANEL_STATES;
  }
}

export function AnalyzePage() {
  const { settings } = useSettings();
  const [inputText, setInputText] = useState(loadInputText);
  const [isEditMode, setIsEditMode] = useState(true);
  const [panelStates, setPanelStates] = useState<PanelStates>(loadPanelStates);
  const [isCondensedMode, setIsCondensedMode] = useState(false);
  const [isAnalysisCondensedMode, setIsAnalysisCondensedMode] = useState(false);

  // Persist input text to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INPUT_TEXT_STORAGE_KEY, inputText);
    } catch (e) {
      console.warn('Failed to save input text:', e);
    }
  }, [inputText]);

  // Persist panel states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_STATE_STORAGE_KEY, JSON.stringify(panelStates));
    } catch (e) {
      console.warn('Failed to save panel states:', e);
    }
  }, [panelStates]);

  const togglePanel = useCallback((panel: keyof PanelStates) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
  }, []);

  // Handler to confirm text and apply automatic segmentation
  const handleConfirmText = useCallback(() => {
    // Remove existing spaces and apply automatic segmentation
    const cleanText = inputText.replace(/\s+/g, '');
    if (cleanText) {
      const result = segmentText(cleanText);
      const segmentedText = segmentedToText(result.words);
      setInputText(segmentedText);
    }
    setIsEditMode(false);
  }, [inputText]);

  // Two-level highlighting system:
  // - Cluster level: highlights the full syllable (for Khmer Text box, Romanization)
  // - Component level: highlights individual character (for Character Analysis detail)
  const [hoveredClusterIdx, setHoveredClusterIdx] = useState<number | null>(null);
  const [hoveredCompIdx, setHoveredCompIdx] = useState<number | null>(null); // Component within hovered cluster
  const [lockedClusterIdx, setLockedClusterIdx] = useState<number | null>(null);
  const [lockedCompIdx, setLockedCompIdx] = useState<number | null>(null);

  const charAnalysisRef = useRef<HTMLDivElement>(null);
  const clusterRefs = useRef<Map<number, HTMLSpanElement>>(new Map()); // Character Analysis clusters
  const inputClusterRefs = useRef<Map<number, HTMLSpanElement>>(new Map()); // Khmer Text panel clusters
  const [lastClickSource, setLastClickSource] = useState<'input' | 'analysis' | null>(null);
  
  // Tooltip trigger ref for portal positioning
  const tooltipTriggerRef = useRef<HTMLSpanElement | null>(null);

  // Selection mode for multi-select and dictionary operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClusterIndices, setSelectedClusterIndices] = useState<Set<number>>(new Set());
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);

  // External control for SpaceEditor edit mode
  const [isEditingBoundaries, setIsEditingBoundaries] = useState(false);

  const clusters = useMemo(() => parseKhmerText(inputText), [inputText]);

  // Compute selected text from selected clusters
  const selectedText = useMemo(() => {
    if (selectedClusterIndices.size === 0) return '';

    // Get sorted indices and build text
    const sortedIndices = Array.from(selectedClusterIndices).sort((a, b) => a - b);
    return sortedIndices.map(idx => clusters[idx]?.text || '').join('');
  }, [selectedClusterIndices, clusters]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        // Exiting selection mode - clear selections
        setSelectedClusterIndices(new Set());
        setShowSelectionPanel(false);
      }
      return !prev;
    });
  }, []);

  // Handle cluster selection in selection mode
  const handleClusterSelect = useCallback((clusterIdx: number) => {
    setSelectedClusterIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterIdx)) {
        newSet.delete(clusterIdx);
      } else {
        newSet.add(clusterIdx);
      }
      // Show panel if we have selections
      if (newSet.size > 0 && !showSelectionPanel) {
        setShowSelectionPanel(true);
      }
      return newSet;
    });
  }, [showSelectionPanel]);

  // Handle word added callback
  const handleWordAdded = useCallback(() => {
    // Refresh dictionary after adding a word
    refreshDictionary();
  }, []);

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

  // Scroll to corresponding cluster in the OTHER panel when clicked
  useEffect(() => {
    if (lockedClusterIdx !== null && lastClickSource !== null) {
      // Scroll to the opposite panel from where the click originated
      if (lastClickSource === 'input') {
        // Clicked in Khmer text panel (or Romanization) -> scroll to Character Analysis
        const element = clusterRefs.current.get(lockedClusterIdx);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      } else if (lastClickSource === 'analysis') {
        // Clicked in Character Analysis -> scroll to Khmer text panel (at top)
        const element = inputClusterRefs.current.get(lockedClusterIdx);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    }
  }, [lockedClusterIdx, lastClickSource]);

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
        setLastClickSource(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Highlight handlers
  const handleClusterHover = useCallback((clusterIdx: number | null, compIdx: number | null = null, element?: HTMLSpanElement | null) => {
    setHoveredClusterIdx(clusterIdx);
    setHoveredCompIdx(compIdx);
    // Set tooltip trigger ref to the element that triggered the hover
    if (clusterIdx !== null && element) {
      tooltipTriggerRef.current = element;
    } else if (clusterIdx !== null) {
      // If no element provided, try to find it from refs
      const clusterElement = clusterRefs.current.get(clusterIdx) || inputClusterRefs.current.get(clusterIdx);
      tooltipTriggerRef.current = clusterElement || null;
    } else {
      tooltipTriggerRef.current = null;
    }
  }, []);

  const handleClusterClick = useCallback((clusterIdx: number, compIdx: number | null = null, source: 'input' | 'analysis' = 'input') => {
    if (lockedClusterIdx === clusterIdx && lockedCompIdx === compIdx) {
      setLockedClusterIdx(null);
      setLockedCompIdx(null);
      setLastClickSource(null);
    } else {
      setLockedClusterIdx(clusterIdx);
      setLockedCompIdx(compIdx);
      setLastClickSource(source);
    }
  }, [lockedClusterIdx, lockedCompIdx]);

  // Split into words (by spaces) and track if from new data (no English)
  const words = useMemo(() => {
    const result: { word: string; clusters: KhmerCluster[]; startIdx: number; hasEnglish: boolean }[] = [];
    let currentWord = '';
    let currentClusters: KhmerCluster[] = [];
    let startIdx = 0;
    let clusterIdx = 0;

    for (const cluster of clusters) {
      if (cluster.type === 'space') {
        if (currentWord) {
          const dictEntry = getDictionaryEntry(currentWord);
          const hasEnglish = !!dictEntry?.english;
          result.push({ word: currentWord, clusters: currentClusters, startIdx, hasEnglish });
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
      const dictEntry = getDictionaryEntry(currentWord);
      const hasEnglish = !!dictEntry?.english;
      result.push({ word: currentWord, clusters: currentClusters, startIdx, hasEnglish });
    }

    return result;
  }, [clusters]);

  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };
  const showIPA = settings.pronunciationMode === 'ipa';

  // Helper to get color scheme - cycles through color palette
  const getClusterColor = useCallback((_clusterIdx: number, nonSpaceIdx: number): SyllableColor => {
    return getSyllableColor(nonSpaceIdx);
  }, []);

  // Helper to get component background color
  const getClusterComponentBgColor = useCallback((
    _clusterIdx: number,
    nonSpaceIdx: number,
    componentType: 'consonant' | 'subscript' | 'vowel' | 'indep_vowel' | 'sign' | 'numeral' | 'punctuation' | 'coeng' | 'space' | 'other'
  ): string => {
    return getComponentBgColor(nonSpaceIdx, componentType);
  }, []);

  const getClusterInfo = useCallback((cluster: KhmerCluster) => {
    // Check dictionary first
    const dictEntry = getDictionaryEntry(cluster.text);
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

  // Compute tooltip data based on active cluster/component
  const tooltipData = useMemo(() => {
    if (activeClusterIdx === null || !settings.showHoverTooltips) return null;
    
    const cluster = clusters[activeClusterIdx];
    if (!cluster || cluster.type === 'space') return null;
    
    const nonSpaceIdx = getNonSpaceIdx(activeClusterIdx);
    const syllableInfo = getClusterInfo(cluster);
    
    // Find the word this cluster belongs to
    const wordInfo = words.find(w => {
      const clusterInWord = w.startIdx <= activeClusterIdx && activeClusterIdx < w.startIdx + w.clusters.length;
      return clusterInWord;
    });
    const wordLookup = wordInfo ? getDictionaryEntry(wordInfo.word) : null;
    
    // Component-specific data if a component is highlighted
    const comp = activeCompIdx !== null ? cluster.components[activeCompIdx] : null;
    const compInfo = comp ? getComponentInfo(comp.char, comp.type) : null;
    
    return {
      cluster,
      clusterIdx: activeClusterIdx,
      nonSpaceIdx,
      syllableInfo,
      wordInfo,
      wordLookup,
      comp,
      compInfo,
      isClusterOnly: activeCompIdx === null,
    };
  }, [activeClusterIdx, activeCompIdx, clusters, getNonSpaceIdx, getClusterInfo, words, getComponentInfo, settings.showHoverTooltips]);

  return (
    <div className="analyze-page">
      {/* Two-column layout: Khmer Text and Character Analysis side by side */}
      <div className="panels-row">
        {/* Khmer Text Panel */}
        <CollapsiblePanel
          title="Khmer Text"
          isExpanded={panelStates.khmerText}
          onToggle={() => togglePanel('khmerText')}
          className="panel-left"
          actionButton={
            <>
              {!isEditMode && (
                <button
                  className={`panel-action-btn ${isCondensedMode ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCondensedMode(!isCondensedMode);
                  }}
                  title={isCondensedMode ? 'Switch to sparse mode' : 'Switch to condensed mode'}
                >
                  <BsArrowsAngleContract size={14} />
                </button>
              )}
              {isEditMode ? (
                <button
                  className="panel-action-btn confirm"
                  onClick={handleConfirmText}
                  title="Confirm and auto-segment text"
                  disabled={!inputText.trim()}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                </button>
              ) : (
                <button
                  className="panel-action-btn edit"
                  onClick={() => setIsEditMode(true)}
                  title="Edit text"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
                  </svg>
                </button>
              )}
            </>
          }
        >
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
            <div className={`khmer-display ${isCondensedMode ? 'condensed' : 'sparse'}`} style={khmerFontStyle}>
              {inputText ? (
                clusters.map((cluster, clusterIdx) => {
                  if (cluster.type === 'space') {
                    return <span key={clusterIdx} className="input-space"> </span>;
                  }

                  const nonSpaceIdx = getNonSpaceIdx(clusterIdx);
                  const syllableColor = getClusterColor(clusterIdx, nonSpaceIdx);
                  const isHighlighted = activeClusterIdx === clusterIdx;

                  return (
                    <span
                      key={clusterIdx}
                      ref={(el) => {
                        if (el) inputClusterRefs.current.set(clusterIdx, el);
                        else inputClusterRefs.current.delete(clusterIdx);
                      }}
                      className={`input-cluster ${isHighlighted ? 'highlighted' : ''} ${isCondensedMode ? 'condensed' : 'sparse'}`}
                      style={{
                        '--syllable-accent': syllableColor.accent,
                        '--syllable-bg': syllableColor.bgMedium,
                      } as React.CSSProperties}
                      onMouseEnter={(e) => handleClusterHover(clusterIdx, null, e.currentTarget)}
                      onMouseLeave={() => handleClusterHover(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClusterClick(clusterIdx, null, 'input');
                      }}
                    >
                      {cluster.text}
                    </span>
                  );
                })
              ) : (
                <span className="placeholder">Click edit to add text...</span>
              )}
            </div>
          )}
        </CollapsiblePanel>

        {/* Character Analysis Panel */}
        {inputText && (
          <CollapsiblePanel
            title="Character Analysis"
            badge={isSelectionMode ? 'Selection Mode' : undefined}
            isExpanded={panelStates.characterAnalysis}
            onToggle={() => togglePanel('characterAnalysis')}
            className="panel-right"
            actionButton={
              <>
                <button
                  className={`panel-action-btn ${isAnalysisCondensedMode ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAnalysisCondensedMode(!isAnalysisCondensedMode);
                  }}
                  title={isAnalysisCondensedMode ? 'Switch to sparse mode' : 'Switch to condensed mode'}
                >
                  <BsArrowsAngleContract size={14} />
                </button>
                <button
                  className={`panel-action-btn selection ${isSelectionMode ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectionMode();
                  }}
                  title={isSelectionMode ? 'Exit selection mode' : 'Select syllables to copy or add to dictionary'}
                >
                  {isSelectionMode ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                      <path d="M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" />
                      <path d="M6.25 0a.75.75 0 0 0 0 1.5H7.5v2H3.75A1.75 1.75 0 0 0 2 5.25v.5a.75.75 0 0 0 1.5 0v-.5a.25.25 0 0 1 .25-.25H7.5v3.5H5.75a.75.75 0 0 0 0 1.5H7.5v.5c0 .69.28 1.315.732 1.768l1.5 1.5a.75.75 0 0 0 1.06-1.06l-1.5-1.5A.25.25 0 0 1 9 10.5V10h2.25a.75.75 0 0 0 0-1.5H9V5h3.25a.25.25 0 0 1 .25.25v.5a.75.75 0 0 0 1.5 0v-.5A1.75 1.75 0 0 0 12.25 3.5H9v-2h1.25a.75.75 0 0 0 0-1.5h-4Z" />
                    </svg>
                  )}
                </button>
              </>
            }
          >
            <div className="character-analysis-content">
              <div className={`rainbow-text ${isAnalysisCondensedMode ? 'condensed' : 'sparse'}`} style={khmerFontStyle} ref={charAnalysisRef}>
                {clusters.map((cluster, clusterIdx) => {
                  if (cluster.type === 'space') {
                    return (
                      <span key={clusterIdx} className="word-separator">
                        <span className="separator-line" />
                      </span>
                    );
                  }

                  const nonSpaceIdx = getNonSpaceIdx(clusterIdx);
                  const syllableColor = getClusterColor(clusterIdx, nonSpaceIdx);
                  const isClusterHighlighted = activeClusterIdx === clusterIdx;
                  const isSelected = selectedClusterIndices.has(clusterIdx);

                  return (
                    <span
                      key={clusterIdx}
                      ref={(el) => {
                        if (el) clusterRefs.current.set(clusterIdx, el);
                        else clusterRefs.current.delete(clusterIdx);
                      }}
                      className={`cluster-wrapper ${isClusterHighlighted ? 'cluster-highlighted' : ''} ${isSelected ? 'cluster-selected' : ''} ${isSelectionMode ? 'selection-mode' : ''} ${isAnalysisCondensedMode ? 'condensed' : 'sparse'}`}
                      style={{ '--syllable-accent': syllableColor.accent } as React.CSSProperties}
                      onMouseEnter={(e) => !isSelectionMode && handleClusterHover(clusterIdx, null, e.currentTarget)}
                      onMouseLeave={() => !isSelectionMode && handleClusterHover(null, null, null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelectionMode) {
                          handleClusterSelect(clusterIdx);
                        } else if (!(e.target as HTMLElement).closest('.char-component')) {
                          handleClusterClick(clusterIdx, null, 'analysis');
                        }
                      }}
                    >
                      {cluster.components.map((comp, compIdx) => {
                        const isCompHighlighted = isClusterHighlighted && activeCompIdx === compIdx;
                        const compBg = getClusterComponentBgColor(clusterIdx, nonSpaceIdx, comp.type);

                        return (
                          <span
                            key={compIdx}
                            className={`char-component ${isCompHighlighted ? 'comp-highlighted' : ''} ${isAnalysisCondensedMode ? 'condensed' : 'sparse'}`}
                            style={{
                              backgroundColor: compBg,
                              '--syllable-accent': syllableColor.accent,
                            } as React.CSSProperties}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              if (!isSelectionMode) {
                                handleClusterHover(clusterIdx, compIdx, e.currentTarget);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelectionMode) {
                                // In selection mode, clicking any part of syllable selects the whole syllable
                                handleClusterSelect(clusterIdx);
                              } else {
                                handleClusterClick(clusterIdx, compIdx, 'analysis');
                              }
                            }}
                          >
                            {comp.char}
                          </span>
                        );
                      })}
                    </span>
                  );
                })}
              </div>
            </div>
          </CollapsiblePanel>
        )}
      </div>

      {/* Second row: Romanization and Word Boundaries */}
      <div className="panels-row">
        {/* Romanization Panel (collapsible) */}
        <CollapsiblePanel
          title="Romanization"
          badge={settings.pronunciationMode === 'ipa' ? 'ALA-LC' : 'Phonetic'}
          isExpanded={panelStates.romanization}
          onToggle={() => togglePanel('romanization')}
          className="panel-left"
        >
          <RomanizationPanel
            text={inputText}
            clusters={clusters}
            activeClusterIdx={activeClusterIdx}
            onClusterHover={handleClusterHover}
            onClusterClick={handleClusterClick}
            getNonSpaceIdx={getNonSpaceIdx}
          />
        </CollapsiblePanel>

        {/* Word Boundaries Panel */}
        {inputText && (
          <CollapsiblePanel
            title="Word Boundaries"
            isExpanded={panelStates.wordBoundaries}
            onToggle={() => togglePanel('wordBoundaries')}
            className="panel-right"
            actionButton={
              !isEditMode && !isEditingBoundaries ? (
                <button
                  className="panel-action-btn edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingBoundaries(true);
                  }}
                  title="Edit word boundaries"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
                  </svg>
                </button>
              ) : isEditingBoundaries ? (
                <button
                  className="panel-action-btn confirm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingBoundaries(false);
                  }}
                  title="Done editing boundaries"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                </button>
              ) : undefined
            }
          >
            <SpaceEditor
              text={inputText}
              onTextChange={setInputText}
              disabled={isEditMode}
              isEditing={isEditingBoundaries}
            />
          </CollapsiblePanel>
        )}
      </div>

      {/* Dictionary Matches */}
      {inputText && words.some((w) => getDictionaryEntry(w.word)) && (
        <CollapsiblePanel
              title="Dictionary Matches"
              badge={`${words.filter(w => getDictionaryEntry(w.word)).length} words`}
              isExpanded={panelStates.dictionaryMatches}
              onToggle={() => togglePanel('dictionaryMatches')}
            >
              <div className="dictionary-matches">
                {words.map((wordData, idx) => {
                  const entry = getDictionaryEntry(wordData.word);
                  if (!entry) return null;

                  const isUserWord = isUserDefinedWord(wordData.word);

                  // Get romanization based on mode
                  const displayRomanization = showIPA
                    ? (entry.romanized || entry.phonetic?.toLowerCase() || '')
                    : (entry.phonetic || '');

                  return (
                    <div key={idx} className={`dict-entry ${isUserWord ? 'user-defined' : ''}`}>
                      <span className="dict-khmer" style={khmerFontStyle}>
                        {wordData.word}
                      </span>
                      {isUserWord && (
                        <span className="user-badge" title="User-defined word">
                          <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
                            <path d="M8 4a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 018 4z" />
                          </svg>
                        </span>
                      )}
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
            </CollapsiblePanel>
      )}

      {/* Selection Panel - left sidebar for selection tools */}
      <SelectionPanel
        selectedText={selectedText}
        isOpen={showSelectionPanel && isSelectionMode}
        onClose={() => setShowSelectionPanel(false)}
        onWordAdded={handleWordAdded}
      />

      {/* Portal-based Tooltip - renders outside scroll containers */}
      <Tooltip
        triggerRef={tooltipTriggerRef}
        isVisible={tooltipData !== null}
        className={tooltipData?.isClusterOnly ? 'cluster-only' : 'full-tooltip'}
      >
        {tooltipData && (
          <>
            {/* Syllable Header */}
            <div className="tooltip-header-row">
              <span className="tooltip-khmer" style={khmerFontStyle}>{tooltipData.cluster.text}</span>
              <span className={`tooltip-sound ${showIPA ? 'ipa' : 'phonetic'}`}>
                {showIPA ? tooltipData.syllableInfo.romanized : tooltipData.syllableInfo.phonetic}
              </span>
              {tooltipData.syllableInfo.english && (
                <span className="tooltip-meaning">{tooltipData.syllableInfo.english}</span>
              )}
              {!tooltipData.syllableInfo.fromDictionary && !tooltipData.isClusterOnly && (
                <ConfidenceWarning level={tooltipData.syllableInfo.confidence} warnings={tooltipData.syllableInfo.warnings} inline />
              )}
            </div>

            {/* Two Column Layout - only for component-level hover */}
            {!tooltipData.isClusterOnly && tooltipData.comp && (
              <div className="tooltip-columns">
                {/* Word Column */}
                <div className="tooltip-column word-column">
                  <div className="column-header">
                    <span className="column-label">Word</span>
                    {tooltipData.wordLookup && tooltipData.wordInfo ? (
                      <span className="column-khmer" style={khmerFontStyle}>{tooltipData.wordInfo.word}</span>
                    ) : (
                      <span className="column-khmer" style={khmerFontStyle}>{tooltipData.cluster.text}</span>
                    )}
                  </div>
                  {tooltipData.wordLookup ? (
                    <div className="column-body">
                      <div className="column-row">
                        <span className="column-value phonetic">{tooltipData.wordLookup.phonetic}</span>
                      </div>
                      {tooltipData.wordLookup.english ? (
                        <div className="column-row">
                          <span className="column-value english">{tooltipData.wordLookup.english}</span>
                        </div>
                      ) : (
                        <div className="column-row">
                          <span className="column-value no-translation">No translation</span>
                        </div>
                      )}
                      {tooltipData.wordLookup.pos && (
                        <span className="column-pos">{POS_LABELS[tooltipData.wordLookup.pos] || tooltipData.wordLookup.pos}</span>
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
                    <span className="column-label">{TYPE_LABELS[tooltipData.comp.type]}</span>
                    <span className="column-char" style={khmerFontStyle}>{tooltipData.comp.char}</span>
                  </div>
                  {tooltipData.compInfo ? (
                    <div className="column-body">
                      <div className="column-row">
                        <span className="column-value phonetic">
                          {showIPA ? tooltipData.compInfo.romanized : tooltipData.compInfo.phonetic}
                        </span>
                      </div>
                      <div className="column-row">
                        <span className="column-value name">{tooltipData.compInfo.name}</span>
                      </div>
                      {tooltipData.compInfo.description && (
                        <span className="column-desc">{tooltipData.compInfo.description}</span>
                      )}
                    </div>
                  ) : (
                    <div className="column-body">
                      <span className="column-na">—</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Word row for cluster-only tooltip */}
            {tooltipData.isClusterOnly && tooltipData.wordLookup && tooltipData.wordInfo && tooltipData.wordInfo.word !== tooltipData.cluster.text && (
              <div className="tooltip-word-row">
                <span className="word-label">Word:</span>
                <span className="word-khmer" style={khmerFontStyle}>{tooltipData.wordInfo.word}</span>
                <span className="word-meaning">{tooltipData.wordLookup.english}</span>
              </div>
            )}

            {/* Component breakdown */}
            <div className="tooltip-components">
              {tooltipData.cluster.components.map((c, i) => {
                const cBg = getClusterComponentBgColor(tooltipData.clusterIdx, tooltipData.nonSpaceIdx, c.type);
                return (
                  <span
                    key={i}
                    className={`mini-component ${!tooltipData.isClusterOnly && i === activeCompIdx ? 'active' : ''}`}
                    style={{ backgroundColor: cBg }}
                  >
                    {c.char}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

