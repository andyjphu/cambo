import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { BsExclamationTriangle, BsInfoCircle } from 'react-icons/bs';
import './ConfidenceWarning.css';

interface ConfidenceWarningProps {
  level: 'high' | 'medium' | 'low';
  warnings: string[];
  inline?: boolean;
}

export function ConfidenceWarning({ level, warnings, inline = false }: ConfidenceWarningProps) {
  // Early return check - must be before all hooks
  if (level === 'high' || (warnings !== undefined && warnings.length === 0)) {
    return null;
  }
  
  // All hooks must be called unconditionally (after early return check)
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);
  
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
        {isRed ? (
          <BsExclamationTriangle className="warning-icon" size={14} />
        ) : (
          <BsInfoCircle className="warning-icon" size={14} />
        )}
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

