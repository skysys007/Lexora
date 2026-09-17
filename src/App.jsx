import { useState } from 'react';
import DocumentUpload from './components/DocumentUpload';
import AnalysisResults from './components/AnalysisResults';
import DocumentQA from './components/DocumentQA';
import DevPanel from './components/DevPanel';
import { extractTextFromPDF } from './services/pdfService';
import { analyzeLegalDocument } from './services/aiService';
import './App.css';

const DEFAULT_API_CONFIG = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'openai/gpt-oss-120b',
};

function App() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiConfig, setApiConfig] = useState(DEFAULT_API_CONFIG);
  const [activeTab, setActiveTab] = useState('analysis');
  const [documentText, setDocumentText] = useState(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const handleProcessDocument = async (file) => {
    if (!apiConfig.apiKey) {
      alert("Please configure your API key in Dev Settings first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);
    setDocumentText(null);

    try {
      const extractedText = await extractTextFromPDF(file);
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
      return;
    }

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
    <div className="app-container">
      <header className="app-header">
        <h1>Lexora</h1>
        <p>AI-Powered Legal Document Analysis</p>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <DocumentUpload onProcessDocument={handleProcessDocument} onProcessText={handleProcessText} />
          
          <button className="dev-settings-button" onClick={() => setShowDevPanel(true)}>
            Dev Settings
          </button>
        </div>

        {showDevPanel && (
          <DevPanel
            config={apiConfig}
            onConfigChange={setApiConfig}
            onClose={() => setShowDevPanel(false)}
          />
        )}

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
    </div>
  );
}

export default App;
