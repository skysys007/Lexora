import { useState, useRef } from 'react';
import { compareLegalDocuments } from '../services/aiService';
import { validateUploadedFile, sanitizeTextInput } from '../utils/fileHelpers';
import { extractTextFromDocument } from '../services/ocrService';
import AudioReader from './AudioReader';

export default function DocumentCompare({ apiConfig, a11yConfig = {} }) {
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [nameA, setNameA] = useState('Document A');
  const [nameB, setNameB] = useState('Document B');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);

  const handleFileUpload = async (file, setDocText, setDocName) => {
    if (!file) return;
    const val = validateUploadedFile(file);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    setDocName(file.name);
    try {
      const text = await extractTextFromDocument(file);
      setDocText(text);
    } catch (err) {
      alert("Error reading file: " + err.message);
    }
  };

  const handleRunComparison = async () => {
    if (!docA.trim() || !docB.trim()) {
      alert("Please provide text or files for both Document A and Document B to compare.");
      return;
    }

    if (!apiConfig || !apiConfig.apiKey) {
      alert("Please configure your API key in Dev Settings first.");
      return;
    }

    setIsComparing(true);
    setComparisonResult(null);

    try {
      const resultRaw = await compareLegalDocuments(docA, docB, apiConfig, a11yConfig);
      let parsed = null;
      try {
        const match = resultRaw.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch {
        // Fallback raw string if non-JSON
      }

      setComparisonResult(parsed || { raw: resultRaw });
    } catch (err) {
      console.error(err);
      alert("Comparison failed: " + err.message);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="compare-container" role="region" aria-label="Document Comparison Tool">
      <div className="compare-header">
        <h2>Contract & Policy Comparison</h2>
        <p>Compare two versions of an agreement, contract, or policy to spot hidden changes and risk differences.</p>
      </div>

      <div className="compare-inputs-grid">
        {/* Document A Input Box */}
        <div className="compare-input-card">
          <div className="compare-card-title">
            <span className="doc-badge badge-a">Document A</span>
            <span>{nameA}</span>
          </div>

          <div className="compare-file-actions">
            <button
              type="button"
              className="compare-file-btn"
              onClick={() => fileInputARef.current?.click()}
            >
              📁 Upload PDF / Image
            </button>
            <input
              ref={fileInputARef}
              type="file"
              accept="application/pdf,image/*"
              hidden
              onChange={(e) => handleFileUpload(e.target.files[0], setDocA, setNameA)}
            />
          </div>

          <textarea
            value={docA}
            onChange={(e) => setDocA(e.target.value)}
            placeholder="Paste text for Document A (or upload file above)..."
            rows={8}
            aria-label="Text for Document A"
          />
        </div>

        {/* Document B Input Box */}
        <div className="compare-input-card">
          <div className="compare-card-title">
            <span className="doc-badge badge-b">Document B</span>
            <span>{nameB}</span>
          </div>

          <div className="compare-file-actions">
            <button
              type="button"
              className="compare-file-btn"
              onClick={() => fileInputBRef.current?.click()}
            >
              📁 Upload PDF / Image
            </button>
            <input
              ref={fileInputBRef}
              type="file"
              accept="application/pdf,image/*"
              hidden
              onChange={(e) => handleFileUpload(e.target.files[0], setDocB, setNameB)}
            />
          </div>

          <textarea
            value={docB}
            onChange={(e) => setDocB(e.target.value)}
            placeholder="Paste text for Document B (or upload file above)..."
            rows={8}
            aria-label="Text for Document B"
          />
        </div>
      </div>

      <div className="compare-action-bar">
        <button
          type="button"
          className="run-compare-btn"
          onClick={handleRunComparison}
          disabled={isComparing || !docA.trim() || !docB.trim()}
        >
          {isComparing ? 'Comparing Documents...' : '⚡ Compare Both Documents'}
        </button>
      </div>

      {/* Comparison Results Section */}
      {comparisonResult && (
        <div className="compare-results-card" role="region" aria-label="Comparison Results">
          {comparisonResult.raw ? (
            <div className="compare-raw-output">
              <h3>Comparison Results</h3>
              <p>{comparisonResult.raw}</p>
            </div>
          ) : (
            <div>
              <div className="compare-summary-banner">
                <div style={{ flex: 1 }}>
                  <h3 className="compare-banner-title">Comparison Overview</h3>
                  <p className="compare-summary-text">{comparisonResult.comparison_summary}</p>
                  {comparisonResult.more_favorable_document && (
                    <div className="favorable-tag">
                      <strong>More User-Friendly:</strong> {comparisonResult.more_favorable_document} - {comparisonResult.favorable_reason}
                    </div>
                  )}
                </div>

                <AudioReader
                  text={`${comparisonResult.comparison_summary}. More favorable document: ${comparisonResult.more_favorable_document}. Reason: ${comparisonResult.favorable_reason}`}
                  label="Comparison Summary"
                  lang={a11yConfig.language || 'en'}
                  rate={a11yConfig.ttsSpeed || 1.0}
                />
              </div>

              {comparisonResult.key_differences && comparisonResult.key_differences.length > 0 && (
                <div className="differences-list">
                  <h4>Key Differences & Term Changes ({comparisonResult.key_differences.length})</h4>

                  {comparisonResult.key_differences.map((item, index) => (
                    <div key={index} className="difference-card">
                      <div className="diff-card-header">
                        <span className="diff-topic">{item.topic}</span>
                        <span className={`diff-risk-badge ${item.risk_change}`}>
                          {item.risk_change === 'increased_risk' ? '⚠️ Increased Risk' : item.risk_change === 'decreased_risk' ? '✅ Better Protection' : 'ℹ️ Neutral'}
                        </span>
                      </div>

                      <div className="diff-grid">
                        <div className="diff-col col-a">
                          <span className="diff-col-label">Document A</span>
                          <p>{item.doc_a_term}</p>
                        </div>
                        <div className="diff-col col-b">
                          <span className="diff-col-label">Document B</span>
                          <p>{item.doc_b_term}</p>
                        </div>
                      </div>

                      <div className="diff-impact">
                        <strong>Practical Impact:</strong> {item.impact}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
