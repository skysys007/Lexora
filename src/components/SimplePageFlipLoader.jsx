import { useState, useEffect } from 'react';

const LOADING_STATUSES = [
  'Reading document content...',
  'Extracting key terms...',
  'Analyzing clauses...',
  'Preparing summary...'
];

export default function SimplePageFlipLoader({ message, statusMessage }) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="simple-loader-container">
      <h2 className="simple-loader-heading">{message || 'Reviewing your document'}</h2>

      {/* Ultra-simple basic page flip loader */}
      <div className="simple-book-icon">
        <div className="book-side left-side"></div>
        <div className="book-side right-side"></div>
        <div className="simple-flip-leaf"></div>
      </div>

      <p className="simple-loader-status">
        {statusMessage || LOADING_STATUSES[statusIndex]}
      </p>
    </div>
  );
}
