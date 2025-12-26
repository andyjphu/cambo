/**
 * Space Editor Component
 * ======================
 * 
 * Allows users to manually edit word boundaries by clicking between clusters.
 * Clusters are orthographic units (consonant + vowels + signs combined).
 * Also provides automatic segmentation suggestions.
 */

import { useMemo, useCallback, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { parseKhmerText, type KhmerCluster } from '../../utils/khmerParser';
import {
  segmentText,
  segmentedToText,
  parseUserSpacedText,
} from '../../utils/wordSegmentation';
import { ConfidenceWarning } from './ConfidenceWarning';
import './SpaceEditor.css';

interface SpaceEditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  disabled?: boolean; // When true, show grayed out preview only
  isEditing?: boolean; // External control of edit mode
  onEditModeChange?: (editing: boolean) => void; // Callback when edit mode changes
}

export function SpaceEditor({ 
  text, 
  onTextChange, 
  disabled = false,
  isEditing = false,
}: SpaceEditorProps) {
  const { settings } = useSettings();
  const [showSuggestion, setShowSuggestion] = useState(false);
  
  // Edit mode is controlled externally via isEditing prop
  const mode = isEditing ? 'edit' : 'preview';

  const khmerFontStyle = { fontFamily: `'${settings.selectedFont.family}', 'Noto Sans Khmer', sans-serif` };

  // Parse current text (with user spaces)
  const currentSegmentation = useMemo(() => parseUserSpacedText(text), [text]);

  // Get auto-segmentation suggestion
  const autoSegmentation = useMemo(() => {
    // Remove all spaces first, then segment
    const cleanText = text.replace(/\s+/g, '');
    return segmentText(cleanText);
  }, [text]);

  // Parse text into clusters (orthographic units that should stay together)
  const clusters = useMemo(() => {
    // Parse the text to get clusters, filtering out spaces
    const allClusters = parseKhmerText(text);
    return allClusters.filter(c => c.type !== 'space');
  }, [text]);

  // Build cluster array with space information for click-to-segment UI
  const clusterData = useMemo(() => {
    const cleanText = text.replace(/\s+/g, '');
    const data: Array<{
      cluster: KhmerCluster;
      index: number;
      hasSpaceAfter: boolean;
      suggestedSpaceAfter: boolean;
    }> = [];

    // Map suggested space positions (by character position)
    const suggestedCharPositions = new Set<number>();
    let charPos = 0;
    for (const word of autoSegmentation.words) {
      charPos += word.text.length;
      if (charPos < cleanText.length) {
        suggestedCharPositions.add(charPos - 1);
      }
    }

    // Map current space positions from user text (by character position)
    const currentSpaceCharPositions = new Set<number>();
    let cleanCharIdx = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') {
        if (cleanCharIdx > 0) {
          currentSpaceCharPositions.add(cleanCharIdx - 1);
        }
      } else {
        cleanCharIdx++;
      }
    }

    // Build cluster data array
    let currentCharPos = 0;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const clusterEndCharPos = currentCharPos + cluster.text.length - 1;

      data.push({
        cluster,
        index: i,
        hasSpaceAfter: currentSpaceCharPositions.has(clusterEndCharPos),
        suggestedSpaceAfter: suggestedCharPositions.has(clusterEndCharPos),
      });

      currentCharPos += cluster.text.length;
    }

    return data;
  }, [text, clusters, autoSegmentation]);

  // Toggle space after a cluster
  const toggleSpace = useCallback((afterClusterIndex: number) => {
    const hasSpace = clusterData[afterClusterIndex]?.hasSpaceAfter;

    // Rebuild text with toggled space
    let newText = '';
    for (let i = 0; i < clusterData.length; i++) {
      newText += clusterData[i].cluster.text;
      if (i === afterClusterIndex) {
        if (!hasSpace) {
          newText += ' ';
        }
        // If has space, we skip adding it (removes the space)
      } else if (clusterData[i]?.hasSpaceAfter) {
        newText += ' ';
      }
    }

    onTextChange(newText);
  }, [clusterData, onTextChange]);

  // Apply auto-segmentation
  const applyAutoSegmentation = useCallback(() => {
    const segmentedText = segmentedToText(autoSegmentation.words);
    onTextChange(segmentedText);
    setShowSuggestion(false);
  }, [autoSegmentation, onTextChange]);

  // Clear all spaces
  const clearSpaces = useCallback(() => {
    const cleanText = text.replace(/\s+/g, '');
    onTextChange(cleanText);
  }, [text, onTextChange]);

  if (mode === 'preview' || disabled) {
    return (
      <div className={`space-editor ${disabled ? 'disabled' : ''}`}>
        <div className="space-editor-content">
          <div className="space-editor-preview" style={khmerFontStyle}>
            {currentSegmentation.words.map((word, idx) => (
              <span key={idx} className="preview-word">
                <span className={`word-text confidence-${word.confidence}`}>
                  {word.text}
                </span>
                {!disabled && word.confidence !== 'high' && (
                  <ConfidenceWarning level={word.confidence} warnings={[]} />
                )}
                {idx < currentSegmentation.words.length - 1 && (
                  <span className="word-separator">·</span>
                )}
              </span>
            ))}
            {disabled && (
              <span className="disabled-hint">Confirm text to edit</span>
            )}
          </div>

          {!disabled && autoSegmentation.overallConfidence !== 'low' &&
            segmentedToText(autoSegmentation.words) !== text && (
              <div className="suggestion-hint">
                <button
                  className="suggestion-btn"
                  onClick={() => setShowSuggestion(!showSuggestion)}
                >
                  💡 Auto-segment suggestion available
                </button>
                {showSuggestion && (
                  <div className="suggestion-preview">
                    <div className="suggestion-text" style={khmerFontStyle}>
                      {segmentedToText(autoSegmentation.words)}
                    </div>
                    <button
                      className="apply-suggestion-btn"
                      onClick={applyAutoSegmentation}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-editor editing">
      <div className="space-editor-content">
        <div className="edit-mode-toolbar">
          <span className="edit-hint">Click between syllables to add/remove spaces</span>
          <div className="edit-mode-actions">
            <button
              className="action-btn-sm"
              onClick={clearSpaces}
              title="Remove all spaces"
            >
              Clear
            </button>
            <button
              className="action-btn-sm"
              onClick={applyAutoSegmentation}
              title="Auto-segment"
            >
              Auto
            </button>
          </div>
        </div>

        <div className="space-editor-clusters" style={khmerFontStyle}>
          {clusterData.map((item, idx) => (
            <span key={idx} className="cluster-wrapper">
              <span className="cluster">{item.cluster.text}</span>
              {idx < clusterData.length - 1 && (
                <button
                  className={`space-toggle ${item.hasSpaceAfter ? 'has-space' : ''} ${item.suggestedSpaceAfter ? 'suggested' : ''}`}
                  onClick={() => toggleSpace(idx)}
                  title={item.hasSpaceAfter ? 'Click to remove space' : 'Click to add space'}
                >
                  {item.hasSpaceAfter ? '|' : '·'}
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="space-editor-legend">
          <span className="legend-item">
            <span className="legend-icon has-space">|</span> Space added
          </span>
          <span className="legend-item">
            <span className="legend-icon suggested">·</span> Suggested
          </span>
          <span className="legend-item">
            <span className="legend-icon">·</span> No space
          </span>
        </div>
      </div>
    </div>
  );
}

