import { useState, useEffect } from 'react';

export default function BookPageFlipOverlay({ isFlipping, direction = 'next', onMidpoint, onComplete, isDark }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'flipping'

  useEffect(() => {
    if (isFlipping) {
      setPhase('flipping');

      // Midpoint: switch views when page is perpendicular (at 90 degrees)
      const midTimer = setTimeout(() => {
        if (onMidpoint) onMidpoint();
      }, 400);

      // Complete animation
      const endTimer = setTimeout(() => {
        setPhase('idle');
        if (onComplete) onComplete();
      }, 800);

      return () => {
        clearTimeout(midTimer);
        clearTimeout(endTimer);
      };
    }
  }, [isFlipping]);

  if (phase === 'idle') return null;

  return (
    <div className={`book-flip-stage ${isDark ? 'dark-mode' : ''}`}>
      {/* 3D Turning Leaf */}
      <div className={`book-flip-leaf ${direction === 'prev' ? 'flip-backward' : 'flip-forward'}`}>
        {/* Front of the turning page */}
        <div className="leaf-face leaf-front">
          <div className="leaf-content" />
          <div className="leaf-curl-shadow" />
        </div>

        {/* Back of the turning page */}
        <div className="leaf-face leaf-back">
          <div className="leaf-content" />
          <div className="leaf-curl-shadow-back" />
        </div>
      </div>

      {/* Dynamic Spine Shadow cast on the base page */}
      <div className="book-spine-shadow" />
    </div>
  );
}
