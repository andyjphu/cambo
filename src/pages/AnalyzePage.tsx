import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { parseKhmerText, type KhmerCluster, type KhmerCharType } from '../utils/khmerParser';
import { romanizeCluster, getCharRomanization } from '../utils/alaLcRomanization';
import { lookupKhmer } from '../utils/dictionaryCore';
import { segmentText, segmentedToText, refreshDictionary } from '../utils/wordSegmentation';
import { getSyllableColor, getComponentBgColor, type SyllableColor } from '../utils/colors';
import { RomanizationPanel } from '../components/analyzer/RomanizationPanel';
import { ConfidenceWarning } from '../components/analyzer/ConfidenceWarning';
import { SpaceEditor } from '../components/analyzer/SpaceEditor';
import { SelectionPanel } from '../components/analyzer/SelectionPanel';
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
  wordBoundaries: boolean;
  romanization: boolean;
}

const DEFAULT_PANEL_STATES: PanelStates = {
  wordBoundaries: true,
  romanization: true,
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

  // Selection mode for multi-select and dictionary operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClusterIndices, setSelectedClusterIndices] = useState<Set<number>>(new Set());
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);

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
  const handleClusterHover = useCallback((clusterIdx: number | null, compIdx: number | null = null) => {
    setHoveredClusterIdx(clusterIdx);
    setHoveredCompIdx(compIdx);
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
          const dictEntry = lookupKhmer(currentWord);
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
      const dictEntry = lookupKhmer(currentWord);
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
                onClick={handleConfirmText}
                title="Confirm and auto-segment text"
                disabled={!inputText.trim()}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
              </button>
            ) : (
              <button
                className="mode-toggle-btn edit-btn"
                onClick={() => setIsEditMode(true)}
                title="Edit text"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
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
                // Use same color source as Character Analysis for visual consistency
                // Matching between panels is done via clusterIdx, not colors
                const syllableColor = getClusterColor(clusterIdx, nonSpaceIdx);
                const isHighlighted = activeClusterIdx === clusterIdx;

                return (
                  <span
                    key={clusterIdx}
                    ref={(el) => {
                      if (el) inputClusterRefs.current.set(clusterIdx, el);
                      else inputClusterRefs.current.delete(clusterIdx);
                    }}
                    className={`input-cluster ${isHighlighted ? 'highlighted' : ''}`}
                    style={{
                      '--syllable-accent': syllableColor.accent,
                      '--syllable-bg': syllableColor.bgMedium,
                    } as React.CSSProperties}
                    onMouseEnter={() => handleClusterHover(clusterIdx)}
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
              <span className="placeholder">Click to add text...</span>
            )}
            <button
              className="edit-overlay-btn"
              onClick={() => setIsEditMode(true)}
              title="Edit text"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Space Editor - for manual word boundary editing (collapsible) */}
      {inputText && (
        <section className={`collapsible-panel ${panelStates.wordBoundaries ? 'expanded' : 'collapsed'}`}>
          <button
            className="panel-header-btn"
            onClick={() => togglePanel('wordBoundaries')}
            aria-expanded={panelStates.wordBoundaries}
          >
            <span className="panel-title">Word Boundaries</span>
            <svg
              className={`collapse-icon ${panelStates.wordBoundaries ? 'expanded' : ''}`}
              viewBox="0 0 16 16"
              fill="currentColor"
              width="14"
              height="14"
            >
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
          {panelStates.wordBoundaries && (
            <div className="panel-content-wrapper">
              <SpaceEditor
                text={inputText}
                onTextChange={setInputText}
                disabled={isEditMode}
              />
            </div>
          )}
        </section>
      )}

      {/* Romanization Panel (collapsible) */}
      <section className={`collapsible-panel ${panelStates.romanization ? 'expanded' : 'collapsed'}`}>
        <button
          className="panel-header-btn"
          onClick={() => togglePanel('romanization')}
          aria-expanded={panelStates.romanization}
        >
          <div className="panel-title-group">
            <span className="panel-title">Romanization</span>
            <span className="panel-mode-badge">{settings.pronunciationMode === 'ipa' ? 'ALA-LC' : 'Phonetic'}</span>
          </div>
          <svg
            className={`collapse-icon ${panelStates.romanization ? 'expanded' : ''}`}
            viewBox="0 0 16 16"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
        {panelStates.romanization && (
          <div className="panel-content-wrapper">
            <RomanizationPanel
              text={inputText}
              clusters={clusters}
              activeClusterIdx={activeClusterIdx}
              onClusterHover={handleClusterHover}
              onClusterClick={handleClusterClick}
              getNonSpaceIdx={getNonSpaceIdx}
            />
          </div>
        )}
      </section>

      {inputText && (
        <>
          {/* Character Analysis */}
          <section className="analysis-section">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Character Analysis</h2>
                <p className="section-subtitle">
                  {isSelectionMode
                    ? 'Click syllables to select, then use the panel to copy or add to dictionary'
                    : !isEditMode
                      ? 'Hover components for syllable, word & character details'
                      : 'Each syllable has a unique color'}
                </p>
              </div>
              <button
                className={`selection-mode-btn ${isSelectionMode ? 'active' : ''}`}
                onClick={toggleSelectionMode}
                title={isSelectionMode ? 'Exit selection mode' : 'Enter selection mode'}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                  <path d="M5.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm5.25.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" />
                  <path d="M6.25 0a.75.75 0 0 0 0 1.5H7.5v2H3.75A1.75 1.75 0 0 0 2 5.25v.5a.75.75 0 0 0 1.5 0v-.5a.25.25 0 0 1 .25-.25H7.5v3.5H5.75a.75.75 0 0 0 0 1.5H7.5v.5c0 .69.28 1.315.732 1.768l1.5 1.5a.75.75 0 0 0 1.06-1.06l-1.5-1.5A.25.25 0 0 1 9 10.5V10h2.25a.75.75 0 0 0 0-1.5H9V5h3.25a.25.25 0 0 1 .25.25v.5a.75.75 0 0 0 1.5 0v-.5A1.75 1.75 0 0 0 12.25 3.5H9v-2h1.25a.75.75 0 0 0 0-1.5h-4Z" />
                </svg>
                {isSelectionMode ? 'Done' : 'Select'}
              </button>
            </div>
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
                const syllableColor = getClusterColor(clusterIdx, nonSpaceIdx);
                const isClusterHighlighted = activeClusterIdx === clusterIdx;
                const syllableInfo = getClusterInfo(cluster);

                // Find the word this cluster belongs to
                const wordInfo = words.find(w => {
                  const clusterInWord = w.startIdx <= clusterIdx && clusterIdx < w.startIdx + w.clusters.length;
                  return clusterInWord;
                });
                const wordLookup = wordInfo ? lookupKhmer(wordInfo.word) : null;

                const isSelected = selectedClusterIndices.has(clusterIdx);

                return (
                  <span
                    key={clusterIdx}
                    ref={(el) => {
                      if (el) clusterRefs.current.set(clusterIdx, el);
                      else clusterRefs.current.delete(clusterIdx);
                    }}
                    className={`cluster-wrapper ${isClusterHighlighted ? 'cluster-highlighted' : ''} ${isSelected ? 'cluster-selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
                    style={{ '--syllable-accent': syllableColor.accent } as React.CSSProperties}
                    onMouseEnter={() => !isSelectionMode && handleClusterHover(clusterIdx)}
                    onMouseLeave={() => !isSelectionMode && handleClusterHover(null)}
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
                      const compInfo = getComponentInfo(comp.char, comp.type);
                      const compBg = getClusterComponentBgColor(clusterIdx, nonSpaceIdx, comp.type);

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
                            if (!isSelectionMode) {
                              handleClusterHover(clusterIdx, compIdx);
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
                                      {wordLookup.english ? (
                                        <div className="column-row">
                                          <span className="column-value english">{wordLookup.english}</span>
                                        </div>
                                      ) : (
                                        <div className="column-row">
                                          <span className="column-value no-translation">No translation</span>
                                        </div>
                                      )}
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
                                  const cBg = getClusterComponentBgColor(clusterIdx, nonSpaceIdx, c.type);
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
                            const cBg = getClusterComponentBgColor(clusterIdx, nonSpaceIdx, c.type);
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

      {/* Selection Panel - left sidebar for selection tools */}
      <SelectionPanel
        selectedText={selectedText}
        isOpen={showSelectionPanel && isSelectionMode}
        onClose={() => setShowSelectionPanel(false)}
        onWordAdded={handleWordAdded}
      />
    </div>
  );
}

