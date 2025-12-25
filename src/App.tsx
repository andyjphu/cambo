import { KhmerAnalyzer } from './components/KhmerAnalyzer'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">ក</span>
            <span className="logo-text">cambo</span>
          </div>
          <p className="tagline">Khmer text analysis & pronunciation</p>
        </div>
      </header>

      <main className="main">
        <KhmerAnalyzer initialText="សួស្តី ខ្ញុំ ស្រឡាញ់ កម្ពុជា" />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">
            Built with precision for the Khmer language
          </p>
          <div className="footer-links">
            <span className="footer-link">Character Analysis</span>
            <span className="footer-divider">·</span>
            <span className="footer-link">IPA Pronunciation</span>
            <span className="footer-divider">·</span>
            <span className="footer-link">Translation</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
