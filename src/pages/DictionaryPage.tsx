import { useState, useMemo } from 'react';
import { BsPlusCircle, BsBook, BsSearch, BsX, BsDownload, BsUpload, BsTrash } from 'react-icons/bs';
import { useSettings } from '../context/SettingsContext';
import { coreDictionary } from '../utils/dictionaryCore';
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
          <BsPlusCircle size={14} />
          My Words
          <span className="tab-count">{userDictionary.length}</span>
        </button>
        <button
          className={`dict-tab ${activeTab === 'core' ? 'active' : ''}`}
          onClick={() => setActiveTab('core')}
        >
          <BsBook size={14} />
          Core Dictionary
          <span className="tab-count">{coreDictionary.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="dictionary-search">
        <BsSearch className="search-icon" size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by Khmer, English, or pronunciation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <BsX size={14} />
          </button>
        )}
      </div>

      {/* User Dictionary Actions */}
      {activeTab === 'user' && (
        <div className="dictionary-actions">
          <button className="action-btn" onClick={() => handleExport('json')}>
            <BsDownload size={14} />
            Export JSON
          </button>
          <button className="action-btn" onClick={() => handleExport('csv')}>
            <BsDownload size={14} />
            Export CSV
          </button>
          <button className="action-btn" onClick={() => setShowImportModal(true)}>
            <BsUpload size={14} />
            Import
          </button>
          {userDictionary.length > 0 && (
            <button className="action-btn danger" onClick={() => setShowClearConfirm(true)}>
              <BsTrash size={14} />
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
                    {entry.romanized && <span className="word-romanized">[{entry.romanized}]</span>}
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
                      <BsX size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BsPlusCircle size={48} />
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

