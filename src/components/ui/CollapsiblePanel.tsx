import { type ReactNode } from 'react';
import './CollapsiblePanel.css';

interface CollapsiblePanelProps {
  title: string;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  actionButton?: ReactNode;
  className?: string;
}

export function CollapsiblePanel({
  title,
  badge,
  isExpanded,
  onToggle,
  children,
  actionButton,
  className = '',
}: CollapsiblePanelProps) {
  return (
    <section className={`collapsible-panel ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      <div className="panel-header">
        <button
          className="panel-header-btn"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <div className="panel-title-group">
            <span className="panel-title">{title}</span>
            {badge && <span className="panel-badge">{badge}</span>}
          </div>
          <svg
            className={`collapse-icon ${isExpanded ? 'expanded' : ''}`}
            viewBox="0 0 16 16"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
        {actionButton && <div className="panel-action-slot">{actionButton}</div>}
      </div>
      {isExpanded && (
        <div className="panel-body">
          {children}
        </div>
      )}
    </section>
  );
}

