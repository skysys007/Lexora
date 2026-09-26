import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import DocumentUpload from './components/DocumentUpload';
import DevPanel from './components/DevPanel';
import AccessibilityModal from './components/AccessibilityModal';
import PixelThemeToggle from './components/PixelThemeToggle';
import SimplePageFlipLoader from './components/SimplePageFlipLoader';
import { analyzeLegalDocument } from './services/aiService';
import { DEFAULT_API_CONFIG } from './constants/appConstants';
import { DEFAULT_A11Y_CONFIG, UI_TRANSLATIONS } from './constants/a11yConstants';
import './App.css';

const AnalysisResults = lazy(() => import('./components/AnalysisResults'));
const DocumentQA = lazy(() => import('./components/DocumentQA'));
const DocumentCompare = lazy(() => import('./components/DocumentCompare'));

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'workspace'
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('lexora_theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [a11yConfig, setA11yConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lexora_a11y_config');
      return saved ? { ...DEFAULT_A11Y_CONFIG, ...JSON.parse(saved) } : DEFAULT_A11Y_CONFIG;
    } catch {
      return DEFAULT_A11Y_CONFIG;
    }
  });

  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiConfig, setApiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lexora_api_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.model || parsed.model.includes('llama-3.3-70b-versatile') || parsed.model.includes('llama3-70b-8192')) {
          parsed.model = DEFAULT_API_CONFIG.model;
          try {
            localStorage.setItem('lexora_api_config', JSON.stringify({ ...DEFAULT_API_CONFIG, ...parsed }));
          } catch {
            // Ignore storage errors
          }
        }
        return { ...DEFAULT_API_CONFIG, ...parsed };
      }
      return DEFAULT_API_CONFIG;
    } catch {
      return DEFAULT_API_CONFIG;
    }
  });
  const [activeTab, setActiveTab] = useState('analysis');
  const [documentText, setDocumentText] = useState(null);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [showA11yModal, setShowA11yModal] = useState(false);

  const t = UI_TRANSLATIONS[a11yConfig.language || 'en'] || UI_TRANSLATIONS.en;

  // Sync theme changes
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    try {
      localStorage.setItem('lexora_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  // Sync accessibility classes and language HTML attribute
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('font-large', 'font-xlarge');
    if (a11yConfig.fontSize === 'large') root.classList.add('font-large');
    if (a11yConfig.fontSize === 'xlarge') root.classList.add('font-xlarge');

    body.classList.toggle('dyslexic-font-mode', !!a11yConfig.dyslexicFont);
    body.classList.toggle('high-contrast-mode', !!a11yConfig.highContrast);
    body.classList.toggle('reduced-motion-mode', !!a11yConfig.reducedMotion);
    body.classList.toggle('increased-spacing', a11yConfig.lineSpacing === 'increased');

    root.setAttribute('lang', a11yConfig.language || 'en');

    try {
      localStorage.setItem('lexora_a11y_config', JSON.stringify(a11yConfig));
    } catch {
      // Ignore storage errors
    }
  }, [a11yConfig]);

  const handleUpdateConfig = useCallback((newConfig) => {
    setApiConfig(newConfig);
    try {
      localStorage.setItem('lexora_api_config', JSON.stringify(newConfig));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleUpdateA11yConfig = useCallback((newA11yConfig) => {
    setA11yConfig(newA11yConfig);
  }, []);

  const switchView = useCallback((nextView) => {
    setCurrentView((prev) => (prev === nextView ? prev : nextView));
  }, []);

  const handleProcessDocument = useCallback(async (file) => {
    const effectiveKey = (apiConfig.apiKey && apiConfig.apiKey.trim()) || DEFAULT_API_CONFIG.apiKey;
    if (!effectiveKey) {
      alert("Please configure your API key in Dev Settings first.");
      setShowDevPanel(true);
      return;
    }

    switchView('workspace');
    setIsAnalyzing(true);
    setAnalysisResults(null);
    setDocumentText(null);

    try {
      const { extractTextFromDocument } = await import('./services/ocrService');
      const extractedText = await extractTextFromDocument(file);
      setDocumentText(extractedText);
      
      const aiResult = await analyzeLegalDocument(extractedText, apiConfig, a11yConfig);
      setAnalysisResults(aiResult);
    } catch (error) {
      console.error(error);
      setAnalysisResults("An error occurred during analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiConfig, a11yConfig, switchView]);

  const handleProcessText = useCallback(async (text) => {
    const effectiveKey = (apiConfig.apiKey && apiConfig.apiKey.trim()) || DEFAULT_API_CONFIG.apiKey;
    if (!effectiveKey) {
      alert("Please configure your API key in Dev Settings first.");
      setShowDevPanel(true);
      return;
    }

    switchView('workspace');
    setIsAnalyzing(true);
    setAnalysisResults(null);
    setDocumentText(null);

    try {
      setDocumentText(text);
      
      const aiResult = await analyzeLegalDocument(text, apiConfig, a11yConfig);
      setAnalysisResults(aiResult);
    } catch (error) {
      console.error(error);
      setAnalysisResults("An error occurred during analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiConfig, a11yConfig, switchView]);

  return (
    <div className={`app-container ${isDark ? 'dark-mode' : ''}`}>
      {/* Skip to Main Content Navigation Link */}
      <a href="#main-content" className="skip-link">
        {t.skipToMain || 'Skip to main content'}
      </a>

      {/* Navigation Header */}
      <nav className="nav-bar" role="navigation" aria-label="Main Navigation">
        <div
          className="nav-brand"
          onClick={() => switchView('landing')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && switchView('landing')}
          aria-label="Lexora Home"
        >
          <span className="brand-title">lexora</span>
          <span className="brand-dot">.</span>
        </div>

        <div className="nav-actions">
          {currentView === 'workspace' && (
            <button className="nav-btn-text" onClick={() => switchView('landing')} aria-label={t.home}>
              ← {t.home || 'Home'}
            </button>
          )}

          <button
            className="a11y-settings-button-nav"
            onClick={() => setShowA11yModal(true)}
            aria-label={t.a11ySettings}
            title={t.a11ySettings}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span>Accessibility</span>
          </button>

          <PixelThemeToggle isDark={isDark} onToggleTheme={(val) => setIsDark(val)} />

          <button className="dev-settings-button-nav" onClick={() => setShowDevPanel(true)} aria-label={t.devSettings}>
            {t.devSettings || 'Dev Settings'}
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showDevPanel && (
        <DevPanel
          config={apiConfig}
          onConfigChange={handleUpdateConfig}
          onClose={() => setShowDevPanel(false)}
        />
      )}

      {showA11yModal && (
        <AccessibilityModal
          config={a11yConfig}
          onChange={handleUpdateA11yConfig}
          onClose={() => setShowA11yModal(false)}
        />
      )}

      {/* View Switcher & Main Landmark */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        {currentView === 'landing' ? (
          <LandingPage
            onProcessDocument={handleProcessDocument}
            onProcessText={handleProcessText}
            isAnalyzing={isAnalyzing}
            a11yConfig={a11yConfig}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
              <div className="sidebar">
                <DocumentUpload
                  onProcessDocument={handleProcessDocument}
                  onProcessText={handleProcessText}
                  a11yConfig={a11yConfig}
                />
              </div>

              <div className="content">
                <div className="tab-bar" role="tablist" aria-label="Workspace View Select">
                  <button
                    id="tab-analysis"
                    role="tab"
                    aria-selected={activeTab === 'analysis'}
                    aria-controls="panel-analysis"
                    className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                  >
                    🔍 {t.analysisTab || 'Analysis'}
                  </button>

                  <button
                    id="tab-compare"
                    role="tab"
                    aria-selected={activeTab === 'compare'}
                    aria-controls="panel-compare"
                    className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compare')}
                  >
                    ⚖️ Compare Docs
                  </button>

                  <button
                    id="tab-qa"
                    role="tab"
                    aria-selected={activeTab === 'qa'}
                    aria-controls="panel-qa"
                    className={`tab-button ${activeTab === 'qa' ? 'active' : ''}`}
                    onClick={() => setActiveTab('qa')}
                  >
                    💬 {t.qaTab || 'Q&A'}
                  </button>
                </div>

                <div className="content-scroll">
                  <Suspense fallback={<SimplePageFlipLoader message="Loading Workspace..." />}>
                    {activeTab === 'analysis' && (
                      <div id="panel-analysis" role="tabpanel" aria-labelledby="tab-analysis">
                        <AnalysisResults results={analysisResults} isLoading={isAnalyzing} a11yConfig={a11yConfig} />
                      </div>
                    )}

                    {activeTab === 'compare' && (
                      <div id="panel-compare" role="tabpanel" aria-labelledby="tab-compare">
                        <DocumentCompare apiConfig={apiConfig} a11yConfig={a11yConfig} />
                      </div>
                    )}

                    {activeTab === 'qa' && (
                      <div id="panel-qa" role="tabpanel" aria-labelledby="tab-qa">
                        <DocumentQA documentText={documentText} apiConfig={apiConfig} apiKey={apiConfig.apiKey} a11yConfig={a11yConfig} />
                      </div>
                    )}
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Legal Assistance Disclaimer Banner */}
            <footer className="legal-disclaimer-banner" role="contentinfo">
              <span><strong>Legal Disclaimer:</strong> Lexora is an AI-powered legal document assistance tool for informational and educational purposes only. It does not provide legal advice or create an attorney-client relationship.</span>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
