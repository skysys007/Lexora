import { memo } from 'react';

/**
 * PointCard Component - Displays a structured critical point card identified in a document.
 * @component
 * @param {Object} props - Component properties
 * @param {Object} props.point - Critical point data object
 * @param {string} [props.point.title] - Point title
 * @param {string} [props.point.severity] - Risk severity level ('high' | 'medium' | 'low')
 * @param {string} [props.point.what_it_means] - Explanation of the clause
 * @param {string} [props.point.why_you_care] - Practical impact explanation
 * @param {Array<string>} [props.point.your_options] - Actionable user options
 * @param {string} [props.point.source_location] - Section or page citation
 * @param {Object} [props.a11yConfig={}] - Accessibility configuration object
 * @returns {JSX.Element|null} Rendered PointCard element
 */
const PointCard = memo(function PointCard({ point, a11yConfig = {} }) {
  if (!point || typeof point !== 'object') return null;

  const titleText = String(point.title || 'Critical Point');
  const isHighSeverity = point.severity === 'high';
  const badgeLabel = isHighSeverity ? 'Important Risk' : 'Worth Noting';
  const severityClass = String(point.severity || 'medium');

  return (
    <article className="point-card" tabIndex={0} aria-label={`Critical point: ${titleText}`}>
      <header className="point-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`point-badge ${severityClass}`}>
            {badgeLabel}
          </span>
          <h3 className="point-title" style={{ margin: 0 }}>{titleText}</h3>
        </div>
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
          <span className="point-location">Location: {point.source_location}</span>
        </footer>
      )}
    </article>
  );
});

export default PointCard;
