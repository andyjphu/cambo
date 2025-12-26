import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfidenceWarning.css';

interface ConfidenceWarningProps {
  level: 'high' | 'medium' | 'low';
  warnings: string[];
  inline?: boolean;
}

export function ConfidenceWarning({ level, warnings, inline = false }: ConfidenceWarningProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);
  
  if (level === 'high' || (warnings !== undefined && warnings.length === 0)) {
    return null;
  }
  
  const isYellow = level === 'medium';
  const isRed = level === 'low';

  // Position tooltip using portal (same strategy as main Tooltip component)
  useLayoutEffect(() => {
    if (!showTooltip || !triggerRef.current) {
      setPosition(null);
      return;
    }

    let rafId: number;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const tooltipHeight = tooltipRect.height;
      const tooltipWidth = tooltipRect.width;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8;
      const arrowHeight = 6;
      const desiredGap = 12;
      const totalOffset = desiredGap + arrowHeight;

      let top = 0;
      let left = triggerRect.left + triggerRect.width / 2;
      let placement: 'top' | 'bottom' = 'top';

      // Clamp horizontal position to viewport
      const halfWidth = tooltipWidth / 2;
      if (left - halfWidth < margin) {
        left = halfWidth + margin;
      } else if (left + halfWidth > viewportWidth - margin) {
        left = viewportWidth - halfWidth - margin;
      }

      // Determine vertical placement
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;

      if (spaceAbove >= tooltipHeight + totalOffset + margin) {
        top = triggerRect.top - tooltipHeight - totalOffset;
        placement = 'top';
      } else if (spaceBelow >= tooltipHeight + totalOffset + margin) {
        top = triggerRect.bottom + totalOffset;
        placement = 'bottom';
      } else {
        if (spaceAbove > spaceBelow) {
          top = Math.max(margin, triggerRect.top - tooltipHeight - totalOffset);
          placement = 'top';
        } else {
          top = Math.min(viewportHeight - tooltipHeight - margin, triggerRect.bottom + totalOffset);
          placement = 'bottom';
        }
      }

      setPosition({ top: top + window.scrollY, left: left + window.scrollX, placement });
    };

    const initializePosition = () => {
      if (tooltipRef.current && triggerRef.current) {
        updatePosition();
      } else {
        rafId = requestAnimationFrame(initializePosition);
      }
    };
    initializePosition();

    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    const observer = tooltipRef.current ? new ResizeObserver(() => {
      requestAnimationFrame(updatePosition);
    }) : null;
    if (observer && tooltipRef.current) {
      observer.observe(tooltipRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      observer?.disconnect();
    };
  }, [showTooltip]);
  
  return (
    <>
      <span 
        ref={triggerRef}
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
      </span>
      
      {showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className={`warning-tooltip-portal ${isRed ? 'red' : 'yellow'} ${position?.placement || 'top'}`}
          style={position ? { top: position.top, left: position.left } : { visibility: 'hidden' }}
        >
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
                {warnings !== undefined && warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="warning-tooltip-arrow" />
        </div>,
        document.body
      )}
    </>
  );
}

