import { useRef, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

interface TooltipProps {
  children: ReactNode;
  triggerRef: RefObject<HTMLElement | null>;
  isVisible: boolean;
  className?: string;
}

interface Position {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

/**
 * Portal-based tooltip that renders at document root.
 * This escapes all overflow:hidden/auto containers.
 */
export function Tooltip({ children, triggerRef, isVisible, className = '' }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      
      // Get actual tooltip dimensions, or use reasonable defaults
      const tooltipHeight = tooltip?.offsetHeight || 200;
      const tooltipWidth = tooltip?.offsetWidth || 300;
      const maxTooltipHeight = Math.min(400, window.innerHeight - 32); // Match CSS max-height
      
      // Spacing constants
      const arrowHeight = 6; // Height of the arrow (border width)
      const gap = 12; // Gap between arrow tip and trigger element
      const margin = 8; // Viewport margin
      const minSpaceRequired = gap + arrowHeight; // Minimum space needed

      // Calculate horizontal position (centered on trigger)
      let left = triggerRect.left + triggerRect.width / 2;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const halfWidth = tooltipWidth / 2;

      // Clamp horizontal position to viewport
      if (left - halfWidth < margin) {
        left = halfWidth + margin;
      } else if (left + halfWidth > viewportWidth - margin) {
        left = viewportWidth - halfWidth - margin;
      }

      // Calculate available space above and below trigger
      const spaceAbove = triggerRect.top - margin;
      const spaceBelow = viewportHeight - triggerRect.bottom - margin;
      const totalTooltipHeight = tooltipHeight + arrowHeight + gap;

      let top: number;
      let placement: 'top' | 'bottom';

      // Prefer showing above if there's enough space
      // When above: tooltip body ends at (top + tooltipHeight), arrow extends to (top + tooltipHeight + arrowHeight)
      // Gap is between arrow tip and trigger top
      if (spaceAbove >= totalTooltipHeight) {
        // Position above trigger with gap between arrow tip and trigger
        // Arrow tip should be at: triggerRect.top - gap
        // Arrow starts at: triggerRect.top - gap - arrowHeight
        // Tooltip body ends at arrow start, so: top = triggerRect.top - gap - arrowHeight - tooltipHeight
        top = triggerRect.top - gap - arrowHeight - tooltipHeight;
        placement = 'top';
      } else if (spaceBelow >= totalTooltipHeight) {
        // Position below trigger with gap between arrow tip and trigger
        // Arrow tip should be at: triggerRect.bottom + gap
        // Arrow extends upward, so tooltip starts at: triggerRect.bottom + gap + arrowHeight
        top = triggerRect.bottom + gap + arrowHeight;
        placement = 'bottom';
      } else {
        // Not enough space in either direction - choose best option
        if (spaceAbove >= tooltipHeight + minSpaceRequired) {
          // Can fit above, even if tight
          top = Math.max(margin, triggerRect.top - gap - arrowHeight - tooltipHeight);
          placement = 'top';
        } else if (spaceBelow >= tooltipHeight + minSpaceRequired) {
          // Can fit below, even if tight
          top = Math.min(
            viewportHeight - tooltipHeight - margin,
            triggerRect.bottom + gap + arrowHeight
          );
          placement = 'bottom';
        } else {
          // Very tight space - position to maximize visibility
          if (spaceAbove > spaceBelow) {
            // More space above - position as high as possible while maintaining gap
            top = Math.max(margin, triggerRect.top - gap - arrowHeight - tooltipHeight);
            placement = 'top';
          } else {
            // More space below - position as low as possible while maintaining gap
            top = Math.max(
              triggerRect.bottom + gap + arrowHeight,
              viewportHeight - Math.min(tooltipHeight, maxTooltipHeight) - margin
            );
            placement = 'bottom';
          }
        }
      }

      // Final bounds check - ensure tooltip doesn't overlap trigger
      // For top placement: tooltip bottom (top + tooltipHeight) + arrow should be at least 'gap' pixels above trigger
      if (placement === 'top') {
        const tooltipBottom = top + tooltipHeight;
        const arrowTip = tooltipBottom + arrowHeight;
        if (arrowTip >= triggerRect.top - gap) {
          // Too close, move up to maintain gap
          top = triggerRect.top - gap - arrowHeight - tooltipHeight - 2;
        }
      } else if (placement === 'bottom') {
        // For bottom placement: tooltip top should be at least 'gap' pixels below trigger
        if (top <= triggerRect.bottom + gap) {
          // Too close, move down to maintain gap
          top = triggerRect.bottom + gap + arrowHeight + 2;
        }
      }

      // Ensure tooltip stays within viewport
      top = Math.max(margin, Math.min(top, viewportHeight - Math.min(tooltipHeight, maxTooltipHeight) - margin));

      setPosition({ top, left, placement });
    };

    // Initial position - use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    // Update on scroll (capture phase to catch all scrolls)
    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    // Also update when tooltip content changes (for accurate height measurement)
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
  }, [isVisible, triggerRef]);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`portal-tooltip ${position?.placement || 'top'} ${className}`}
      style={position ? { top: position.top, left: position.left } : { visibility: 'hidden' }}
    >
      {children}
      <div className="tooltip-arrow" />
    </div>,
    document.body
  );
}

