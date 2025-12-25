import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { khmerFonts, type KhmerFont } from '../utils/fonts';

export type PronunciationMode = 'ipa' | 'phonetic';
export type RomanizationDisplay = 'hover' | 'panel';

interface Settings {
  selectedFont: KhmerFont;
  pronunciationMode: PronunciationMode;
  romanizationDisplay: RomanizationDisplay;
  showRomanizationPanel: boolean;
}

interface SettingsContextType {
  settings: Settings;
  setSelectedFont: (font: KhmerFont) => void;
  setPronunciationMode: (mode: PronunciationMode) => void;
  setRomanizationDisplay: (display: RomanizationDisplay) => void;
  toggleRomanizationPanel: () => void;
}

const defaultFont = khmerFonts.find(f => f.name === 'Noto Sans Khmer') || khmerFonts[0];

const defaultSettings: Settings = {
  selectedFont: defaultFont,
  pronunciationMode: 'phonetic',
  romanizationDisplay: 'hover',
  showRomanizationPanel: true, // Show panel by default
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const setSelectedFont = useCallback((font: KhmerFont) => {
    setSettings(prev => ({ ...prev, selectedFont: font }));
  }, []);

  const setPronunciationMode = useCallback((mode: PronunciationMode) => {
    setSettings(prev => ({ ...prev, pronunciationMode: mode }));
  }, []);

  const setRomanizationDisplay = useCallback((display: RomanizationDisplay) => {
    setSettings(prev => ({ 
      ...prev, 
      romanizationDisplay: display,
      showRomanizationPanel: display === 'panel',
    }));
  }, []);

  const toggleRomanizationPanel = useCallback(() => {
    setSettings(prev => ({ ...prev, showRomanizationPanel: !prev.showRomanizationPanel }));
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      setSelectedFont,
      setPronunciationMode,
      setRomanizationDisplay,
      toggleRomanizationPanel,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

