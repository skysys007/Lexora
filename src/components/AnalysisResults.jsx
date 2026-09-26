import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SimplePageFlipLoader from './SimplePageFlipLoader';
import PointCard from './PointCard';
import AudioReader from './AudioReader';
import { RISK_COLOR_PALETTE } from '../constants/appConstants';
import { announceToScreenReader } from '../utils/a11yHelpers';
import { UI_TRANSLATIONS } from '../constants/a11yConstants';

const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('data:') || clean.startsWith('vbscript:')) {
    return '#';
  }
  return url;
};

export default function AnalysisResults({ results, isLoading, a11yConfig = {} }) {
  const currentLang = a11yConfig.language || 'en';
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.en;

  useEffect(() => {
    if (isLoading) {
      announceToScreenReader("Document analysis in progress. Please wait...", "polite");
    } else if (results) {
      announceToScreenReader("Document analysis completed.", "assertive");
    }
  }, [isLoading, results]);

  if (isLoading) {
    return (
      <div className="results-container loading" role="status" aria-live="polite">
        <SimplePageFlipLoader message="Reviewing your document..." />
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
  if (typeof results === 'string') {
    try {
      const jsonMatch = results.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Not valid JSON, fallback to markdown rendering
    }
  }

  if (parsedResults && parsedResults.critical_points) {
    const { document_type, one_line_summary, critical_points, risk_level, risk_reason } = parsedResults;
    const risk = RISK_COLOR_PALETTE[risk_level] || RISK_COLOR_PALETTE.medium;

    const riskIcon = risk_level === 'high' ? '🛑 ' : risk_level === 'medium' ? '⚠️ ' : '✅ ';
    const riskLabelText = risk_level === 'high' ? t.highRisk : risk_level === 'medium' ? t.mediumRisk : t.lowRisk;

    const fullAnalysisSpeech = `
      ${document_type || "Document Analysis"}.
      ${one_line_summary ? "Summary: " + one_line_summary : ""}.
      ${risk_level ? "Overall Risk Level: " + riskLabelText : ""}.
      ${risk_reason ? "Risk Reason: " + risk_reason : ""}.
      Number of critical points: ${critical_points ? critical_points.length : 0}.
    `;

    const handleExport = () => {
      let exportText = `# ${document_type || "Document Analysis"}\n\n`;
      if (one_line_summary) exportText += `Summary: ${one_line_summary}\n\n`;
      if (risk_level) exportText += `Risk Level: ${risk_level.toUpperCase()}\n`;
      if (risk_reason) exportText += `Risk Reason: ${risk_reason}\n\n`;
      exportText += `## Critical Points\n\n`;
      (critical_points || []).forEach((pt, i) => {
        exportText += `### ${i + 1}. ${pt.title} [${pt.severity?.toUpperCase() || 'INFO'}]\n`;
        if (pt.what_it_means) exportText += `- What it means: ${pt.what_it_means}\n`;
        if (pt.why_you_care) exportText += `- Why you care: ${pt.why_you_care}\n`;
        if (pt.your_options && pt.your_options.length) {
          exportText += `- Options:\n` + pt.your_options.map(o => `  * ${o}`).join('\n') + '\n';
        }
        if (pt.source_location) exportText += `- Location: ${pt.source_location}\n`;
        exportText += `\n`;
      });

      const blob = new Blob([exportText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lexora-Analysis-Report.md`;
        a.click();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    };

    return (
      <div className="results-container" role="region" aria-label="Analysis Results">
        <div className="analysis-header">
          <div className="analysis-header-top">
            <h2>{document_type || "Document Analysis"}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <AudioReader
                text={fullAnalysisSpeech}
                label="Full Analysis Summary"
                lang={currentLang}
                rate={a11yConfig.ttsSpeed || 1.0}
              />
              <button className="export-btn" onClick={handleExport} title="Download analysis report" aria-label="Export report as markdown file">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {t.exportReport || 'Export Report'}
              </button>
            </div>
          </div>
          {one_line_summary && <p className="analysis-summary">{one_line_summary}</p>}
        </div>

        <div
          className="risk-banner"
          style={{ background: risk.bg, borderLeft: `4px solid ${risk.border}` }}
          role="region"
          aria-label={`Risk Assessment: ${riskLabelText}`}
        >
          <span className="risk-label" style={{ color: risk.text }}>
            {riskIcon} {riskLabelText}
          </span>
          {risk_reason && <p className="risk-reason" style={{ color: risk.text }}>{risk_reason}</p>}
        </div>

        {!critical_points || critical_points.length === 0 ? (
          <div className="no-issues">
            <p>This document looks straightforward with no major concerns.</p>
          </div>
        ) : (
          <div className="critical-points" role="list" aria-label="Critical Points">
            {critical_points.map((point, i) => (
              <PointCard key={i} point={point} a11yConfig={a11yConfig} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="results-container" role="region" aria-label="Document Analysis Output">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Document Analysis</h2>
        <AudioReader
          text={results}
          label="Document Analysis Output"
          lang={currentLang}
          rate={a11yConfig.ttsSpeed || 1.0}
        />
      </div>
      <div className="results-content markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={sanitizeUrl}>{results}</ReactMarkdown>
      </div>
    </div>
  );
}
