import { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { searchByPhonetic, searchByEnglish, type DictionaryEntry } from '../utils/dictionaryCore';
import { BsStar, BsBook, BsSearch, BsX, BsQuestionCircle } from 'react-icons/bs';
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
          <BsStar size={14} />
          By Sound
        </button>
        <button
          className={`mode-btn ${searchMode === 'english' ? 'active' : ''}`}
          onClick={() => setSearchMode('english')}
        >
          <BsBook size={14} />
          By Meaning
        </button>
      </div>
      
      {/* Search Input */}
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <BsSearch className="search-icon" size={16} />
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
              <BsX size={14} />
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
              <BsSearch size={48} />
            </div>
            <p>Type at least 2 characters to search</p>
          </div>
        )}
        
        {query.length >= 2 && results.length === 0 && (
          <div className="results-empty">
            <div className="empty-icon">
              <BsQuestionCircle size={48} />
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

