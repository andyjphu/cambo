import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export function Navbar() {
  const location = useLocation();
  
  return (
    <header className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">ក</span>
          <span className="brand-text">cambo</span>
        </Link>
        
        <nav className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Analyze
          </Link>
          <Link 
            to="/lookup" 
            className={`nav-link ${location.pathname === '/lookup' ? 'active' : ''}`}
          >
            Lookup
          </Link>
          <Link 
            to="/dictionary" 
            className={`nav-link ${location.pathname === '/dictionary' ? 'active' : ''}`}
          >
            Dictionary
          </Link>
        </nav>
        
        <div className="navbar-tagline">
          Khmer text analysis & pronunciation
        </div>
      </div>
    </header>
  );
}

