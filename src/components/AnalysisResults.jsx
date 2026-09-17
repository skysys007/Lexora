import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const riskColors = {
  low: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32', label: 'Low Risk' },
  medium: { bg: '#fff3e0', border: '#ff9800', text: '#e65100', label: 'Medium Risk' },
  high: { bg: '#fce4ec', border: '#f44336', text: '#c62828', label: 'High Risk' },
};

export default function AnalysisResults({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="results-container loading">
        <h2>Reviewing your document</h2>
        <div className="book-loader">
          <div className="page"></div>
          <div className="page"></div>
          <div className="page"></div>
          <div className="page"></div>
        </div>
        <p className="loading-text">Reading through the fine print...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-container empty">
        <h2>Awaiting Document</h2>
        <p>Upload a legal document to see what matters most.</p>
      </div>
    );
  }

  let parsedResults = null;
  try {
    const jsonString = results.replace(/```json\n?|\n?```/g, '').trim();
    parsedResults = JSON.parse(jsonString);
  } catch (e) {
    // Not valid JSON, fallback to markdown
  }

  if (parsedResults && parsedResults.critical_points) {
    const { document_type, one_line_summary, critical_points, risk_level, risk_reason } = parsedResults;
    const risk = riskColors[risk_level] || riskColors.medium;

    return (
      <div className="results-container">
        <div className="analysis-header">
          <h2>{document_type || "Document Analysis"}</h2>
          {one_line_summary && <p className="analysis-summary">{one_line_summary}</p>}
        </div>

        <div className="risk-banner" style={{ background: risk.bg, borderLeft: `4px solid ${risk.border}` }}>
          <span className="risk-label" style={{ color: risk.text }}>{risk.label}</span>
          {risk_reason && <p className="risk-reason" style={{ color: risk.text }}>{risk_reason}</p>}
        </div>

        {!critical_points || critical_points.length === 0 ? (
          <div className="no-issues">
            <p>This document looks straightforward with no major concerns.</p>
          </div>
        ) : (
          <div className="critical-points">
            {critical_points.map((point, i) => (
              <PointCard key={i} point={point} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="results-container">
      <h2>Document Analysis</h2>
      <div className="results-content markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{results}</ReactMarkdown>
      </div>
    </div>
  );
}

function PointCard({ point }) {
  return (
    <div className="point-card">
      <div className="point-header">
        <span className={`point-badge ${point.severity}`}>
          {point.severity === 'high' ? 'Important' : 'Worth noting'}
        </span>
        <h3 className="point-title">{point.title}</h3>
      </div>

      <div className="point-body">
        <div className="point-section">
          <p className="point-label">What this means</p>
          <p className="point-text">{point.what_it_means}</p>
        </div>

        <div className="point-section">
          <p className="point-label">Why you should care</p>
          <p className="point-text">{point.why_you_care}</p>
        </div>

        {point.your_options && point.your_options.length > 0 && (
          <div className="point-section">
            <p className="point-label">Your options</p>
            <ul className="point-options">
              {point.your_options.map((option, j) => (
                <li key={j}>{option}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {point.source_location && (
        <div className="point-footer">
          <span className="point-location">{point.source_location}</span>
        </div>
      )}
    </div>
  );
}
