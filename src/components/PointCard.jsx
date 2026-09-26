import { memo } from 'react';
import AudioReader from './AudioReader';

/**
 * PointCard Component - Displays a structured critical point identified in the document.
 * @param {Object} props
 * @param {Object} props.point - Critical point data object
 * @param {Object} [props.a11yConfig] - Accessibility settings
 */
const PointCard = memo(function PointCard({ point, a11yConfig = {} }) {
  if (!point) return null;

  const isHighSeverity = point.severity === 'high';
  const badgeLabel = isHighSeverity ? 'Important Risk' : 'Worth Noting';
  const severityClass = point.severity || 'medium';

  const fullPointText = `
    ${point.title}.
    ${point.what_it_means ? 'What this means: ' + point.what_it_means : ''}.
    ${point.why_you_care ? 'Why you should care: ' + point.why_you_care : ''}.
    ${Array.isArray(point.your_options) && point.your_options.length ? 'Options: ' + point.your_options.join(', ') : ''}
  `;

  return (
    <article className="point-card" tabIndex={0} aria-label={`Critical point: ${point.title}`}>
      <header className="point-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`point-badge ${severityClass}`}>
            {isHighSeverity ? '⚠️ ' : 'ℹ️ '}
            {badgeLabel}
          </span>
          <h3 className="point-title" style={{ margin: 0 }}>{point.title}</h3>
        </div>

        <AudioReader
          text={fullPointText}
          label={point.title}
          compact={true}
          lang={a11yConfig.language || 'en'}
          rate={a11yConfig.ttsSpeed || 1.0}
        />
      </header>

      <div className="point-body">
        {point.what_it_means && (
          <div className="point-section">
            <p className="point-label">What this means</p>
            <p className="point-text">{point.what_it_means}</p>
          </div>
        )}

        {point.why_you_care && (
          <div className="point-section">
            <p className="point-label">Why you should care</p>
            <p className="point-text">{point.why_you_care}</p>
          </div>
        )}

        {Array.isArray(point.your_options) && point.your_options.length > 0 && (
          <div className="point-section">
            <p className="point-label">Your options</p>
            <ul className="point-options">
              {point.your_options.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {point.source_location && (
        <footer className="point-footer">
          <span className="point-location">📍 {point.source_location}</span>
        </footer>
      )}
    </article>
  );
});

export default PointCard;
