import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { khmerFonts, loadFont, type KhmerFont } from '../utils/fonts';

export type PronunciationMode = 'ipa' | 'phonetic';

interface Settings {
  selectedFont: KhmerFont;
  pronunciationMode: PronunciationMode;
  showHoverTooltips: boolean;      // Independent toggle for hover tooltips
  showRomanizationPanel: boolean;  // Independent toggle for romanization panel
}

interface SettingsContextType {
  settings: Settings;
  setSelectedFont: (font: KhmerFont) => void;
  setPronunciationMode: (mode: PronunciationMode) => void;
  setShowHoverTooltips: (show: boolean) => void;
  setShowRomanizationPanel: (show: boolean) => void;
}

const STORAGE_KEY = 'cambo-settings';

const defaultFont = khmerFonts.find(f => f.name === 'Noto Sans Khmer') || khmerFonts[0];

const defaultSettings: Settings = {
  selectedFont: defaultFont,
  pronunciationMode: 'phonetic',
  showHoverTooltips: true,        // Hover tooltips on by default
  showRomanizationPanel: true,    // Romanization panel on by default
};

// Load settings from localStorage
function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Restore font from stored name
      const font = khmerFonts.find(f => f.name === parsed.selectedFontName) || defaultFont;
      return {
        selectedFont: font,
        pronunciationMode: parsed.pronunciationMode || defaultSettings.pronunciationMode,
        showHoverTooltips: parsed.showHoverTooltips ?? defaultSettings.showHoverTooltips,
        showRomanizationPanel: parsed.showRomanizationPanel ?? defaultSettings.showRomanizationPanel,
      };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      selectedFontName: settings.selectedFont.name,
      pronunciationMode: settings.pronunciationMode,
      showHoverTooltips: settings.showHoverTooltips,
      showRomanizationPanel: settings.showRomanizationPanel,
    }));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Load the selected font CSS on mount and when font changes
  useEffect(() => {
    const font = settings.selectedFont;
    if (font && font.googleFont) {
      loadFont(font).catch(err => {
        console.warn('Failed to load font on startup:', err);
      });
    }
  }, [settings.selectedFont]);

  // Save to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSelectedFont = useCallback((font: KhmerFont) => {
    setSettings(prev => ({ ...prev, selectedFont: font }));
  }, []);

  const setPronunciationMode = useCallback((mode: PronunciationMode) => {
    setSettings(prev => ({ ...prev, pronunciationMode: mode }));
  }, []);

  const setShowHoverTooltips = useCallback((show: boolean) => {
    setSettings(prev => ({ ...prev, showHoverTooltips: show }));
  }, []);

  const setShowRomanizationPanel = useCallback((show: boolean) => {
    setSettings(prev => ({ ...prev, showRomanizationPanel: show }));
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      setSelectedFont,
      setPronunciationMode,
      setShowHoverTooltips,
      setShowRomanizationPanel,
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
