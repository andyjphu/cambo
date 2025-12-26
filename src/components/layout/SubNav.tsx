import { useState, useRef, useEffect } from 'react';
import { BsGear, BsChevronDown } from 'react-icons/bs';
import { useSettings } from '../../context/SettingsContext';
import { getFontsByStyle, styleLabels, loadFont, isFontLoaded, type KhmerFont } from '../../utils/fonts';
import './SubNav.css';

export function SubNav() {
  const { settings, setSelectedFont, setShowHoverTooltips, setPronunciationMode, setShowRomanizationPanel } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFontSectionOpen, setIsFontSectionOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const fontsByStyle = getFontsByStyle();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };

  return (
    <div className="subnav">
      <div className="subnav-content">
        {/* Settings Dropdown - now contains everything */}
        <div className="subnav-dropdown" ref={settingsRef}>
          <button 
            className="subnav-btn"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <BsGear className="subnav-btn-icon" size={16} />
            <span className="subnav-btn-label">Settings</span>
            <BsChevronDown className={`subnav-btn-caret ${isSettingsOpen ? 'open' : ''}`} size={14} />
          </button>
          
          {isSettingsOpen && (
            <div className="dropdown-panel settings-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-title">Display Settings</span>
              </div>
              
              {/* Font Selector Section */}
              <div className="settings-section">
                <button 
                  className="settings-section-header"
                  onClick={() => setIsFontSectionOpen(!isFontSectionOpen)}
                >
                  <label className="settings-label">Font</label>
                  <div className="font-current">
                    <span className="font-preview" style={khmerFontStyle}>ក ខ</span>
                    <span className="font-name">{settings.selectedFont.name.replace('Noto ', '').replace(' Khmer', '')}</span>
                    <BsChevronDown className={`section-caret ${isFontSectionOpen ? 'open' : ''}`} size={14} />
                  </div>
                </button>
                {isFontSectionOpen && (
                  <div className="font-groups">
                    {Object.entries(fontsByStyle).map(([style, fonts]) => (
                      <div key={style} className="font-group">
                        <span className="font-group-label">{styleLabels[style]}</span>
                        <div className="font-options">
                          {fonts.map((font) => (
                            <FontOption
                              key={font.name}
                              font={font}
                              isSelected={settings.selectedFont.name === font.name}
                              onSelect={() => {
                                setSelectedFont(font);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Pronunciation Format */}
              <div className="settings-section">
                <label className="settings-label">Pronunciation Format</label>
                <div className="settings-options">
                  <button
                    className={`settings-option ${settings.pronunciationMode === 'phonetic' ? 'selected' : ''}`}
                    onClick={() => setPronunciationMode('phonetic')}
                  >
                    <span className="option-title">Phonetic</span>
                    <span className="option-desc">English-friendly (SOHM)</span>
                  </button>
                  <button
                    className={`settings-option ${settings.pronunciationMode === 'ipa' ? 'selected' : ''}`}
                    onClick={() => setPronunciationMode('ipa')}
                  >
                    <span className="option-title">IPA</span>
                    <span className="option-desc">Linguistic (suă-stei)</span>
                  </button>
                </div>
              </div>
              
              {/* Display Toggles - Now independent */}
              <div className="settings-section">
                <label className="settings-label">Display Options</label>
                <div className="settings-toggles">
                  <label className="toggle-row">
                    <span className="toggle-label">Show hover tooltips</span>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox"
                      checked={settings.showHoverTooltips}
                      onChange={(e) => setShowHoverTooltips(e.target.checked)}
                    />
                    <span className="toggle-switch" />
                  </label>
                  <label className="toggle-row">
                    <span className="toggle-label">Show romanization panel</span>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox"
                      checked={settings.showRomanizationPanel}
                      onChange={(e) => setShowRomanizationPanel(e.target.checked)}
                    />
                    <span className="toggle-switch" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="subnav-spacer" />
      </div>
    </div>
  );
}

// Font option component with lazy loading
interface FontOptionProps {
  font: KhmerFont;
  isSelected: boolean;
  onSelect: () => void;
}

function FontOption({ font, isSelected, onSelect }: FontOptionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(isFontLoaded(font));
  
  const handleClick = async () => {
    if (!isLoaded && !isLoading) {
      setIsLoading(true);
      try {
        await loadFont(font);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load font:', err);
      } finally {
        setIsLoading(false);
      }
    }
    onSelect();
  };
  
  return (
    <button
      className={`font-option ${isSelected ? 'selected' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={handleClick}
      title={font.description}
      style={{ fontFamily: isLoaded ? `'${font.family}', sans-serif` : 'inherit' }}
    >
      {font.name.replace('Noto ', '').replace(' Khmer', '')}
      {isLoading && <span className="font-loading-dot" />}
    </button>
  );
}
