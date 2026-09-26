import { useState, useEffect } from 'react';
import { generateDocumentChecklist } from '../services/aiService';
import AudioReader from './AudioReader';

export default function ActionChecklist({ documentText, apiConfig, a11yConfig = {} }) {
  const [checklistData, setChecklistData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedItems, setCompletedItems] = useState({});

  useEffect(() => {
    if (!documentText || !apiConfig || !apiConfig.apiKey) return;

    let isMounted = true;
    setIsLoading(true);

    generateDocumentChecklist(documentText, apiConfig, a11yConfig)
      .then((raw) => {
        if (!isMounted) return;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            setChecklistData(JSON.parse(match[0]));
          }
        } catch {
          setChecklistData(null);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [documentText, apiConfig, a11yConfig]);

  const toggleItem = (key) => {
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="checklist-container loading" role="status" aria-live="polite">
        <p className="checklist-loading-text">Generating Action Checklist...</p>
      </div>
    );
  }

  if (!checklistData) {
    return (
      <div className="checklist-container empty">
        <h3>Actionable Document Checklist</h3>
        <p>No actionable checklist data generated yet. Upload a document to extract obligations and deadlines.</p>
      </div>
    );
  }

  const { deadlines = [], user_obligations = [], prohibitions = [], financial_commitments = [] } = checklistData;

  const spokenChecklistText = `
    Action checklist summary.
    ${deadlines.length} key deadlines.
    ${user_obligations.length} user obligations.
    ${prohibitions.length} prohibited actions.
    ${financial_commitments.length} financial commitments.
  `;

  return (
    <div className="checklist-container" role="region" aria-label="Actionable Document Checklist">
      <div className="checklist-header">
        <div>
          <h2>Actionable Document Checklist</h2>
          <p>Key deadlines, obligations, prohibited actions, and financial commitments extracted for your review.</p>
        </div>
        <AudioReader
          text={spokenChecklistText}
          label="Action Checklist Overview"
          lang={a11yConfig.language || 'en'}
          rate={a11yConfig.ttsSpeed || 1.0}
        />
      </div>

      <div className="checklist-grid">
        {/* Deadlines Section */}
        {deadlines.length > 0 && (
          <div className="checklist-card deadlines-card">
            <h3 className="checklist-card-title">📅 Key Deadlines & Timeframes</h3>
            <ul className="checklist-items">
              {deadlines.map((item, idx) => {
                const key = `d-${idx}`;
                return (
                  <li key={key} className={`checklist-item ${completedItems[key] ? 'checked' : ''}`}>
                    <label className="checkbox-item-label">
                      <input
                        type="checkbox"
                        checked={!!completedItems[key]}
                        onChange={() => toggleItem(key)}
                      />
                      <span>
                        <strong>{item.task}</strong> — <em className="timeframe-tag">{item.date_or_timeframe}</em>
                        {item.source && <small className="source-tag">({item.source})</small>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* User Obligations Section */}
        {user_obligations.length > 0 && (
          <div className="checklist-card obligations-card">
            <h3 className="checklist-card-title">📌 What You MUST Do (Obligations)</h3>
            <ul className="checklist-items">
              {user_obligations.map((item, idx) => {
                const key = `o-${idx}`;
                return (
                  <li key={key} className={`checklist-item ${completedItems[key] ? 'checked' : ''}`}>
                    <label className="checkbox-item-label">
                      <input
                        type="checkbox"
                        checked={!!completedItems[key]}
                        onChange={() => toggleItem(key)}
                      />
                      <span>
                        {item.importance === 'high' && <span className="high-importance-badge">High</span>}
                        {item.task}
                        {item.source && <small className="source-tag"> ({item.source})</small>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Prohibitions Section */}
        {prohibitions.length > 0 && (
          <div className="checklist-card prohibitions-card">
            <h3 className="checklist-card-title">🚫 What You CANNOT Do (Prohibitions)</h3>
            <ul className="checklist-items">
              {prohibitions.map((item, idx) => {
                const key = `p-${idx}`;
                return (
                  <li key={key} className={`checklist-item ${completedItems[key] ? 'checked' : ''}`}>
                    <label className="checkbox-item-label">
                      <input
                        type="checkbox"
                        checked={!!completedItems[key]}
                        onChange={() => toggleItem(key)}
                      />
                      <span>
                        {item.rule}
                        {item.source && <small className="source-tag"> ({item.source})</small>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Financial Commitments Section */}
        {financial_commitments.length > 0 && (
          <div className="checklist-card financial-card">
            <h3 className="checklist-card-title">💰 Financial Terms & Commitments</h3>
            <ul className="checklist-items">
              {financial_commitments.map((item, idx) => {
                const key = `f-${idx}`;
                return (
                  <li key={key} className={`checklist-item ${completedItems[key] ? 'checked' : ''}`}>
                    <label className="checkbox-item-label">
                      <input
                        type="checkbox"
                        checked={!!completedItems[key]}
                        onChange={() => toggleItem(key)}
                      />
                      <span>
                        <strong>{item.item}:</strong> {item.amount_or_terms}
                        {item.source && <small className="source-tag"> ({item.source})</small>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
