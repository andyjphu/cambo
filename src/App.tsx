import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { Navbar } from './components/layout/Navbar';
import { SubNav } from './components/layout/SubNav';
import { AnalyzePage } from './pages/AnalyzePage';
import { LookupPage } from './pages/LookupPage';
import { DictionaryPage } from './pages/DictionaryPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <div className="app">
          <Navbar />
          <SubNav />
          
          <main className="main">
            <Routes>
              <Route path="/" element={<AnalyzePage />} />
              <Route path="/lookup" element={<LookupPage />} />
              <Route path="/dictionary" element={<DictionaryPage />} />
            </Routes>
          </main>
          
          <footer className="footer">
            <div className="footer-content">
              <p className="footer-text">
                Built with precision for the Khmer language
              </p>
              <div className="footer-links">
                <span className="footer-link">ALA-LC Romanization</span>
                <span className="footer-divider">·</span>
                <span className="footer-link">~150 Core Words</span>
                <span className="footer-divider">·</span>
                <span className="footer-link">Fuzzy Search</span>
              </div>
            </div>
          </footer>
        </div>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
