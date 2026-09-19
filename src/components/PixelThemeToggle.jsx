import { useState, useRef } from 'react';

export default function PixelThemeToggle({ isDark, onToggleTheme }) {
  const [animating, setAnimating] = useState(false);
  const [rippleStyle, setRippleStyle] = useState({});
  const [targetDark, setTargetDark] = useState(false);
  const buttonRef = useRef(null);

  const triggerThemeTransition = (e) => {
    if (animating) return;

    const nextDark = !isDark;

    const btnRect = buttonRef.current
      ? buttonRef.current.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: 40, width: 32, height: 32 };

    const epicenterX = btnRect.left + btnRect.width / 2;
    const epicenterY = btnRect.top + btnRect.height / 2;

    const maxRadius = Math.hypot(
      Math.max(epicenterX, window.innerWidth - epicenterX),
      Math.max(epicenterY, window.innerHeight - epicenterY)
    );

    if (document.startViewTransition) {
      document.documentElement.style.setProperty('--epicenter-x', `${epicenterX}px`);
      document.documentElement.style.setProperty('--epicenter-y', `${epicenterY}px`);
      document.documentElement.style.setProperty('--epicenter-radius', `${maxRadius * 1.1}px`);

      document.startViewTransition(() => {
        onToggleTheme(nextDark);
      });
      return;
    }

    setTargetDark(nextDark);
    setRippleStyle({
      left: `${epicenterX}px`,
      top: `${epicenterY}px`,
      width: `${maxRadius * 2.2}px`,
      height: `${maxRadius * 2.2}px`,
    });

    setAnimating(true);

    setTimeout(() => {
      onToggleTheme(nextDark);
    }, 220);

    setTimeout(() => {
      setAnimating(false);
    }, 450);
  };

  return (
    <>
      <div className="theme-toggle-wrapper">
        <div className={`theme-preview-circle ${isDark ? 'preview-light' : 'preview-dark'}`} />
        <button
          ref={buttonRef}
          className="theme-toggle-btn"
          onClick={triggerThemeTransition}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            /* Sun Icon */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            /* Moon Icon */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Ultra-smooth Radial Ripple Overlay */}
      {animating && (
        <div className="radial-overlay-container">
          <div
            className={`radial-theme-ripple ${targetDark ? 'dark-ripple' : 'light-ripple'}`}
            style={rippleStyle}
          />
        </div>
      )}
    </>
  );
}
