import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SimplePageFlipLoader from './SimplePageFlipLoader';

const riskColors = {
  low: { bg: 'var(--risk-low-bg)', border: 'var(--risk-low-border)', text: 'var(--risk-low-text)', label: 'Low Risk' },
  medium: { bg: 'var(--risk-medium-bg)', border: 'var(--risk-medium-border)', text: 'var(--risk-medium-text)', label: 'Medium Risk' },
  high: { bg: 'var(--risk-high-bg)', border: 'var(--risk-high-border)', text: 'var(--risk-high-text)', label: 'High Risk' },
};

export default function AnalysisResults({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="results-container loading">
        <SimplePageFlipLoader message="Reviewing your document" />
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

    const handleExport = () => {
      let exportText = `# ${document_type || "Document Analysis"}\n\n`;
      if (one_line_summary) exportText += `Summary: ${one_line_summary}\n\n`;
      if (risk_level) exportText += `Risk Level: ${risk_level.toUpperCase()}\n`;
      if (risk_reason) exportText += `Risk Reason: ${risk_reason}\n\n`;
      exportText += `## Critical Points\n\n`;
      (critical_points || []).forEach((pt, i) => {
        exportText += `### ${i + 1}. ${pt.title} [${pt.severity?.toUpperCase()}]\n`;
        exportText += `- What it means: ${pt.what_it_means}\n`;
        exportText += `- Why you care: ${pt.why_you_care}\n`;
        if (pt.your_options && pt.your_options.length) {
          exportText += `- Options:\n` + pt.your_options.map(o => `  * ${o}`).join('\n') + '\n';
        }
        if (pt.source_location) exportText += `- Location: ${pt.source_location}\n`;
        exportText += `\n`;
      });

      const blob = new Blob([exportText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lexora-Analysis-Report.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="results-container">
        <div className="analysis-header">
          <div className="analysis-header-top">
            <h2>{document_type || "Document Analysis"}</h2>
            <button className="export-btn" onClick={handleExport} title="Download analysis report">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export Report
            </button>
          </div>
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
