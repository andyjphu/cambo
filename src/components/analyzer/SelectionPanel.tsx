/**
 * Selection Panel Component
 * =========================
 * 
 * Provides tools for selected Khmer text:
 * - Copy to clipboard in deformatted Unicode
 * - Create new word entry in user dictionary
 * - Export user dictionary
 */

import { useState, useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { 
  addUserWord, 
  exportAsJSON, 
  exportAsCSV,
  getUserDictionaryCount,
  type UserDictionaryEntry 
} from '../../utils/userDictionary';
import { refreshDictionary } from '../../utils/wordSegmentation';
import { parseKhmerText } from '../../utils/khmerParser';
import { romanizeCluster } from '../../utils/alaLcRomanization';
import './SelectionPanel.css';

interface SelectionPanelProps {
  selectedText: string;
  isOpen: boolean;
  onClose: () => void;
  onWordAdded?: (entry: UserDictionaryEntry) => void;
}

type TabType = 'clipboard' | 'dictionary' | 'export';

export function SelectionPanel({ selectedText, isOpen, onClose, onWordAdded }: SelectionPanelProps) {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('clipboard');
  const [copied, setCopied] = useState(false);
  
  // New word form state
  const [english, setEnglish] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [pos, setPos] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };

  // Auto-generate romanization from selected text
  const autoRomanization = useMemo(() => {
    if (!selectedText.trim()) return { romanized: '', phonetic: '' };
    
    try {
      const clusters = parseKhmerText(selectedText);
      const nonSpaceClusters = clusters.filter(c => c.type !== 'space');
      
      if (nonSpaceClusters.length === 0) return { romanized: '', phonetic: '' };
      
      // Romanize each cluster and join
      const parts = nonSpaceClusters.map(cluster => romanizeCluster(cluster.components));
      
      const romanized = parts.map(p => p.romanized).join('-');
      const phonetic = parts.map(p => p.phonetic).join('-');
      
      return { romanized, phonetic };
    } catch (e) {
      console.warn('Failed to auto-romanize:', e);
      return { romanized: '', phonetic: '' };
    }
  }, [selectedText]);

  if (!isOpen) return null;

  const dictCount = getUserDictionaryCount();

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveWord = () => {
    if (!selectedText.trim()) return;
    
    // Use user-provided phonetic or fall back to auto-generated
    const finalPhonetic = phonetic.trim() || autoRomanization.phonetic;
    // Use auto-generated romanized (ALA-LC style)
    const finalRomanized = autoRomanization.romanized;
    
    const entry = addUserWord({
      khmer: selectedText,
      english: english.trim(),
      phonetic: finalPhonetic || undefined,
      romanized: finalRomanized || undefined,
      pos: pos as UserDictionaryEntry['pos'] || undefined,
    });
    
    // Refresh the dictionary cache
    refreshDictionary();
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    
    // Clear form
    setEnglish('');
    setPhonetic('');
    setPos('');
    
    onWordAdded?.(entry);
  };

  const handleExportJSON = () => {
    const json = exportAsJSON();
    downloadFile(json, 'user-dictionary.json', 'application/json');
  };

  const handleExportCSV = () => {
    const csv = exportAsCSV();
    downloadFile(csv, 'user-dictionary.csv', 'text/csv');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="selection-panel">
      <div className="selection-panel-header">
        <h3>Selection Tools</h3>
        <button className="close-btn" onClick={onClose} title="Close">
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
          </svg>
        </button>
      </div>

      {/* Selected text preview */}
      <div className="selected-preview">
        <span className="preview-label">Selected:</span>
        <span className="preview-text" style={khmerFontStyle}>
          {selectedText || '(none)'}
        </span>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'clipboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('clipboard')}
        >
          Clipboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setActiveTab('dictionary')}
        >
          Add Word
        </button>
        <button 
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export ({dictCount})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'clipboard' && (
          <div className="clipboard-tab">
            <div className="plain-text-display">
              <span className="label">Plain text (no formatting):</span>
              <div className="plain-khmer-text" style={khmerFontStyle}>
                {selectedText || '—'}
              </div>
            </div>
            <button 
              className="action-btn primary copy-btn" 
              onClick={handleCopyText}
              disabled={!selectedText}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
              </svg>
              Copy to Clipboard
            </button>
            {copied && <div className="copy-feedback">Copied!</div>}
          </div>
        )}

        {activeTab === 'dictionary' && (
          <div className="dictionary-tab">
            <div className="form-group">
              <label htmlFor="english">English Meaning</label>
              <input
                id="english"
                type="text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="Enter English translation..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="phonetic">Phonetic (optional)</label>
              <input
                id="phonetic"
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder={autoRomanization.phonetic || 'e.g., SUOS-DAY'}
              />
              {autoRomanization.phonetic && !phonetic && (
                <span className="auto-hint">Auto: {autoRomanization.phonetic}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="pos">Part of Speech</label>
              <select
                id="pos"
                value={pos}
                onChange={(e) => setPos(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adj">Adjective</option>
                <option value="adv">Adverb</option>
                <option value="pron">Pronoun</option>
                <option value="prep">Preposition</option>
                <option value="conj">Conjunction</option>
                <option value="part">Particle</option>
                <option value="num">Number</option>
              </select>
            </div>
            <button 
              className="action-btn primary save-btn"
              onClick={handleSaveWord}
              disabled={!selectedText.trim() || !english.trim()}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.22-4.78 4.78-1.78-1.78a.75.75 0 0 0-1.06 1.06l2.25 2.25c.141.14.331.22.53.22a.75.75 0 0 0 .53-.22l5.25-5.25a.75.75 0 0 0-1.06-1.06Z"/>
              </svg>
              Save to Dictionary
            </button>
            {saveSuccess && <div className="save-feedback">Saved!</div>}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="export-tab">
            <p className="export-info">
              Export your {dictCount} custom word{dictCount !== 1 ? 's' : ''} for backup or integration.
            </p>
            <div className="export-actions">
              <button 
                className="action-btn" 
                onClick={handleExportJSON}
                disabled={dictCount === 0}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                  <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
                  <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
                </svg>
                Export JSON
              </button>
              <button 
                className="action-btn" 
                onClick={handleExportCSV}
                disabled={dictCount === 0}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                  <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
                  <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
                </svg>
                Export CSV
              </button>
            </div>
            <p className="export-hint">
              JSON format is recommended for importing back. CSV is for spreadsheet editing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

