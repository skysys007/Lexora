import { useEffect, useRef } from 'react';
import { trapFocus } from '../utils/a11yHelpers';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS, DEFAULT_A11Y_CONFIG } from '../constants/a11yConstants';

/**
 * Modal dialog component for user accessibility preferences (font size, dyslexic font, contrast, language).
 *
 * @param {Object} props
 * @param {Object} [props.config=DEFAULT_A11Y_CONFIG] - Current active accessibility configuration
 * @param {Function} [props.onChange=() => {}] - Callback when accessibility setting changes
 * @param {Function} [props.onClose=() => {}] - Callback to close modal
 */
export default function AccessibilityModal({ config = DEFAULT_A11Y_CONFIG, onChange = () => {}, onClose = () => {} }) {
  const modalRef = useRef(null);
  const safeConfig = config || DEFAULT_A11Y_CONFIG;
  const currentLang = safeConfig.language || 'en';
  const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS.en;

  useEffect(() => {
    const cleanupFocusTrap = trapFocus(modalRef.current);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cleanupFocusTrap();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const updateSetting = (key, value) => {
    onChange({
      ...safeConfig,
      [key]: value,
    });
  };

  return (
    <div className="dev-overlay" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="a11y-panel dev-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-title"
      >
        <div className="dev-panel-header">
          <div className="a11y-header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <h3 id="a11y-title">{t.a11ySettings}</h3>
          </div>
          <button className="dev-close" onClick={onClose} aria-label={t.close}>
            &times;
          </button>
        </div>

        <div className="dev-tab-content">
          <div className="dev-section">
            {/* Visual & Typography Settings */}
            <div className="a11y-section-title">Visual & Typography</div>

            <div className="dev-field">
              <label htmlFor="a11y-font-size">{t.fontSize}</label>
              <div className="a11y-segmented-control" id="a11y-font-size">
                <button
                  type="button"
                  className={safeConfig.fontSize === 'normal' ? 'active' : ''}
                  onClick={() => updateSetting('fontSize', 'normal')}
                >
                  Normal (100%)
                </button>
                <button
                  type="button"
                  className={safeConfig.fontSize === 'large' ? 'active' : ''}
                  onClick={() => updateSetting('fontSize', 'large')}
                >
                  Large (115%)
                </button>
                <button
                  type="button"
                  className={safeConfig.fontSize === 'xlarge' ? 'active' : ''}
                  onClick={() => updateSetting('fontSize', 'xlarge')}
                >
                  XL (130%)
                </button>
              </div>
            </div>

            <div className="dev-field checkbox-field">
              <label htmlFor="a11y-dyslexic-toggle" className="checkbox-label">
                <input
                  id="a11y-dyslexic-toggle"
                  type="checkbox"
                  checked={!!safeConfig.dyslexicFont}
                  onChange={(e) => updateSetting('dyslexicFont', e.target.checked)}
                />
                <span>{t.dyslexicFont}</span>
              </label>
            </div>

            <div className="dev-field checkbox-field">
              <label htmlFor="a11y-line-spacing-toggle" className="checkbox-label">
                <input
                  id="a11y-line-spacing-toggle"
                  type="checkbox"
                  checked={safeConfig.lineSpacing === 'increased'}
                  onChange={(e) => updateSetting('lineSpacing', e.target.checked ? 'increased' : 'normal')}
                />
                <span>{t.lineSpacing}</span>
              </label>
            </div>

            <div className="dev-field checkbox-field">
              <label htmlFor="a11y-high-contrast-toggle" className="checkbox-label">
                <input
                  id="a11y-high-contrast-toggle"
                  type="checkbox"
                  checked={!!safeConfig.highContrast}
                  onChange={(e) => updateSetting('highContrast', e.target.checked)}
                />
                <span>{t.highContrast}</span>
              </label>
            </div>

            <div className="dev-field checkbox-field">
              <label htmlFor="a11y-reduced-motion-toggle" className="checkbox-label">
                <input
                  id="a11y-reduced-motion-toggle"
                  type="checkbox"
                  checked={!!safeConfig.reducedMotion}
                  onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                />
                <span>{t.reducedMotion}</span>
              </label>
            </div>

            {/* Language & Cognitive Assistance */}
            <div className="a11y-section-title" style={{ marginTop: '1.25rem' }}>Language & Speech Assistance</div>

            <div className="dev-field checkbox-field">
              <label htmlFor="a11y-simplified-lang-toggle" className="checkbox-label">
                <input
                  id="a11y-simplified-lang-toggle"
                  type="checkbox"
                  checked={!!safeConfig.simplifiedLanguage}
                  onChange={(e) => updateSetting('simplifiedLanguage', e.target.checked)}
                />
                <span>{t.simplifiedLang}</span>
              </label>
            </div>

            <div className="dev-field">
              <label htmlFor="a11y-language-select">{t.uiLanguage}</label>
              <select
                id="a11y-language-select"
                value={safeConfig.language || 'en'}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="a11y-select"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="dev-panel-actions">
          <div className="actions-right" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <button type="button" className="dev-save" onClick={onClose}>
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

