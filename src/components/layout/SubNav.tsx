import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { khmerFonts, getFontsByStyle, styleLabels, loadFont, isFontLoaded, type KhmerFont } from '../../utils/fonts';
import './SubNav.css';

export function SubNav() {
  const { settings, setSelectedFont, setRomanizationDisplay, setPronunciationMode, toggleRomanizationPanel } = useSettings();
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
            <svg className="subnav-btn-icon" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M7.429 1.525a6.593 6.593 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.195.046.219.31.41.641.573.989.014.031.022.11-.059.19l-.815.806c-.41.406-.548.975-.514 1.506a3.77 3.77 0 010 .582c-.034.531.104 1.1.514 1.506l.815.806c.08.08.073.159.059.19a6.57 6.57 0 01-.573.99c-.02.029-.086.074-.195.045l-1.103-.303c-.559-.153-1.112-.008-1.529.27-.16.107-.327.204-.5.29-.449.222-.851.628-.998 1.189l-.289 1.105c-.029.11-.101.143-.137.146a6.593 6.593 0 01-1.142 0c-.036-.003-.108-.037-.137-.146l-.289-1.105c-.147-.56-.55-.967-.997-1.189a4.502 4.502 0 01-.501-.29c-.417-.278-.97-.423-1.53-.27l-1.102.303c-.11.03-.175-.016-.195-.046a6.57 6.57 0 01-.573-.989c-.014-.031-.022-.11.059-.19l.815-.806c.41-.406.548-.975.514-1.506a3.77 3.77 0 010-.582c.034-.531-.104-1.1-.514-1.506l-.815-.806c-.08-.08-.073-.159-.059-.19.162-.348.354-.68.573-.99.02-.029.086-.074.195-.045l1.103.303c.559.153 1.112.008 1.529-.27.16-.107.327-.204.5-.29.449-.222.851-.628.998-1.189l.289-1.105c.029-.11.101-.143.137-.146zM8 0c-.236 0-.47.01-.701.03-.743.065-1.29.615-1.458 1.261l-.29 1.106c-.017.066-.078.158-.211.224a5.994 5.994 0 00-.668.386c-.123.082-.233.09-.3.071L3.27 2.776c-.644-.177-1.392.02-1.82.63a7.977 7.977 0 00-.704 1.217c-.315.675-.111 1.422.363 1.891l.815.806c.05.048.098.147.088.294a5.28 5.28 0 000 .772c.01.147-.038.246-.088.294l-.815.806c-.474.469-.678 1.216-.363 1.891.2.428.436.835.704 1.218.428.609 1.176.806 1.82.63l1.103-.303c.066-.019.176-.011.299.071.213.143.436.272.668.386.133.066.194.158.212.224l.289 1.106c.169.646.715 1.196 1.458 1.26a8.094 8.094 0 001.402 0c.743-.064 1.29-.614 1.458-1.26l.29-1.106c.017-.066.078-.158.211-.224a5.98 5.98 0 00.668-.386c.123-.082.233-.09.3-.071l1.102.302c.644.177 1.392-.02 1.82-.63.268-.382.505-.789.704-1.217.315-.675.111-1.422-.364-1.891l-.814-.806c-.05-.048-.098-.147-.088-.294a5.28 5.28 0 000-.772c-.01-.147.039-.246.088-.294l.814-.806c.475-.469.679-1.216.364-1.891a7.977 7.977 0 00-.704-1.218c-.428-.609-1.176-.806-1.82-.63l-1.103.303c-.066.019-.176.011-.299-.071a5.993 5.993 0 00-.668-.386c-.133-.066-.194-.158-.212-.224L10.16 1.29C9.99.645 9.444.095 8.701.031A8.094 8.094 0 008 0zm0 11a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>
            <span className="subnav-btn-label">Settings</span>
            <svg className="subnav-btn-caret" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"/>
            </svg>
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
                    <svg className={`section-caret ${isFontSectionOpen ? 'open' : ''}`} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"/>
                    </svg>
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
                    <span className="option-desc">Linguistic (/soːm/)</span>
                  </button>
                </div>
              </div>
              
              {/* Display Toggles */}
              <div className="settings-section">
                <label className="settings-label">Display Options</label>
                <div className="settings-toggles">
                  <label className="toggle-row">
                    <span className="toggle-label">Show hover tooltips</span>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox"
                      checked={settings.romanizationDisplay === 'hover'}
                      onChange={(e) => setRomanizationDisplay(e.target.checked ? 'hover' : 'panel')}
                    />
                    <span className="toggle-switch" />
                  </label>
                  <label className="toggle-row">
                    <span className="toggle-label">Show romanization panel</span>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox"
                      checked={settings.showRomanizationPanel}
                      onChange={toggleRomanizationPanel}
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
