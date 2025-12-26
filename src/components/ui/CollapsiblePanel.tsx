import { type ReactNode } from 'react';
import { BsChevronDown } from 'react-icons/bs';
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
          <BsChevronDown 
            className={`collapse-icon ${isExpanded ? 'expanded' : ''}`}
            size={14}
          />
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

