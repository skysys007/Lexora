import { useState } from 'react';

export default function DevPanel({ config, onConfigChange, onClose }) {
  const [tempConfig, setTempConfig] = useState({ ...config });

  const handleSave = () => {
    onConfigChange(tempConfig);
    onClose();
  };

  return (
    <div className="dev-overlay" onClick={onClose}>
      <div className="dev-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dev-panel-header">
          <h3>Dev Settings</h3>
          <button className="dev-close" onClick={onClose}>&times;</button>
        </div>

        <div className="dev-tab-content">
          <div className="dev-section">
            <div className="dev-field">
              <label>API Key</label>
              <input
                type="password"
                value={tempConfig.apiKey}
                onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
            <div className="dev-field">
              <label>Endpoint</label>
              <input
                type="text"
                value={tempConfig.endpoint}
                onChange={(e) => setTempConfig({ ...tempConfig, endpoint: e.target.value })}
              />
            </div>
            <div className="dev-field">
              <label>Model</label>
              <input
                type="text"
                value={tempConfig.model}
                onChange={(e) => setTempConfig({ ...tempConfig, model: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="dev-panel-actions">
          <button className="dev-cancel" onClick={onClose}>Cancel</button>
          <button className="dev-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
