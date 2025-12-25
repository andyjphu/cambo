/**
 * Space Editor Component
 * ======================
 * 
 * Allows users to manually edit word boundaries by clicking between clusters.
 * Clusters are orthographic units (consonant + vowels + signs combined).
 * Also provides automatic segmentation suggestions.
 */

import { useState, useMemo, useCallback } from 'react';
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
  onConfirm?: () => void;
  disabled?: boolean; // When true, show grayed out preview only
}

export function SpaceEditor({ text, onTextChange, onConfirm, disabled = false }: SpaceEditorProps) {
  const { settings } = useSettings();
  const [mode, setMode] = useState<'edit' | 'preview'>('preview');
  const [showSuggestion, setShowSuggestion] = useState(false);
  
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
        <div className="space-editor-header">
          <span className="space-editor-title">Word Boundaries</span>
          <div className="space-editor-actions">
            {!disabled && (
              <button 
                className="space-editor-btn"
                onClick={() => setMode('edit')}
                title="Edit word boundaries"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/>
                </svg>
                Edit
              </button>
            )}
            {disabled && (
              <span className="disabled-hint">Confirm text to edit</span>
            )}
          </div>
        </div>
        
        <div className="space-editor-preview" style={khmerFontStyle}>
          {currentSegmentation.words.map((word, idx) => (
            <span key={idx} className="preview-word">
              <span className={`word-text confidence-${word.confidence}`}>
                {word.text}
              </span>
              {!disabled && word.confidence !== 'high' && (
                <ConfidenceWarning confidence={word.confidence} />
              )}
              {idx < currentSegmentation.words.length - 1 && (
                <span className="word-separator">·</span>
              )}
            </span>
          ))}
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
    );
  }
  
  // Edit mode
  return (
    <div className="space-editor editing">
      <div className="space-editor-header">
        <span className="space-editor-title">Click between syllables to add/remove spaces</span>
        <div className="space-editor-actions">
          <button 
            className="space-editor-btn secondary"
            onClick={clearSpaces}
            title="Remove all spaces"
          >
            Clear
          </button>
          <button 
            className="space-editor-btn secondary"
            onClick={applyAutoSegmentation}
            title="Auto-segment"
          >
            Auto
          </button>
          <button 
            className="space-editor-btn primary"
            onClick={() => {
              setMode('preview');
              onConfirm?.();
            }}
            title="Done editing"
          >
            Done
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
  );
}

