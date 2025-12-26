import { useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { type KhmerCluster } from '../../utils/khmerParser';
import { romanizeCluster } from '../../utils/alaLcRomanization';
import { getDictionaryEntry } from '../../utils/wordSegmentation';
import { getSyllableColor } from '../../utils/colors';
import { ConfidenceWarning } from './ConfidenceWarning';
import './RomanizationPanel.css';

interface RomanizationPanelProps {
  text: string;
  clusters: KhmerCluster[];
  activeClusterIdx: number | null;
  onClusterHover: (clusterIdx: number | null) => void;
  onClusterClick: (clusterIdx: number, compIdx: number | null, source: 'input' | 'analysis') => void;
  getNonSpaceIdx: (clusterIdx: number) => number;
}

export function RomanizationPanel({
  text,
  clusters,
  activeClusterIdx,
  onClusterHover,
  onClusterClick,
  getNonSpaceIdx,
}: RomanizationPanelProps) {
  const { settings } = useSettings();

  const romanizedData = useMemo(() => {
    if (!text.trim()) return [];

    const result: Array<{
      khmer: string;
      romanized: string;
      phonetic: string;
      english?: string;
      confidence: 'high' | 'medium' | 'low';
      warnings: string[];
      isSpace: boolean;
      clusterIdx: number;
    }> = [];

    clusters.forEach((cluster, clusterIdx) => {
      if (cluster.type === 'space') {
        result.push({
          khmer: ' ',
          romanized: ' ',
          phonetic: ' ',
          confidence: 'high',
          warnings: [],
          isSpace: true,
          clusterIdx,
        });
        return;
      }

      // Check dictionary first (user dictionary takes precedence)
      const dictEntry = getDictionaryEntry(cluster.text);
      if (dictEntry) {
        result.push({
          khmer: cluster.text,
          romanized: dictEntry.romanized || dictEntry.phonetic || '',
          phonetic: dictEntry.phonetic || '',
          english: dictEntry.english,
          confidence: 'high',
          warnings: [],
          isSpace: false,
          clusterIdx,
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
          clusterIdx,
        });
      }
    });

    return result;
  }, [text, clusters]);

  if (!settings.showRomanizationPanel || !text.trim()) {
    return null;
  }

  const showIPA = settings.pronunciationMode === 'ipa';

  return (
    <div className="romanization-panel">
      <div className="panel-content">
        {romanizedData.map((item, idx) => {
          if (item.isSpace) {
            return <span key={idx} className="rom-space"> </span>;
          }

          const nonSpaceIdx = getNonSpaceIdx(item.clusterIdx);
          const syllableColor = getSyllableColor(nonSpaceIdx);
          const isHighlighted = activeClusterIdx === item.clusterIdx;

          return (
            <span
              key={idx}
              className={`rom-item romanization-cluster ${isHighlighted ? 'highlighted' : ''}`}
              style={{
                '--syllable-accent': syllableColor.accent,
                '--syllable-bg': syllableColor.bgLight,
              } as React.CSSProperties}
              onMouseEnter={() => onClusterHover(item.clusterIdx)}
              onMouseLeave={() => onClusterHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onClusterClick(item.clusterIdx, null, 'input');
              }}
            >
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

