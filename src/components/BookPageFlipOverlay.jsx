import { useEffect, useRef } from 'react';

/**
 * 3D Page flip animation overlay component for page turning transitions.
 *
 * @param {Object} props
 * @param {boolean} [props.isFlipping=false] - Whether flip transition is active
 * @param {string} [props.direction='next'] - Flip direction ('next' | 'prev')
 * @param {Function} [props.onMidpoint] - Callback at 90-degree turning midpoint
 * @param {Function} [props.onComplete] - Callback when flip animation completes
 * @param {boolean} [props.isDark=false] - Dark theme flag
 */
export default function BookPageFlipOverlay({
  isFlipping = false,
  direction = 'next',
  onMidpoint = () => {},
  onComplete = () => {},
  isDark = false
}) {
  const onMidpointRef = useRef(onMidpoint);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onMidpointRef.current = onMidpoint;
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (!isFlipping) return;

    // Midpoint: switch views when page is perpendicular (at 90 degrees)
    const midTimer = setTimeout(() => {
      onMidpointRef.current?.();
    }, 400);

    // Complete animation
    const endTimer = setTimeout(() => {
      onCompleteRef.current?.();
    }, 800);

    return () => {
      clearTimeout(midTimer);
      clearTimeout(endTimer);
    };
  }, [isFlipping]);

  if (!isFlipping) return null;

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


