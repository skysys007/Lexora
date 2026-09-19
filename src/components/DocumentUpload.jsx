import { useState, useRef } from 'react';

export default function DocumentUpload({ onProcessDocument, onProcessText }) {
  const [inputMode, setInputMode] = useState('pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      alert('Please upload a PDF or Image file (PNG, JPG, WEBP).');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      await onProcessDocument(file);
    } catch (error) {
      console.error("Error processing document:", error);
      alert("Failed to process document: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);

    try {
      await onProcessText(textInput);
    } catch (error) {
      console.error("Error processing text:", error);
      alert("Failed to process text.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-mode-tabs">
        <button
          className={`upload-mode-tab ${inputMode === 'pdf' ? 'active' : ''}`}
          onClick={() => setInputMode('pdf')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          PDF / Image
        </button>
        <button
          className={`upload-mode-tab ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Paste Text
        </button>
      </div>

      <div key={inputMode} className="tab-panel-animated">
        {inputMode === 'pdf' ? (
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''} ${fileName ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/bmp"
              onChange={handleFileChange}
              hidden
              disabled={isProcessing}
            />

            {isProcessing ? (
              <div className="dropzone-content loading-buffer-box">
                <div className="buffer-spinner-container">
                  <div className="buffer-spinner-ring"></div>
                </div>
                <div className="loading-buffer-track">
                  <div className="loading-buffer-progress"></div>
                </div>
                <p className="dropzone-text">Analyzing & OCR scanning...</p>
                <p className="dropzone-hint">Buffering document data</p>
              </div>
            ) : fileName ? (
              <div className="dropzone-content">
                <div className="dropzone-icon file-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <p className="dropzone-filename">{fileName}</p>
                <p className="dropzone-hint">Click or drop to replace</p>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <p className="dropzone-text">Drag & drop PDF or Image document</p>
                <p className="dropzone-hint">PDF, PNG, JPG, WEBP (Image Recognition OCR)</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-input-box">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your legal document text here..."
              disabled={isProcessing}
              rows={8}
            />
            <button 
              className="text-submit-button"
              onClick={handleTextSubmit}
              disabled={isProcessing || !textInput.trim()}
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
