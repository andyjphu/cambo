import { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { coreDictionary, type DictionaryEntry } from '../utils/dictionaryCore';
import { 
  getUserDictionary, 
  removeUserWord, 
  exportAsJSON, 
  exportAsCSV,
  importFromJSON,
  clearUserDictionary,
  type UserDictionaryEntry 
} from '../utils/userDictionary';
import { refreshDictionary } from '../utils/wordSegmentation';
import './DictionaryPage.css';

type TabType = 'user' | 'core';

export function DictionaryPage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [userDictionary, setUserDictionary] = useState<UserDictionaryEntry[]>(getUserDictionary());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };

  // Refresh user dictionary from localStorage
  const refreshUserDict = () => {
    setUserDictionary(getUserDictionary());
  };

  // Filter core dictionary
  const filteredCore = useMemo(() => {
    if (!searchQuery.trim()) return coreDictionary;
    const query = searchQuery.toLowerCase();
    return coreDictionary.filter(entry => 
      entry.khmer.includes(searchQuery) ||
      entry.english?.toLowerCase().includes(query) ||
      entry.phonetic?.toLowerCase().includes(query) ||
      entry.romanized?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter user dictionary
  const filteredUser = useMemo(() => {
    if (!searchQuery.trim()) return userDictionary;
    const query = searchQuery.toLowerCase();
    return userDictionary.filter(entry => 
      entry.khmer.includes(searchQuery) ||
      entry.english?.toLowerCase().includes(query) ||
      entry.phonetic?.toLowerCase().includes(query) ||
      entry.romanized?.toLowerCase().includes(query)
    );
  }, [searchQuery, userDictionary]);

  // Check if a word exists in core dictionary
  const isInCoreDictionary = (khmer: string): boolean => {
    return coreDictionary.some(e => e.khmer === khmer);
  };

  // Handle delete user word
  const handleDeleteWord = (khmer: string) => {
    removeUserWord(khmer);
    refreshUserDict();
    refreshDictionary();
  };

  // Handle export
  const handleExport = (format: 'json' | 'csv') => {
    const content = format === 'json' ? exportAsJSON() : exportAsCSV();
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-dictionary.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = () => {
    try {
      const count = importFromJSON(importText);
      refreshUserDict();
      refreshDictionary();
      setShowImportModal(false);
      setImportText('');
      alert(`Successfully imported ${count} new word(s)`);
    } catch (e) {
      alert('Failed to import: Invalid JSON format');
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    clearUserDictionary();
    refreshUserDict();
    refreshDictionary();
    setShowClearConfirm(false);
  };

  return (
    <div className="dictionary-page">
      <div className="dictionary-header">
        <h1 className="dictionary-title">Dictionary</h1>
        <p className="dictionary-subtitle">
          View and manage your word collections
        </p>
      </div>

      {/* Tabs */}
      <div className="dictionary-tabs">
        <button
          className={`dict-tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
            <path d="M8 4a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 018 4z"/>
          </svg>
          My Words
          <span className="tab-count">{userDictionary.length}</span>
        </button>
        <button
          className={`dict-tab ${activeTab === 'core' ? 'active' : ''}`}
          onClick={() => setActiveTab('core')}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M0 1.75A.75.75 0 01.75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0111.006 1h4.245a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-4.507a2.25 2.25 0 00-1.591.659l-.622.621a.75.75 0 01-1.06 0l-.622-.621A2.25 2.25 0 005.258 13H.75a.75.75 0 01-.75-.75V1.75zm7.251 10.324l.004-5.073-.002-2.253A2.25 2.25 0 005.003 2.5H1.5v9h3.757a3.75 3.75 0 011.994.574zM8.755 4.75l-.004 7.322a3.752 3.752 0 011.992-.572H14.5v-9h-3.495a2.25 2.25 0 00-2.25 2.25z"/>
          </svg>
          Core Dictionary
          <span className="tab-count">{coreDictionary.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="dictionary-search">
        <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.68 11.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 01-1.06 1.06l-3.04-3.04zM11 6.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by Khmer, English, or pronunciation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
            </svg>
          </button>
        )}
      </div>

      {/* User Dictionary Actions */}
      {activeTab === 'user' && (
        <div className="dictionary-actions">
          <button className="action-btn" onClick={() => handleExport('json')}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z"/>
              <path d="M7.25 7.689V2a.75.75 0 011.5 0v5.689l1.97-1.969a.749.749 0 111.06 1.06l-3.25 3.25a.749.749 0 01-1.06 0L4.22 6.78a.749.749 0 111.06-1.06l1.97 1.969z"/>
            </svg>
            Export JSON
          </button>
          <button className="action-btn" onClick={() => handleExport('csv')}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z"/>
              <path d="M7.25 7.689V2a.75.75 0 011.5 0v5.689l1.97-1.969a.749.749 0 111.06 1.06l-3.25 3.25a.749.749 0 01-1.06 0L4.22 6.78a.749.749 0 111.06-1.06l1.97 1.969z"/>
            </svg>
            Export CSV
          </button>
          <button className="action-btn" onClick={() => setShowImportModal(true)}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z"/>
              <path d="M11.78 4.72a.749.749 0 10-1.06-1.06L8.75 5.629V.75a.75.75 0 00-1.5 0v4.879L5.28 3.66a.749.749 0 10-1.06 1.06l3.25 3.25a.749.749 0 001.06 0l3.25-3.25z"/>
            </svg>
            Import
          </button>
          {userDictionary.length > 0 && (
            <button className="action-btn danger" onClick={() => setShowClearConfirm(true)}>
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15zM6.5 1.75V3h3V1.75a.25.25 0 00-.25-.25h-2.5a.25.25 0 00-.25.25z"/>
              </svg>
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Dictionary Content */}
      <div className="dictionary-content">
        {activeTab === 'user' ? (
          filteredUser.length > 0 ? (
            <div className="word-list">
              {filteredUser.map((entry) => (
                <div key={entry.khmer} className="word-card user-word">
                  <div className="word-main">
                    <span className="word-khmer" style={khmerFontStyle}>{entry.khmer}</span>
                    {isInCoreDictionary(entry.khmer) && (
                      <span className="override-badge" title="Overrides core dictionary">
                        override
                      </span>
                    )}
                  </div>
                  <div className="word-details">
                    {entry.english && <span className="word-english">{entry.english}</span>}
                    {entry.phonetic && <span className="word-phonetic">/{entry.phonetic}/</span>}
                    {entry.pos && <span className="word-pos">{entry.pos}</span>}
                  </div>
                  <div className="word-meta">
                    <span className="word-date">
                      Added {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteWord(entry.khmer)}
                      title="Delete word"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                        <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 16 16" fill="currentColor" width="48" height="48">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
                <path d="M8 4a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 018 4z"/>
              </svg>
              <h3>No custom words yet</h3>
              <p>Add words from the Analyze page using selection mode</p>
            </div>
          )
        ) : (
          filteredCore.length > 0 ? (
            <div className="word-list">
              {filteredCore.map((entry) => (
                <div key={entry.khmer} className="word-card core-word">
                  <div className="word-main">
                    <span className="word-khmer" style={khmerFontStyle}>{entry.khmer}</span>
                  </div>
                  <div className="word-details">
                    {entry.english && <span className="word-english">{entry.english}</span>}
                    {entry.phonetic && <span className="word-phonetic">/{entry.phonetic}/</span>}
                    {entry.romanized && <span className="word-romanized">[{entry.romanized}]</span>}
                    {entry.pos && <span className="word-pos">{entry.pos}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No matching words found</p>
            </div>
          )
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Import Dictionary</h3>
            <p>Paste JSON data exported from another session:</p>
            <textarea
              className="import-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"khmer": "សួស្តី", "english": "hello", ...}]'
            />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={handleImport} disabled={!importText.trim()}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Clear All Words?</h3>
            <p>This will permanently delete all {userDictionary.length} words from your personal dictionary. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="modal-btn danger" onClick={handleClearAll}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

