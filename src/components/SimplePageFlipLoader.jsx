import { useState, useEffect } from 'react';
import { LOADING_STATUSES } from '../constants/appConstants';

/**
 * Animated page flip loader with rotating status indicators.
 *
 * @param {Object} props
 * @param {string} [props.message="Reviewing your document"] - Primary loader title
 * @param {string} [props.statusMessage] - Custom status message string
 */
export default function SimplePageFlipLoader({ message = 'Reviewing your document', statusMessage = '' }) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="simple-loader-container">
      <h2 className="simple-loader-heading">{message}</h2>

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

