import { useState } from 'react';
import './ConfidenceWarning.css';

interface ConfidenceWarningProps {
  level: 'high' | 'medium' | 'low';
  warnings: string[];
  inline?: boolean;
}

export function ConfidenceWarning({ level, warnings, inline = false }: ConfidenceWarningProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (level === 'high' || warnings.length === 0) {
    return null;
  }
  
  const isYellow = level === 'medium';
  const isRed = level === 'low';
  
  return (
    <span 
      className={`confidence-warning ${isYellow ? 'yellow' : ''} ${isRed ? 'red' : ''} ${inline ? 'inline' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="warning-icon">
        {isRed ? (
          // Exclamation triangle for red/low confidence
          <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 100 2 1 1 0 000-2z"/>
        ) : (
          // Info circle for yellow/medium confidence
          <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 118 0a8 8 0 010 16z"/>
        )}
        {isYellow && (
          <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 11-2 0 1 1 0 012 0z"/>
        )}
      </svg>
      
      {showTooltip && (
        <div className={`warning-tooltip ${isRed ? 'red' : 'yellow'}`}>
          <div className="warning-tooltip-header">
            {isRed ? 'Low Confidence' : 'Approximate'}
          </div>
          <div className="warning-tooltip-body">
            <p className="warning-tooltip-intro">
              {isRed 
                ? 'This pronunciation is uncertain and may be incorrect:'
                : 'This pronunciation is approximated from rules:'
              }
            </p>
            <ul className="warning-list">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </span>
  );
}

