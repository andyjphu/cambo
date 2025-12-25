import { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { searchByPhonetic, searchByEnglish, type DictionaryEntry } from '../utils/dictionaryCore';
import './LookupPage.css';

type SearchMode = 'phonetic' | 'english';

export function LookupPage() {
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('phonetic');
  
  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };
  
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    if (searchMode === 'phonetic') {
      return searchByPhonetic(query);
    } else {
      return searchByEnglish(query);
    }
  }, [query, searchMode]);
  
  return (
    <div className="lookup-page">
      <div className="lookup-header">
        <h1 className="lookup-title">Phonetic Lookup</h1>
        <p className="lookup-subtitle">
          Search for Khmer words by how they sound or their English meaning
        </p>
      </div>
      
      {/* Search Mode Toggle */}
      <div className="search-mode-toggle">
        <button
          className={`mode-btn ${searchMode === 'phonetic' ? 'active' : ''}`}
          onClick={() => setSearchMode('phonetic')}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8.156 1.835a1.25 1.25 0 00-2.312 0l-1.54 3.12-3.445.5a1.25 1.25 0 00-.693 2.132l2.493 2.431-.588 3.43a1.25 1.25 0 001.816 1.317L8 12.68l3.113 1.635a1.25 1.25 0 001.816-1.317l-.588-3.43 2.493-2.431a1.25 1.25 0 00-.693-2.132l-3.445-.5-1.54-3.12z"/>
          </svg>
          By Sound
        </button>
        <button
          className={`mode-btn ${searchMode === 'english' ? 'active' : ''}`}
          onClick={() => setSearchMode('english')}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M0 4.5A1.5 1.5 0 011.5 3h13A1.5 1.5 0 0116 4.5v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 010 11.5v-7zM1.5 4a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-13z"/>
            <path d="M3 6.5a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z"/>
          </svg>
          By Meaning
        </button>
      </div>
      
      {/* Search Input */}
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={searchMode === 'phonetic' 
              ? "Type how it sounds (e.g., SOHM, knyom, toh)..." 
              : "Type English meaning (e.g., hello, water, go)..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              className="clear-btn"
              onClick={() => setQuery('')}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
              </svg>
            </button>
          )}
        </div>
        <p className="search-hint">
          {searchMode === 'phonetic' 
            ? "Fuzzy matching enabled - spelling doesn't need to be exact"
            : "Search by English translation"
          }
        </p>
      </div>
      
      {/* Results */}
      <div className="lookup-results">
        {query.length < 2 && (
          <div className="results-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p>Type at least 2 characters to search</p>
          </div>
        )}
        
        {query.length >= 2 && results.length === 0 && (
          <div className="results-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p>No matches found for "{query}"</p>
            <p className="empty-suggestion">Try different spelling or simpler terms</p>
          </div>
        )}
        
        {results.length > 0 && (
          <>
            <div className="results-header">
              <span className="results-count">{results.length} match{results.length !== 1 ? 'es' : ''}</span>
              <span className="results-mode">
                {searchMode === 'phonetic' ? 'by sound' : 'by meaning'}
              </span>
            </div>
            <div className="results-list">
              {results.map((entry, idx) => (
                <ResultCard 
                  key={idx} 
                  entry={entry} 
                  khmerFontStyle={khmerFontStyle}
                  highlightMode={searchMode}
                  query={query}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  entry: DictionaryEntry;
  khmerFontStyle: React.CSSProperties;
  highlightMode: SearchMode;
  query: string;
}

function ResultCard({ entry, khmerFontStyle, highlightMode, query }: ResultCardProps) {
  return (
    <div className="result-card">
      <div className="result-khmer" style={khmerFontStyle}>
        {entry.khmer}
      </div>
      <div className="result-details">
        <div className="result-phonetic">
          {highlightMode === 'phonetic' ? (
            <HighlightMatch text={entry.phonetic || ''} query={query} />
          ) : (
            entry.phonetic
          )}
        </div>
        <div className="result-english">
          {highlightMode === 'english' ? (
            <HighlightMatch text={entry.english} query={query} />
          ) : (
            entry.english
          )}
        </div>
      </div>
      {entry.pos && (
        <div className="result-pos">{entry.pos}</div>
      )}
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().replace(/[-\s]/g, '');
  
  // Simple highlight - find best match position
  const idx = normalizedText.replace(/[-\s]/g, '').indexOf(normalizedQuery);
  
  if (idx === -1) {
    return <>{text}</>;
  }
  
  // Rough approximation of highlight position
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  
  return (
    <>
      {before}
      <mark className="highlight">{match}</mark>
      {after}
    </>
  );
}

