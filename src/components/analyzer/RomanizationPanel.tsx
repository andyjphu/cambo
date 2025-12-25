import { useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { parseKhmerText, type KhmerCluster } from '../../utils/khmerParser';
import { romanizeCluster } from '../../utils/alaLcRomanization';
import { lookupKhmer } from '../../utils/dictionaryCore';
import { ConfidenceWarning } from './ConfidenceWarning';
import './RomanizationPanel.css';

interface RomanizationPanelProps {
  text: string;
}

export function RomanizationPanel({ text }: RomanizationPanelProps) {
  const { settings } = useSettings();
  
  const romanizedData = useMemo(() => {
    if (!text.trim()) return [];
    
    const clusters = parseKhmerText(text);
    const result: Array<{
      khmer: string;
      romanized: string;
      phonetic: string;
      english?: string;
      confidence: 'high' | 'medium' | 'low';
      warnings: string[];
      isSpace: boolean;
    }> = [];
    
    for (const cluster of clusters) {
      if (cluster.type === 'space') {
        result.push({
          khmer: ' ',
          romanized: ' ',
          phonetic: ' ',
          confidence: 'high',
          warnings: [],
          isSpace: true,
        });
        continue;
      }
      
      // Check dictionary first
      const dictEntry = lookupKhmer(cluster.text);
      if (dictEntry) {
        result.push({
          khmer: cluster.text,
          romanized: dictEntry.romanized || dictEntry.phonetic || '',
          phonetic: dictEntry.phonetic || '',
          english: dictEntry.english,
          confidence: 'high',
          warnings: [],
          isSpace: false,
        });
      } else {
        // Use algorithmic romanization
        const rom = romanizeCluster(cluster.components);
        result.push({
          khmer: cluster.text,
          romanized: rom.romanized,
          phonetic: rom.phonetic,
          confidence: rom.confidence,
          warnings: rom.warnings,
          isSpace: false,
        });
      }
    }
    
    return result;
  }, [text]);
  
  if (!settings.showRomanizationPanel || !text.trim()) {
    return null;
  }
  
  const showIPA = settings.pronunciationMode === 'ipa';
  
  return (
    <div className="romanization-panel">
      <div className="panel-header">
        <span className="panel-title">Romanization</span>
        <span className="panel-mode">{showIPA ? 'ALA-LC' : 'Phonetic'}</span>
      </div>
      <div className="panel-content">
        {romanizedData.map((item, idx) => {
          if (item.isSpace) {
            return <span key={idx} className="rom-space"> </span>;
          }
          
          return (
            <span key={idx} className="rom-item">
              <span className="rom-phonetic">
                {showIPA ? item.romanized : item.phonetic}
                <ConfidenceWarning 
                  level={item.confidence} 
                  warnings={item.warnings} 
                  inline 
                />
              </span>
              {item.english && (
                <span className="rom-english">({item.english})</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

