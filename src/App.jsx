import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DocumentUpload from './components/DocumentUpload';
import AnalysisResults from './components/AnalysisResults';
import DocumentQA from './components/DocumentQA';
import DevPanel from './components/DevPanel';
import PixelThemeToggle from './components/PixelThemeToggle';
import { extractTextFromDocument } from './services/ocrService';
import { analyzeLegalDocument } from './services/aiService';
import './App.css';

const DEFAULT_API_CONFIG = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'openai/gpt-oss-120b',
};

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'workspace'
  const [isDark, setIsDark] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiConfig, setApiConfig] = useState(DEFAULT_API_CONFIG);
  const [activeTab, setActiveTab] = useState('analysis');
  const [documentText, setDocumentText] = useState(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  const switchView = (nextView) => {
    if (currentView === nextView) return;
    setCurrentView(nextView);
  };

  const handleProcessDocument = async (file) => {
    if (!apiConfig.apiKey) {
      alert("Please configure your API key in Dev Settings first.");
      setShowDevPanel(true);
      return;
    }

    switchView('workspace', 'next');
    setIsAnalyzing(true);
    setAnalysisResults(null);
    setDocumentText(null);

    try {
      const extractedText = await extractTextFromDocument(file);
      setDocumentText(extractedText);
      
      const aiResult = await analyzeLegalDocument(extractedText, apiConfig);
      setAnalysisResults(aiResult);
    } catch (error) {
      console.error(error);
      setAnalysisResults("An error occurred during analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProcessText = async (text) => {
    if (!apiConfig.apiKey) {
      alert("Please configure your API key in Dev Settings first.");
      setShowDevPanel(true);
      return;
    }

    switchView('workspace', 'next');
    setIsAnalyzing(true);
    setAnalysisResults(null);
    setDocumentText(null);

    try {
      setDocumentText(text);
      
      const aiResult = await analyzeLegalDocument(text, apiConfig);
      setAnalysisResults(aiResult);
    } catch (error) {
      console.error(error);
      setAnalysisResults("An error occurred during analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`app-container ${isDark ? 'dark-mode' : ''}`}>
      {/* Subtle Navigation Header */}
      <nav className="nav-bar">
        <div className="nav-brand" onClick={() => switchView('landing')}>
          <span className="brand-title">lexora</span>
          <span className="brand-dot">.</span>
        </div>

        <div className="nav-actions">
          {currentView === 'workspace' && (
            <button className="nav-btn-text" onClick={() => switchView('landing')}>
              ← Home
            </button>
          )}

          <PixelThemeToggle isDark={isDark} onToggleTheme={(val) => setIsDark(val)} />

          <button className="dev-settings-button-nav" onClick={() => setShowDevPanel(true)}>
            Dev Settings
          </button>
        </div>
      </nav>

      {/* Dev Panel Modal */}
      {showDevPanel && (
        <DevPanel
          config={apiConfig}
          onConfigChange={setApiConfig}
          onClose={() => setShowDevPanel(false)}
        />
      )}

      {/* View Switcher */}
      {currentView === 'landing' ? (
        <LandingPage
          onProcessDocument={handleProcessDocument}
          onProcessText={handleProcessText}
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <main className="app-main">
          <div className="sidebar">
            <DocumentUpload onProcessDocument={handleProcessDocument} onProcessText={handleProcessText} />
          </div>

          <div className="content">
            {analysisResults && (
              <div className="tab-bar">
                <button
                  className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  Analysis
                </button>
                <button
                  className={`tab-button ${activeTab === 'qa' ? 'active' : ''}`}
                  onClick={() => setActiveTab('qa')}
                >
                  Q&A
                </button>
              </div>
            )}

            <div className="content-scroll">
              {activeTab === 'analysis' ? (
                <AnalysisResults results={analysisResults} isLoading={isAnalyzing} />
              ) : (
                <DocumentQA documentText={documentText} apiKey={apiConfig.apiKey} />
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
