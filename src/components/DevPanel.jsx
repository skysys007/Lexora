import { useState, useEffect, useRef } from 'react';
import { trapFocus } from '../utils/a11yHelpers';

export default function DevPanel({ config, onConfigChange, onClose }) {
  const [tempConfig, setTempConfig] = useState({ ...config });
  const [showApiKey, setShowApiKey] = useState(false);
  const modalRef = useRef(null);

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

  const handleSave = () => {
    const sanitizedKey = (tempConfig.apiKey || '').trim();
    const sanitizedEndpoint = (tempConfig.endpoint || '').trim();
    const sanitizedModel = (tempConfig.model || '').trim();

    if (sanitizedEndpoint && !sanitizedEndpoint.startsWith('https://') && !sanitizedEndpoint.startsWith('http://localhost') && !sanitizedEndpoint.startsWith('http://127.0.0.1')) {
      alert("Security Error: API Endpoint must begin with https:// or http://localhost");
      return;
    }

    onConfigChange({
      ...tempConfig,
      apiKey: sanitizedKey,
      endpoint: sanitizedEndpoint,
      model: sanitizedModel
    });
    onClose();
  };

  const handlePurgeCredentials = () => {
    if (confirm("Are you sure you want to purge your stored API credentials from browser memory?")) {
      setTempConfig({ ...tempConfig, apiKey: '' });
      onConfigChange({ ...tempConfig, apiKey: '' });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="dev-overlay" onClick={onClose} role="presentation">
      <div 
        ref={modalRef}
        className="dev-panel" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dev-panel-title"
      >
        <div className="dev-panel-header">
          <h3 id="dev-panel-title">Dev Settings</h3>
          <button className="dev-close" onClick={onClose} aria-label="Close Dev Settings">&times;</button>
        </div>

        <div className="dev-tab-content">
          <div className="dev-section">
            <div className="dev-field">
              <div className="dev-field-header">
                <label htmlFor="api-key-input">API Key</label>
                <button 
                  type="button" 
                  className="toggle-key-visibility" 
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Hide Key' : 'Show Key'}
                </button>
              </div>
              <input
                id="api-key-input"
                type={showApiKey ? "text" : "password"}
                value={tempConfig.apiKey || ''}
                onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                onKeyDown={handleInputKeyDown}
                placeholder="gsk_..."
                autoComplete="off"
              />
            </div>
            <div className="dev-field">
              <label htmlFor="api-endpoint-input">Endpoint</label>
              <input
                id="api-endpoint-input"
                type="text"
                value={tempConfig.endpoint || ''}
                onChange={(e) => setTempConfig({ ...tempConfig, endpoint: e.target.value })}
                onKeyDown={handleInputKeyDown}
              />
            </div>
            <div className="dev-field">
              <label htmlFor="api-model-input">Model</label>
              <input
                id="api-model-input"
                type="text"
                value={tempConfig.model || ''}
                onChange={(e) => setTempConfig({ ...tempConfig, model: e.target.value })}
                onKeyDown={handleInputKeyDown}
              />
            </div>
          </div>
        </div>

        <div className="dev-panel-actions">
          {tempConfig.apiKey && (
            <button type="button" className="dev-purge-btn" onClick={handlePurgeCredentials}>
              Purge Stored Key
            </button>
          )}
          <div className="actions-right">
            <button className="dev-cancel" onClick={onClose}>Cancel</button>
            <button className="dev-save" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
