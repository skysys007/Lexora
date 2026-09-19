import { useState, useRef, useEffect } from 'react';
import { SAMPLE_NDA, SAMPLE_LEASE } from '../utils/sampleDocuments';

const TYPEWRITER_PHRASES = [
  "In plain English.",
  "Before you sign.",
  "Without legal jargon."
];

export default function LandingPage({ onProcessDocument, onProcessText, isAnalyzing }) {
  const [inputMode, setInputMode] = useState('pdf');
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Typewriter effect state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timer;

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, 75);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, 35);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  const processFile = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      alert('Please upload a PDF or Image file (PNG, JPG, WEBP).');
      return;
    }
    onProcessDocument(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    onProcessText(textInput);
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span>Legal Document Intelligence</span>
        </div>
        
        <h1 className="hero-title">
          Understand what you're signing. <br />
          <span className="hero-highlight">
            {displayText}
            <span className="typewriter-cursor">|</span>
          </span>
        </h1>
        
        <p className="hero-subtitle">
          Instantly spot hidden risks, key obligations, and ambiguous clauses in any legal document or image with browser AI & OCR.
        </p>

        {/* Hero Quick Upload Box */}
        <div className="hero-upload-card">
          <div className="upload-mode-tabs">
            <button
              className={`upload-mode-tab ${inputMode === 'pdf' ? 'active' : ''}`}
              onClick={() => setInputMode('pdf')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Upload Document / Image
            </button>
            <button
              className={`upload-mode-tab ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Paste Text
            </button>
          </div>

          <div key={inputMode} className="tab-panel-animated">
            {inputMode === 'pdf' ? (
              <div
                className={`hero-dropzone ${isDragging ? 'dragging' : ''} ${isAnalyzing ? 'processing' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/bmp"
                  onChange={handleFileChange}
                  hidden
                  disabled={isAnalyzing}
                />
                <div className="dropzone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <p className="dropzone-text">Drop PDF or Image document here to analyze</p>
                <p className="dropzone-hint">Supports PDF, PNG, JPG, WEBP (Image Recognition OCR)</p>
              </div>
            ) : (
              <div className="hero-text-box">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste contract or agreement text here..."
                  rows={4}
                  disabled={isAnalyzing}
                />
                <button
                  className="hero-submit-btn"
                  onClick={handleTextSubmit}
                  disabled={isAnalyzing || !textInput.trim()}
                >
                  Analyze Document Text
                </button>
              </div>
            )}
          </div>

          <div className="sample-docs">
            <span className="sample-label">Or try sample:</span>
            <button className="sample-btn" onClick={() => onProcessText(SAMPLE_NDA)} disabled={isAnalyzing}>
              Sample NDA
            </button>
            <button className="sample-btn" onClick={() => onProcessText(SAMPLE_LEASE)} disabled={isAnalyzing}>
              Sample Lease
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3>Risk Detection</h3>
          <p>Highlights unfair liabilities, hidden fees, locked-in terms, and fine print automatically.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>Document Q&A</h3>
          <p>Ask tailored questions about clauses, obligations, and penalties in conversational English.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h3>Privacy Preserved</h3>
          <p>Local text extraction keeps your confidential paperwork under your control.</p>
        </div>
      </section>
    </div>
  );
}
